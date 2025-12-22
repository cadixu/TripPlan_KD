
import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  startOfMonth,
  endOfMonth, 
  startOfWeek,
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  isBefore,
  isAfter,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, PlaneTakeoff, PlaneLanding, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange, Trip } from '../types';
import { getHoliday } from '../utils/holidayData';

interface CalendarProps {
  trips: Trip[];
  draftRange: DateRange;
  onDraftChange: (range: DateRange) => void;
  readOnly?: boolean;
  onDayClick?: (date: Date, relevantTrip?: Trip) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const Calendar: React.FC<CalendarProps> = ({ 
  trips, 
  draftRange, 
  onDraftChange, 
  readOnly = false, 
  onDayClick 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (draftRange.startDate) {
      setCurrentMonth(draftRange.startDate);
    }
  }, [draftRange.startDate]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleDateClick = (date: Date) => {
    const clickedTrip = trips.find(t => 
      isWithinInterval(date, { start: startOfDay(t.startDate), end: endOfDay(t.endDate) })
    );

    if (onDayClick) {
      onDayClick(date, clickedTrip);
    }

    if (readOnly) return;

    if (!draftRange.startDate || (draftRange.startDate && draftRange.endDate)) {
      onDraftChange({ startDate: date, endDate: null });
    } else {
      if (isBefore(date, draftRange.startDate)) {
        onDraftChange({ startDate: date, endDate: draftRange.startDate });
      } else {
        onDraftChange({ startDate: draftRange.startDate, endDate: date });
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="p-5 flex items-center justify-between bg-white border-b border-gray-50">
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gray-800">
            {format(currentMonth, 'yyyy年 M月')}
          </span>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="text-[10px] text-blue-500 font-bold hover:underline"
          >
            回到今天
          </button>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 bg-gray-50/50">
        {WEEKDAYS.map(day => (
          <div key={day} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {days.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const holiday = getHoliday(dateStr);
          const isCurrMonth = isSameMonth(day, currentMonth);
          const isTdy = isToday(day);
          
          // 已儲存行程的標記
          const existingTrip = trips.find(t => 
            isWithinInterval(day, { start: startOfDay(t.startDate), end: endOfDay(t.endDate) })
          );
          const isTripStart = existingTrip && isSameDay(day, existingTrip.startDate);
          const isTripEnd = existingTrip && isSameDay(day, existingTrip.endDate);
          const isTripRange = existingTrip && !isTripStart && !isTripEnd;

          // 編輯中(Draft)的標記
          const isDraftStart = draftRange.startDate && isSameDay(day, draftRange.startDate);
          const isDraftEnd = draftRange.endDate && isSameDay(day, draftRange.endDate);
          const isDraftRange = draftRange.startDate && draftRange.endDate && 
                               isWithinInterval(day, { start: draftRange.startDate, end: draftRange.endDate }) &&
                               !isDraftStart && !isDraftEnd;

          // 優先顯示 Draft 顏色
          let bgColor = 'bg-white';
          let textColor = isCurrMonth ? 'text-gray-800' : 'text-gray-300';
          let icon = null;

          if (isDraftStart) {
            bgColor = 'bg-yellow-400 ring-2 ring-yellow-200 ring-offset-2 scale-110 z-10';
            textColor = 'text-white font-black';
            icon = <PlaneTakeoff className="w-3 h-3 absolute -top-1 -right-1 bg-yellow-600 rounded-full p-0.5" />;
          } else if (isDraftEnd) {
            bgColor = 'bg-blue-500 ring-2 ring-blue-200 ring-offset-2 scale-110 z-10';
            textColor = 'text-white font-black';
            icon = <PlaneLanding className="w-3 h-3 absolute -top-1 -right-1 bg-blue-700 rounded-full p-0.5" />;
          } else if (isDraftRange) {
            bgColor = 'bg-blue-50/80';
            textColor = 'text-blue-600 font-bold';
          } else if (isTripStart) {
            bgColor = 'bg-yellow-200/60';
            textColor = 'text-yellow-800 font-bold';
          } else if (isTripEnd) {
            bgColor = 'bg-blue-200/60';
            textColor = 'text-blue-800 font-bold';
          } else if (isTripRange) {
            bgColor = 'bg-gray-50';
            textColor = 'text-gray-500';
          }

          const isSunday = day.getDay() === 0;
          const isSaturday = day.getDay() === 6;
          const isWeekend = isSunday || isSaturday;

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(day)}
              className={`relative h-14 sm:h-16 flex flex-col items-center justify-center transition-all ${bgColor} ${isCurrMonth ? 'hover:bg-opacity-90' : 'opacity-40'}`}
            >
              {isTdy && !isDraftStart && !isDraftEnd && (
                <div className="absolute top-1 left-1 w-1 h-1 bg-blue-500 rounded-full" />
              )}
              
              <span className={`text-sm ${textColor} z-10`}>
                {format(day, 'd')}
              </span>

              {holiday && isCurrMonth && (
                <span className="text-[8px] text-red-400 absolute bottom-1 w-full text-center truncate px-1">
                  {holiday.name}
                </span>
              )}

              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};
