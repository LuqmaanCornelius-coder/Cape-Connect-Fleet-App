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

const PALETTE_COLORS = [
  '#FFB81C', // Gold (primary)
  '#007A4D', // SA Green
  '#DE3831', // Red
  '#002395', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export default function CalendarGrid({ 
  bookings, 
  vehicles, 
  onSelectDate, 
  onSelectBooking 
}: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const getMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

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
    if (vehicle?.color) return vehicle.color;
    const hash = b.invoice_no.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PALETTE_COLORS[hash % PALETTE_COLORS.length];
  };

  const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 shadow-xl text-white">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-[#374151] rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-[#FFB81C]">
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-[#374151] rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={jumpToToday}
          className="bg-[#374151] hover:bg-[#4B5563] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Today
        </button>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-px bg-[#111827] rounded-xl overflow-hidden mb-1">
        {dayLabels.map((day, idx) => (
          <div key={idx} className="bg-[#1F2937] p-2 text-center text-xs font-bold text-[#9CA3AF]">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-[#111827] rounded-xl overflow-hidden">
        {weeks.map((week, weekIdx) => (
          <React.Fragment key={weekIdx}>
            {week.map((date, dayIdx) => {
              const isCurrentMonth = date.getMonth() === month;
              const dayBookings = getBookingsOnDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={dayIdx}
                  onClick={() => onSelectDate(date)}
                  className={`min-h-[110px] p-2 flex flex-col border border-[#374151] hover:bg-[#2A3749] cursor-pointer transition-all relative ${
                    !isCurrentMonth ? 'bg-[#111827] opacity-60' : 'bg-[#1F2937]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold ${isToday ? 'text-[#FFB81C]' : isCurrentMonth ? 'text-white' : 'text-[#6B7280]'}`}>
                      {date.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <div className="w-2 h-2 bg-[#FFB81C] rounded-full mt-1" />
                    )}
                  </div>

                  {/* Booking bars */}
                  <div className="flex-1 relative mt-1">
                    {dayBookings.slice(0, 3).map((booking, i) => (
                      <div
                        key={i}
                        onClick={(e) => { e.stopPropagation(); onSelectBooking(booking); }}
                        className="text-[10px] px-1.5 py-0.5 mb-0.5 rounded bg-[#374151] text-white truncate cursor-pointer hover:bg-[#4B5563] transition-colors"
                        title={`${booking.client_name} - ${booking.route}`}
                      >
                        {booking.client_name}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[9px] text-[#9CA3AF] mt-1">+{dayBookings.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
