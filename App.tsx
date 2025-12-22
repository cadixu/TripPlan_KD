
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, differenceInDays, isAfter, isBefore, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar } from './components/Calendar';
import { DateRange, Trip } from './types';
import { 
  Trash2, CheckCircle2, Cloud, Loader2, Plus, X, 
  CalendarDays, Plane, RefreshCw, AlertCircle, 
  ChevronRight, Filter, Clock
} from 'lucide-react';
import { saveTripToCloud, getAllTripsFromCloud, deleteTripFromCloud, API_URL } from './utils/api';

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [draftRange, setDraftRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPastTrips, setShowPastTrips] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHolidayUpdating, setIsHolidayUpdating] = useState(false);

  const lastServerHash = useRef<string>("");
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
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
        if (silent && data.length > 0) showToast('行程已同步', 'info');
      }
    } catch (e: any) {
       showToast(e.message || '同步失敗', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (isEditMode || !API_URL) return;
    const interval = setInterval(() => fetchTrips(true), 10000);
    return () => clearInterval(interval);
  }, [isEditMode]);

  const handleSave = async () => {
    if (!draftRange.startDate || !draftRange.endDate) return;
    setIsSaving(true);
    try {
      const newId = await saveTripToCloud(draftRange, null);
      const latestTrips = await getAllTripsFromCloud();
      setTrips(latestTrips);
      showToast('行程儲存成功', 'success');
      setDraftRange({ startDate: null, endDate: null });
      setIsEditMode(false);
    } catch (e: any) {
      showToast(e.message || '儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('確定要刪除這個行程嗎？')) return;
    
    setIsDeleting(id);
    try {
      await deleteTripFromCloud(id);
      showToast('行程已刪除', 'info');
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
      return { label: `進行中 (第 ${dayCount} 天)`, color: 'bg-green-100 text-green-700' };
    }
    if (isAfter(start, now)) {
      const diff = differenceInDays(start, now);
      return { label: `${diff} 天後出發`, color: 'bg-blue-100 text-blue-700' };
    }
    return { label: '已結束', color: 'bg-gray-100 text-gray-500' };
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-6 pb-32 px-4 bg-[#F8FAFC]">
      
      {/* Toast */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 transition-all z-[100] whitespace-nowrap
        ${toast.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}
        ${toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'info' ? 'bg-slate-800 text-white' : 'bg-emerald-500 text-white'}
      `}>
        {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        {toast.msg}
      </div>

      {/* App Header */}
      <header className="w-full max-w-md mb-8 flex justify-between items-end px-2">
         <div className="flex flex-col gap-1">
           <div className="flex items-center gap-2">
             <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <Plane className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-2xl font-black text-slate-800 tracking-tight">TripPlan</h1>
           </div>
           <p className="text-xs font-medium text-slate-400">
             {isLoading ? '同步中...' : `共有 ${trips.length} 個旅程`}
           </p>
         </div>

         <div className="flex gap-2">
            <button 
              onClick={() => setShowPastTrips(!showPastTrips)}
              className={`p-2.5 rounded-xl border transition-all ${showPastTrips ? 'bg-white border-slate-200 text-slate-500' : 'bg-blue-50 border-blue-200 text-blue-600'}`}
              title={showPastTrips ? "隱藏過期行程" : "顯示所有行程"}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
                onClick={() => fetchTrips()} 
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all"
            >
               <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
         </div>
      </header>

      {/* Calendar Section */}
      <section className="w-full max-w-md mb-10">
        <div className="relative group">
           {isEditMode && (
             <div className="absolute -top-12 left-0 right-0 flex justify-center animate-bounce">
                <div className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white">
                  選擇日期：去程(黃) / 返程(藍)
                </div>
             </div>
           )}
          <Calendar 
            trips={trips} 
            draftRange={draftRange}
            onDraftChange={setDraftRange}
            readOnly={!isEditMode}
          />
        </div>
      </section>

      {/* Trip List Section */}
      <section className="w-full max-w-md space-y-4">
        {!isEditMode && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                行程清單
              </h2>
              {!showPastTrips && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">隱藏已結束</span>}
            </div>
            
            {filteredTrips.map(trip => {
              const days = differenceInDays(trip.endDate, trip.startDate) + 1;
              const status = getTripStatus(trip);
              
              return (
                <div key={trip.id} className="relative bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all">
                   <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${status.color}`}>
                         {status.label}
                       </span>
                       <span className="text-slate-300 text-[10px] font-bold">
                         {days} 天旅程
                       </span>
                     </div>
                     <div className="flex items-center gap-3 text-slate-800">
                       <div className="flex flex-col">
                         <span className="text-xs text-slate-400 font-bold uppercase">{format(trip.startDate, 'eee')}</span>
                         <span className="text-xl font-black">{format(trip.startDate, 'MM/dd')}</span>
                       </div>
                       <ChevronRight className="w-5 h-5 text-slate-200" />
                       <div className="flex flex-col">
                         <span className="text-xs text-slate-400 font-bold uppercase">{format(trip.endDate, 'eee')}</span>
                         <span className="text-xl font-black">{format(trip.endDate, 'MM/dd')}</span>
                       </div>
                     </div>
                   </div>

                   <button 
                     onClick={(e) => handleDelete(trip.id, e)}
                     disabled={!!isDeleting}
                     className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                   >
                     {isDeleting === trip.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                   </button>
                </div>
              );
            })}

            {filteredTrips.length === 0 && (
              <div className="text-center py-16 bg-white/50 border-2 border-dashed border-slate-200 rounded-[40px]">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-bold">尚無符合條件的行程</p>
                <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest">Create your first adventure</p>
              </div>
            )}
          </div>
        )}

        {/* FAB / Action Controls */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[90]">
          <div className="w-full max-w-md mx-auto">
             {isEditMode ? (
               <div className="flex gap-3">
                 <button 
                   onClick={() => setDraftRange({ startDate: null, endDate: null })}
                   className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors"
                 >
                   <RefreshCw className="w-6 h-6" />
                 </button>
                 <button 
                   onClick={() => setIsEditMode(false)}
                   className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleSave}
                   disabled={!draftRange.startDate || !draftRange.endDate || isSaving}
                   className={`flex-[2] py-4 rounded-2xl font-black text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2
                     ${draftRange.startDate && draftRange.endDate ? 'bg-blue-600 shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'}
                   `}
                 >
                   {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                   儲存行程
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => { setIsEditMode(true); setDraftRange({startDate:null, endDate:null}); }}
                 className="w-full py-5 rounded-[28px] font-black text-white bg-slate-900 hover:bg-black shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 transition-all active:scale-95 group"
               >
                 <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                 規劃新旅程
               </button>
             )}
          </div>
        </div>
      </section>
    </div>
  );
}
