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

  const gridDates = [];
  for (let i = 0; i < 42; i++) { // 6 weeks
    gridDates.push(new Date(year, month, 1 - firstDayIndex + i));
  }

  const weeks = [];
  for (let i = 0; i < gridDates.length; i += 7) {
    weeks.push(gridDates.slice(i, i + 7));
  }

  const getBookingColor = (b: Booking) => b.is_rented_vehicle ? '#6366F1' : '#FFB81C';

  const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 shadow-xl text-white overflow-hidden relative">
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

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-[#111827] rounded-b-xl relative" style={{ height: 'auto' }}>
        {weeks.flatMap((week, weekIdx) => 
          week.map((date, dayIdx) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div
                key={`${weekIdx}-${dayIdx}`}
                onClick={() => onSelectDate(date)}
                className={`min-h-[100px] p-1 border border-[#374151] hover:bg-[#2A3749] cursor-pointer relative ${!isCurrentMonth ? 'bg-[#111827] opacity-70' : 'bg-[#1F2937]'}`}
              >
                <div className="text-right text-sm font-bold mb-1">
                  {date.getDate()}
                </div>

                {/* Spanning Booking Bars */}
                <div className="absolute inset-x-0 bottom-0 h-6 flex items-center px-0.5 overflow-hidden">
                  {bookings
                    .filter(b => {
                      const start = new Date(b.start_date);
                      const end = new Date(b.end_date);
                      return date >= start && date <= end;
                    })
                    .slice(0, 2)
                    .map((booking, i) => (
                      <div
                        key={i}
                        onClick={(e) => { e.stopPropagation(); onSelectBooking(booking); }}
                        className="h-5 mx-0.5 rounded bg-[#FFB81C] text-black text-[9px] font-bold flex items-center px-1.5 cursor-pointer hover:brightness-110 transition-all overflow-hidden whitespace-nowrap"
                        style={{
                          minWidth: '60px',
                          maxWidth: '100%',
                        }}
                        title={`${booking.client_name} (${booking.route})`}
                      >
                        {booking.client_name}
                      </div>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
