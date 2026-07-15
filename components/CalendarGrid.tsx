'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Booking, Vehicle } from '@/lib/storage';

interface CalendarGridProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  onSelectDate: (date: Date) => void;
  onSelectBooking: (booking: Booking) => void;
}

const PALETTE_COLORS = ['#FFB81C', '#007A4D', '#DE3831', '#002395'];

export default function CalendarGrid({
  bookings,
  vehicles,
  onSelectDate,
  onSelectBooking,
}: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const { weeks, allDates } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalSlots = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;

    const gridDates: Date[] = [];
    for (let i = 0; i < totalSlots; i++) {
      gridDates.push(new Date(year, month, 1 - firstDayIndex + i));
    }

    const weeks: Date[][] = [];
    for (let i = 0; i < gridDates.length; i += 7) {
      weeks.push(gridDates.slice(i, i + 7));
    }

    return { weeks, allDates: gridDates };
  }, [year, month]);

  const getMidnight = (d: Date | string) => 
    new Date(new Date(d).getFullYear(), new Date(d).getMonth(), new Date(d).getDate()).getTime();

  const getBookingColor = (b: Booking) => {
    if (b.is_rented_vehicle) return '#6366F1';
    const vehicle = vehicles.find(v => v.registration_no === b.assigned_vehicle_reg);
    if (vehicle?.color) return vehicle.color;
    const hash = b.invoice_no.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PALETTE_COLORS[hash % PALETTE_COLORS.length];
  };

  // Get bookings that touch this month
  const monthBookings = useMemo(() => {
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 0).getTime();

    return bookings.filter(b => {
      const start = getMidnight(b.start_date);
      const end = getMidnight(b.end_date);
      return end >= monthStart && start <= monthEnd;
    });
  }, [bookings, year, month]);

  const isToday = (date: Date) => new Date().toDateString() === date.toDateString();

  const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 shadow-xl text-white overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-[#374151] rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-[#FFB81C]">{monthNames[month]} {year}</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-[#374151] rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={() => setCurrentDate(new Date())} className="bg-[#374151] hover:bg-[#4B5563] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> Today
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-px bg-[#111827] rounded-t-xl mb-1">
        {dayLabels.map(day => (
          <div key={day} className="bg-[#1F2937] py-2 text-center text-xs font-bold text-[#9CA3AF]">{day}</div>
        ))}
      </div>

      {/* Calendar Grid with Booking Bars Overlay */}
      <div className="relative">
        {/* Booking Bars Layer */}
        <div className="absolute inset-0 grid grid-cols-7 gap-px pointer-events-none z-10">
          {monthBookings.map((booking, idx) => {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);
            const color = getBookingColor(booking);

            return (
              <div
                key={`${booking.invoice_no}-${idx}`}
                className="relative h-full"
                style={{
                  gridColumn: 'span 7',
                  marginTop: `${idx * 22 + 48}px`, // stagger bars vertically
                }}
              >
                <div
                  onClick={(e) => { e.stopPropagation(); onSelectBooking(booking); }}
                  className="absolute h-5 rounded cursor-pointer hover:brightness-110 transition-all flex items-center px-2 text-xs font-medium text-white shadow-sm"
                  style={{
                    backgroundColor: color,
                    left: '0',
                    right: '0',
                    top: '0',
                    opacity: 0.9,
                    minWidth: '20px',
                  }}
                  title={`${booking.client_name} - ${booking.route || ''}`}
                >
                  <span className="truncate">{booking.client_name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 gap-px bg-[#111827] rounded-b-xl overflow-hidden relative z-20">
          {weeks.map((week, weekIdx) => (
            <React.Fragment key={weekIdx}>
              {week.map((date) => {
                const isCurrentMonth = date.getMonth() === month;
                const today = isToday(date);
                const dayBookings = bookings.filter(b => {
                  const d = getMidnight(date);
                  return d >= getMidnight(b.start_date) && d <= getMidnight(b.end_date);
                });

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => onSelectDate(date)}
                    className={`min-h-[110px] p-2 flex flex-col border border-[#374151] hover:bg-[#2A3749] cursor-pointer transition-all relative
                      ${!isCurrentMonth ? 'bg-[#111827] opacity-70' : 'bg-[#1F2937]'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-bold ${today ? 'text-[#FFB81C]' : isCurrentMonth ? 'text-white' : 'text-[#6B7280]'}`}>
                        {date.getDate()}
                      </span>
                      {dayBookings.length > 0 && <div className="w-1.5 h-1.5 bg-[#FFB81C] rounded-full mt-1" />}
                    </div>

                    {/* Small client names fallback (if needed) */}
                    <div className="flex-1 text-[9px] space-y-0.5 overflow-hidden">
                      {dayBookings.slice(0, 2).map((b, i) => (
                        <div key={i} className="truncate text-white/80" onClick={(e) => { e.stopPropagation(); onSelectBooking(b); }}>
                          {b.client_name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
