import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  isBefore,
  isAfter,
  addDays,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, PlaneTakeoff, PlaneLanding, Lock } from 'lucide-react';
import { DateRange, Trip } from '../types';
import { getHoliday } from '../utils/holidayData';

interface CalendarProps {
  trips: Trip[];           // 所有已儲存的行程
  draftRange: DateRange;   // 正在編輯中的行程 (優先顯示)
  onDraftChange: (range: DateRange) => void;
  readOnly?: boolean;      // 如果是瀏覽模式，則只顯示 trips，不可修改
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

  // 當進入編輯模式且有日期時，或列表更新時，自動跳轉到相關月份
  useEffect(() => {
    if (draftRange.startDate) {
      setCurrentMonth(draftRange.startDate);
    } else if (trips.length > 0) {
      // 如果沒有編輯中，預設跳到最近的一個行程
      // 找出離現在最近的未來行程，或是最後一個行程
      const now = new Date();
      const futureTrip = trips.find(t => isAfter(t.startDate, now)) || trips[trips.length - 1];
      if (futureTrip) {
        setCurrentMonth(futureTrip.startDate);
      }
    }
  }, [draftRange.startDate, trips.length]);

  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const handleDateClick = (date: Date) => {
    // 找出點擊日期所屬的行程 (僅在瀏覽模式有用)
    const clickedTrip = trips.find(t => 
      isWithinInterval(date, { start: startOfDay(t.startDate), end: endOfDay(t.endDate) })
    );

    if (onDayClick) {
      onDayClick(date, clickedTrip);
    }

    if (readOnly) return; 

    const { startDate, endDate } = draftRange;

    // 編輯邏輯：點擊修改 draftRange
    if (!startDate && !endDate) {
      onDraftChange({ startDate: date, endDate: null });
      return;
    }

    if (startDate && !endDate) {
      if (isBefore(date, startDate)) {
        onDraftChange({ startDate: date, endDate: null });
      } else if (isSameDay(date, startDate)) {
        onDraftChange({ startDate: null, endDate: null });
      } else {
        onDraftChange({ startDate, endDate: date });
      }
      return;
    }

    if (startDate && endDate) {
      onDraftChange({ startDate: date, endDate: null });
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = addDays(monthStart, -monthStart.getDay());
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // 判斷日期是否在 Draft 範圍內
  const isInDraft = useCallback((date: Date) => {
    if (!draftRange.startDate || !draftRange.endDate) return false;
    return isAfter(date, draftRange.startDate) && isBefore(date, draftRange.endDate);
  }, [draftRange]);

  // 判斷日期是否在任一已存行程範圍內 (回傳該行程)
  const getTripForDate = useCallback((date: Date) => {
    return trips.find(t => 
      isWithinInterval(date, { start: startOfDay(t.startDate), end: endOfDay(t.endDate) })
    );
  }, [trips]);

  return (
    <div className={`w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-full md:h-auto ${readOnly ? 'ring-2 ring-gray-100' : 'ring-2 ring-blue-100'}`}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between bg-white border-b border-gray-100 relative">
        {readOnly && (
           <div className="absolute top-0 right-0 p-2">
             <Lock className="w-4 h-4 text-gray-300" />
           </div>
        )}
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center cursor-pointer" onClick={goToToday}>
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentMonth, 'yyyy年 M月')}
          </h2>
          {!isSameMonth(currentMonth, new Date()) && (
            <span className="text-xs text-blue-500 font-medium mt-0.5">回到本月</span>
          )}
        </div>

        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 active:scale-95">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 px-4 py-2 bg-gray-50">
        {WEEKDAYS.map((day, idx) => (
          <div key={day} className={`text-center text-sm font-medium py-2 ${idx === 0 || idx === 6 ? 'text-red-400' : 'text-gray-500'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-2 p-2 sm:p-4 flex-grow overflow-y-auto">
        {calendarDays.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const holidayInfo = getHoliday(dateStr);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          // 1. 檢查 Draft 狀態 (優先顯示)
          const isDraftStart = draftRange.startDate ? isSameDay(day, draftRange.startDate) : false;
          const isDraftEnd = draftRange.endDate ? isSameDay(day, draftRange.endDate) : false;
          const isDraftRange = isInDraft(day);

          // 2. 檢查 Trip 狀態 (唯讀列表)
          // 只有在非編輯 Draft 的時候才顯示已存行程，或是重疊顯示
          const existingTrip = getTripForDate(day);
          const isTripStart = existingTrip ? isSameDay(day, existingTrip.startDate) : false;
          const isTripEnd = existingTrip ? isSameDay(day, existingTrip.endDate) : false;
          const isTripRange = !!existingTrip && !isTripStart && !isTripEnd;

          // 判斷最終顯示狀態 (Draft 蓋過 Trip)
          const isStart = isDraftStart || (!draftRange.startDate && isTripStart);
          const isEnd = isDraftEnd || (!draftRange.endDate && isTripEnd);
          const isRange = isDraftRange || (!isDraftRange && isTripRange);
          
          // 如果是 Trip 但不是 Draft，顏色稍微淡一點或區分？
          // 這裡簡化設計：只要是行程都用同樣顏色，但在編輯模式下 Draft 會亮顯
          const isSavedTrip = !!existingTrip && !isDraftStart && !isDraftEnd && !isDraftRange;

          const isHoliday = holidayInfo?.type === 'holiday';
          const isMakeup = holidayInfo?.type === 'makeup';

          let textColor = 'text-gray-700';
          if (!isCurrentMonth) textColor = 'text-gray-300';
          else if (isStart || isEnd) textColor = isStart ? 'text-yellow-900' : 'text-white';
          else if (isMakeup) textColor = 'text-gray-500';
          else if (isHoliday || (idx % 7 === 0 || idx % 7 === 6)) textColor = 'text-red-500';
          
          const isInteractive = !readOnly || (readOnly && (isTripRange || isTripStart || isTripEnd));
          const cursorClass = isInteractive ? 'cursor-pointer' : 'cursor-default';

          return (
            <div key={day.toString()} className="relative w-full aspect-[0.9] sm:aspect-square flex items-center justify-center">
              {/* Range Background */}
              {isRange && (
                <div className={`absolute inset-y-1 left-0 right-0 bg-blue-50/80 z-0 ${isSavedTrip ? 'opacity-40' : 'opacity-80'}`} />
              )}
              {isStart && (draftRange.endDate || existingTrip) && (
                <div className={`absolute inset-y-1 left-1/2 right-0 bg-blue-50/80 z-0 rounded-l-md ${isSavedTrip ? 'opacity-40' : 'opacity-80'}`} />
              )}
              {isEnd && (draftRange.startDate || existingTrip) && (
                <div className={`absolute inset-y-1 left-0 right-1/2 bg-blue-50/80 z-0 rounded-r-md ${isSavedTrip ? 'opacity-40' : 'opacity-80'}`} />
              )}

              <button
                onClick={() => handleDateClick(day)}
                disabled={!isCurrentMonth}
                className={`
                  relative z-10 w-full h-full max-w-[44px] max-h-[44px] flex flex-col items-center justify-start py-1 rounded-lg transition-all duration-200
                  ${textColor} font-medium ${cursorClass}
                  ${isStart ? 'bg-yellow-400 shadow-md scale-105 font-bold ring-2 ring-yellow-200' : ''}
                  ${isEnd ? 'bg-blue-600 shadow-md scale-105 font-bold ring-2 ring-blue-200' : ''}
                  ${!isStart && !isEnd && isCurrentMonth && !readOnly && 'hover:bg-gray-100 active:bg-gray-200'}
                  ${isTodayDate && !isStart && !isEnd ? 'ring-1 ring-gray-300 bg-gray-50' : ''}
                  ${isMakeup && !isStart && !isEnd ? 'bg-gray-100' : ''}
                  ${isSavedTrip && !isStart && !isEnd ? 'font-semibold' : ''} 
                `}
              >
                <div className={`h-3 text-[9px] w-full text-center leading-none truncate px-0.5 ${
                  isStart || isEnd 
                    ? (isEnd ? 'text-blue-100' : 'text-yellow-800') 
                    : (isHoliday ? 'text-red-500' : 'text-transparent')
                }`}>
                  {holidayInfo?.name || ''}
                </div>

                <span className="text-[15px] leading-tight mt-0.5">{format(day, 'd')}</span>
                
                <div className="h-2 flex items-center justify-center mt-0.5">
                  {isStart && <PlaneTakeoff className="w-3 h-3" />}
                  {isEnd && <PlaneLanding className="w-3 h-3" />}
                  {isTodayDate && !isStart && !isEnd && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                </div>

                 {isMakeup && !isStart && !isEnd && (
                   <div className="absolute top-0 right-0 w-3 h-3 flex items-center justify-center">
                     <span className="text-[8px] bg-gray-300 text-gray-700 rounded px-0.5 scale-75 origin-top-right">班</span>
                   </div>
                 )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span className="text-gray-600">去程</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-gray-600">返程</span>
        </div>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <div className="flex items-center gap-1.5">
          <span className="text-red-500 font-medium">12</span>
          <span className="text-gray-600">休假</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-gray-200 text-gray-600 text-[9px] px-1 rounded">班</span>
          <span className="text-gray-600">補班</span>
        </div>
      </div>
    </div>
  );
};
