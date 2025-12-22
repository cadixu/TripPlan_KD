
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, differenceInDays, isAfter, isBefore, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar } from './components/Calendar';
import { DateRange, Trip, HolidayMap } from './types';
import { 
  Trash2, CheckCircle2, Loader2, Plus, 
  CalendarDays, Plane, RefreshCw, AlertCircle, 
  ChevronRight, Filter, Clock, Globe
} from 'lucide-react';
import { saveTripToCloud, getAllTripsFromCloud, deleteTripFromCloud, API_URL } from './utils/api';
import { fetchHolidays } from './utils/holidayService';

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [holidays, setHolidays] = useState<HolidayMap>({});
  const [draftRange, setDraftRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPastTrips, setShowPastTrips] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHolidayLoading, setIsHolidayLoading] = useState(true);

  const lastServerHash = useRef<string>("");
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const syncHolidays = async () => {
    setIsHolidayLoading(true);
    try {
      const map = await fetchHolidays();
      setHolidays(map);
    } catch (e) {
      console.error('Holiday sync failed');
    } finally {
      setIsHolidayLoading(false);
    }
  };

  const fetchTrips = async (silent = false) => {
    if (!API_URL) return;
    if (!silent) setIsLoading(true);
    try {
      const data = await getAllTripsFromCloud();
      const currentHash = JSON.stringify(data.map(t => t.id + t.lastUpdated));
      if (currentHash !== lastServerHash.current) {
        setTrips(data);
        lastServerHash.current = currentHash;
        if (silent && data.length > 0) showToast('數據已同步', 'info');
      }
    } catch (e: any) {
       showToast('雲端連線失敗', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    syncHolidays();
  }, []);

  useEffect(() => {
    if (isEditMode || !API_URL) return;
    const interval = setInterval(() => fetchTrips(true), 20000);
    return () => clearInterval(interval);
  }, [isEditMode]);

  const handleSave = async () => {
    if (!draftRange.startDate || !draftRange.endDate) return;
    setIsSaving(true);
    try {
      await saveTripToCloud(draftRange, null);
      const latestTrips = await getAllTripsFromCloud();
      setTrips(latestTrips);
      showToast('行程已儲存', 'success');
      setDraftRange({ startDate: null, endDate: null });
      setIsEditMode(false);
    } catch (e: any) {
      showToast('儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('刪除這個旅程？')) return;
    
    setIsDeleting(id);
    try {
      await deleteTripFromCloud(id);
      showToast('已移除行程', 'info');
      fetchTrips(true);
    } catch (e: any) {
      showToast('刪除失敗', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredTrips = useMemo(() => {
    const sorted = [...trips].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    if (showPastTrips) return sorted;
    const now = startOfDay(new Date());
    return sorted.filter(t => !isBefore(endOfDay(t.endDate), now));
  }, [trips, showPastTrips]);

  const getTripStatus = (trip: Trip) => {
    const now = startOfDay(new Date());
    const start = startOfDay(trip.startDate);
    const end = endOfDay(trip.endDate);

    if (isWithinInterval(now, { start, end })) {
      const dayCount = differenceInDays(now, start) + 1;
      return { label: `第 ${dayCount} 天`, color: 'bg-green-100 text-green-700' };
    }
    if (isAfter(start, now)) {
      const diff = differenceInDays(start, now);
      return { label: `${diff} 天後`, color: 'bg-blue-100 text-blue-700' };
    }
    return { label: '已完成', color: 'bg-gray-100 text-gray-500' };
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-6 pb-32 px-4 bg-[#F8FAFC]">
      
      {/* Toast */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 transition-all z-[100]
        ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
        ${toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'info' ? 'bg-slate-800 text-white' : 'bg-emerald-500 text-white'}
      `}>
        {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        {toast.msg}
      </div>

      <header className="w-full max-w-md mb-8 flex justify-between items-end px-2">
         <div className="flex flex-col gap-1">
           <div className="flex items-center gap-2">
             <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
                <Plane className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-2xl font-black text-slate-800 tracking-tight">TripPlan</h1>
           </div>
           <div className="flex items-center gap-2">
             <p className="text-xs font-medium text-slate-400">
               {isLoading ? '同步中...' : `共有 ${trips.length} 個旅程`}
             </p>
             {!isHolidayLoading && (
               <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                 <Globe className="w-3 h-3" />
                 訂閱行事曆已同步
               </div>
             )}
           </div>
         </div>

         <div className="flex gap-2">
            <button 
              onClick={() => setShowPastTrips(!showPastTrips)}
              className={`p-2.5 rounded-xl border transition-all ${showPastTrips ? 'bg-white border-slate-200 text-slate-500' : 'bg-blue-50 border-blue-200 text-blue-600'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
                onClick={() => fetchTrips()} 
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500"
            >
               <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
         </div>
      </header>

      <section className="w-full max-w-md mb-10">
        <Calendar 
          trips={trips} 
          draftRange={draftRange}
          onDraftChange={setDraftRange}
          readOnly={!isEditMode}
          holidays={holidays}
        />
      </section>

      <section className="w-full max-w-md space-y-4">
        {!isEditMode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                旅程清單
              </h2>
            </div>
            
            {filteredTrips.map(trip => {
              const status = getTripStatus(trip);
              return (
                <div key={trip.id} className="relative bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group">
                   <div className="flex flex-col gap-2">
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-md w-fit ${status.color}`}>
                       {status.label}
                     </span>
                     <div className="flex items-center gap-3 text-slate-800">
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 font-bold">{format(trip.startDate, 'eee')}</span>
                         <span className="text-lg font-black">{format(trip.startDate, 'MM/dd')}</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-200" />
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 font-bold">{format(trip.endDate, 'eee')}</span>
                         <span className="text-lg font-black">{format(trip.endDate, 'MM/dd')}</span>
                       </div>
                     </div>
                   </div>

                   <button 
                     onClick={(e) => handleDelete(trip.id, e)}
                     disabled={!!isDeleting}
                     className="p-3 text-slate-200 hover:text-red-500"
                   >
                     {isDeleting === trip.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                   </button>
                </div>
              );
            })}

            {filteredTrips.length === 0 && (
              <div className="text-center py-12 bg-white/50 border-2 border-dashed border-slate-200 rounded-[32px]">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 text-sm font-bold">點擊下方按鈕規劃新旅程</p>
              </div>
            )}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 z-[90]">
          <div className="w-full max-w-md mx-auto">
             {isEditMode ? (
               <div className="flex gap-3">
                 <button onClick={() => setIsEditMode(false)} className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold">取消</button>
                 <button 
                   onClick={handleSave}
                   disabled={!draftRange.startDate || !draftRange.endDate || isSaving}
                   className={`flex-[2] py-4 rounded-2xl font-black text-white ${draftRange.startDate && draftRange.endDate ? 'bg-blue-600 shadow-xl' : 'bg-slate-300'}`}
                 >
                   {isSaving ? '儲存中...' : '儲存行程'}
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => { setIsEditMode(true); setDraftRange({startDate:null, endDate:null}); }}
                 className="w-full py-5 rounded-[24px] font-black text-white bg-slate-900 shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
               >
                 <Plus className="w-6 h-6" />
                 規劃新旅程
               </button>
             )}
          </div>
        </div>
      </section>
    </div>
  );
}
