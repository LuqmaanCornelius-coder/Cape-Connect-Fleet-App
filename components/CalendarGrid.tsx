'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Booking, Vehicle } from '@/lib/storage';

interface CalendarGridProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  onSelectDate: (date: Date) => void;
  onSelectBooking: (booking: Booking) => void;
}

export default function CalendarGrid({ 
  bookings, 
  vehicles, 
  onSelectDate, 
  onSelectBooking 
}: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const getMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  // Generate grid
  const firstDayIndexOffset = firstDayIndex;
  const totalSlots = Math.ceil((firstDayIndexOffset + daysInMonth) / 7) * 7;
  const gridDates: Date[] = [];
  for (let i = 0; i < totalSlots; i++) {
    gridDates.push(new Date(year, month, 1 - firstDayIndexOffset + i));
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < gridDates.length; i += 7) {
    weeks.push(gridDates.slice(i, i + 7));
  }

  const getBookingsOnDate = (date: Date): Booking[] => {
    const checkTime = getMidnight(date);
    return bookings.filter(b => {
      const start = getMidnight(new Date(b.start_date));
      const end = getMidnight(new Date(b.end_date));
      return checkTime >= start && checkTime <= end;
    });
  };

  const getBookingColor = (b: Booking) => {
    if (b.is_rented_vehicle) return '#6366F1';
    const vehicle = vehicles.find(v => v.registration_no === b.assigned_vehicle_reg);
    return vehicle?.color || '#FFB81C';
  };

  const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 shadow-xl text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-[#374151] rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-xl font-bold text-[#FFB81C]">{monthNames[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-[#374151] rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <button onClick={jumpToToday} className="bg-[#374151] hover:bg-[#4B5563] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> Today
        </button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-px bg-[#111827] rounded-t-xl mb-1">
        {dayLabels.map(day => (
          <div key={day} className="bg-[#1F2937] py-2 text-center text-xs font-bold text-[#9CA3AF]">{day}</div>
        ))}
      </div>

      {/* Calendar Body */}
      <div className="relative grid grid-cols-7 gap-px bg-[#111827] rounded-b-xl">
        {weeks.flat().map((date, idx) => {
          const isCurrentMonth = date.getMonth() === month;
          const dayBookings = getBookingsOnDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(date)}
              className={`min-h-[110px] p-1.5 border border-[#374151] hover:bg-[#2A3749] cursor-pointer relative ${!isCurrentMonth ? 'opacity-60' : ''}`}
            >
              <div className="text-right">
                <span className={`text-sm font-bold ${isToday ? 'text-[#FFB81C]' : ''}`}>
                  {date.getDate()}
                </span>
              </div>

              {/* Multi-day spanning booking bars */}
              <div className="absolute inset-x-0 bottom-1 px-1 space-y-0.5">
                {dayBookings.slice(0, 3).map((booking, i) => {
                  const startDate = new Date(booking.start_date);
                  const endDate = new Date(booking.end_date);
                  const spansMultipleDays = startDate.getDate() !== endDate.getDate() || startDate.getMonth() !== endDate.getMonth();

                  return (
                    <div
                      key={i}
                      onClick={(e) => { e.stopPropagation(); onSelectBooking(booking); }}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#374151] hover:bg-[#4B5563] text-white font-medium truncate cursor-pointer transition-colors"
                      title={`${booking.client_name} • ${booking.route}`}
                    >
                      {booking.client_name}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
