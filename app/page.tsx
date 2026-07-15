'use client';
import React, { useState, useEffect } from 'react';
import AuthContainer from '@/components/AuthContainer';
import DriverDashboard from '@/components/DriverDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import { Profile, syncAllFromSupabase } from '@/lib/storage';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  // Restore authenticated session on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      const storedUser = localStorage.getItem('inyathi_auth_user');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to restore session:", e);
          localStorage.removeItem('inyathi_auth_user');
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle data synchronization when user session is active
  useEffect(() => {
    if (currentUser) {
      syncAllFromSupabase().then(() => {
        setSyncVersion(v => v + 1);
      }).catch(err => {
        console.error("Background sync failed:", err);
      });
    }
  }, [currentUser]);

  const handleLoginSuccess = (profile: Profile) => {
    setCurrentUser(profile);
    localStorage.setItem('inyathi_auth_user', JSON.stringify(profile));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('inyathi_auth_user');
  };

  // Prevent hydration flash mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FFB81C] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-black tracking-widest text-[#9CA3AF] uppercase animate-pulse">
            Loading CAPE CONNECT Fleet System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#111827] text-[#E5E7EB]">
      {currentUser ? (
        currentUser.role === 'admin' ? (
          <AdminDashboard 
            key={`admin-${syncVersion}`} 
            admin={currentUser} 
            onLogout={handleLogout} 
          />
        ) : (
          <DriverDashboard 
            key={`driver-${syncVersion}`} 
            driver={currentUser} 
            onLogout={handleLogout} 
          />
        )
      ) : (
        <AuthContainer onLoginSuccess={handleLoginSuccess} />
      )}
    </main>
  );
}
