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

  // Calculate position and span for each booking
  const bookingBars = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    return bookings
      .map((booking, index) => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);

        // Only show bookings that overlap this month
        if (end < monthStart || start > monthEnd) return null;

        // Clamp to current month
        const displayStart = start < monthStart ? monthStart : start;
        const displayEnd = end > monthEnd ? monthEnd : end;

        // Find positions in the grid
        const startIndex = allDates.findIndex(d => 
          d.getFullYear() === displayStart.getFullYear() &&
          d.getMonth() === displayStart.getMonth() &&
          d.getDate() === displayStart.getDate()
        );

        const endIndex = allDates.findIndex(d => 
          d.getFullYear() === displayEnd.getFullYear() &&
          d.getMonth() === displayEnd.getMonth() &&
          d.getDate() === displayEnd.getDate()
        );

        if (startIndex === -1 || endIndex === -1) return null;

        const startCol = (startIndex % 7) + 1; // 1-based for grid-column
        const span = endIndex - startIndex + 1;

        return {
          booking,
          startCol,
          span,
          color: getBookingColor(booking),
          row: Math.floor(startIndex / 7),
          index,
        };
      })
      .filter(Boolean);
  }, [bookings, allDates, year, month]);

  const isToday = (date: Date) => new Date().toDateString() === date.toDateString();
  const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 shadow-xl text-white overflow-hidden">
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

      <div className="relative">
        {/* Spanning Booking Bars */}
        <div className="absolute inset-0 grid grid-cols-7 gap-px z-10 pointer-events-none">
          {bookingBars.map(({ booking, startCol, span, color }, idx) => (
            <div
              key={`${booking.invoice_no}-${idx}`}
              className="relative"
              style={{
                gridColumn: `${startCol} / span ${span}`,
                marginTop: `${idx * 26 + 52}px`, // Vertical staggering
              }}
            >
              <div
                onClick={(e) => { e.stopPropagation(); onSelectBooking(booking); }}
                className="h-6 rounded-md cursor-pointer hover:brightness-110 active:scale-[0.985] transition-all flex items-center px-2.5 text-xs font-medium text-white shadow-md border border-white/20"
                style={{ backgroundColor: color }}
                title={`${booking.client_name} • ${booking.route || ''}`}
              >
                <span className="truncate">{booking.client_name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 gap-px bg-[#111827] rounded-b-xl overflow-hidden relative z-20">
          {weeks.map((week, weekIdx) => (
            <React.Fragment key={weekIdx}>
              {week.map((date) => {
                const isCurrentMonth = date.getMonth() === month;
                const today = isToday(date);

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => onSelectDate(date)}
                    className={`min-h-[138px] p-2 flex flex-col border border-[#374151] hover:bg-[#2A3749] cursor-pointer transition-all relative
                      ${!isCurrentMonth ? 'bg-[#111827] opacity-70' : 'bg-[#1F2937]'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold ${today ? 'text-[#FFB81C]' : isCurrentMonth ? 'text-white' : 'text-[#6B7280]'}`}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Optional: small indicators for bookings */}
                    <div className="mt-auto text-[10px] text-white/60">
                      {/* You can add more info here if needed */}
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
