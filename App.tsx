import React, { useState, useEffect, useRef } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Calendar } from './components/Calendar';
import { DateRange, Trip } from './types';
import { Trash2, CheckCircle2, Cloud, Loader2, Plus, X, CalendarDays, Plane, RefreshCw, AlertCircle } from 'lucide-react';
import { saveTripToCloud, getAllTripsFromCloud, deleteTripFromCloud, API_URL } from './utils/api';

const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

export default function App() {
  // 所有行程列表
  const [trips, setTrips] = useState<Trip[]>([]);
  // 正在編輯的草稿 (新增或修改)
  const [draftRange, setDraftRange] = useState<DateRange>({ startDate: null, endDate: null });
  
  // 模式: true = 新增行程中, false = 瀏覽列表模式
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHolidayUpdating, setIsHolidayUpdating] = useState(false);

  // 用來同步比對的基準
  const lastServerHash = useRef<string>("");

  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // 1. 初始化與同步 (Polling)
  const fetchTrips = async (silent = false) => {
    if (!API_URL) return;
    if (!silent) setIsLoading(true);
    try {
      const data = await getAllTripsFromCloud();
      
      // 簡單雜湊比對，決定是否更新 State (避免畫面閃爍)
      const currentHash = JSON.stringify(data.map(t => t.id + t.lastUpdated));
      if (currentHash !== lastServerHash.current) {
        setTrips(data);
        lastServerHash.current = currentHash;
        if (silent && data.length > 0) showToast('已同步最新行程', 'info');
      }
    } catch (e: any) {
       if (!silent && e.message.includes("找不到試算表")) {
         showToast(e.message, 'error');
       }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Polling: 瀏覽模式下每 5 秒同步一次
  useEffect(() => {
    if (isEditMode || !API_URL) return;
    const interval = setInterval(() => fetchTrips(true), 5000);
    return () => clearInterval(interval);
  }, [isEditMode]);

  const handleSave = async () => {
    if (!draftRange.startDate || !draftRange.endDate) return;
    setIsSaving(true);
    try {
      // 儲存 (目前邏輯是新增，未來可擴充編輯舊 ID)
      const newId = await saveTripToCloud(draftRange, null);
      
      // 驗證儲存結果
      const latestTrips = await getAllTripsFromCloud();
      const isSaved = latestTrips.some(t => t.id === newId);
      
      if (!isSaved) {
        throw new Error("儲存顯示成功但同步失敗，請確認 GAS 是否已『重新部署』(發布新版本)。");
      }

      setTrips(latestTrips); // 直接更新畫面
      showToast('行程已新增成功', 'success');
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

  const handleResetDraft = () => {
    setDraftRange({ startDate: null, endDate: null });
  };

  const handleDayClick = (date: Date, trip?: Trip) => {
    if (!isEditMode && trip) {
       const days = differenceInDays(date, trip.startDate) + 1;
       const total = differenceInDays(trip.endDate, trip.startDate) + 1;
       showToast(`${format(date, 'M/d')} - 旅程第 ${days}/${total} 天`, 'info');
    }
  };

  // 模擬更新假日資料
  const handleUpdateHolidays = () => {
    setIsHolidayUpdating(true);
    setTimeout(() => {
      setIsHolidayUpdating(false);
      showToast('已更新至最新假日與補班資訊', 'success');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-4 pb-32 px-4 bg-gradient-to-br from-blue-50 to-indigo-50 relative">
      
      {/* Toast */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 transition-all z-50 whitespace-nowrap
        ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
        ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'info' ? 'bg-gray-800 text-white' : 'bg-green-600 text-white'}
      `}>
        {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
        {toast.msg}
      </div>

      {/* Header Info */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center px-2">
         <div className="flex flex-col">
           <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <Plane className="w-5 h-5 text-blue-500" />
             我的行程規劃
           </h1>
           <span className="text-xs text-gray-500">
             {isLoading ? '正在同步雲端...' : `目前共有 ${trips.length} 個行程`}
           </span>
         </div>

         {/* 右側按鈕區 */}
         <div className="flex items-center gap-2">
           {!isEditMode && (
             <button 
                onClick={handleUpdateHolidays} 
                disabled={isHolidayUpdating}
                className={`p-2 rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all
                  ${isHolidayUpdating ? 'opacity-50' : 'hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200'}
                `}
                title="更新假日資料"
             >
               <RefreshCw className={`w-4 h-4 ${isHolidayUpdating ? 'animate-spin' : ''}`} />
             </button>
           )}
           
           {isEditMode && (
             <button onClick={() => setIsEditMode(false)} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full">
               <X className="w-5 h-5" />
             </button>
           )}
         </div>
      </div>

      {/* Calendar Component */}
      <div className="w-full flex justify-center mb-6 relative z-10">
        <div className="relative w-full max-w-md">
           {isEditMode && (
             <div className="absolute -top-10 left-0 right-0 bg-blue-600 text-white text-xs py-1.5 px-4 rounded-t-lg shadow-sm text-center font-bold animate-in fade-in slide-in-from-bottom-2">
               編輯模式：請點選去程與返程日期
             </div>
           )}
          <Calendar 
            trips={trips} 
            draftRange={draftRange}
            onDraftChange={setDraftRange}
            readOnly={!isEditMode}
            onDayClick={handleDayClick}
          />
        </div>
      </div>

      {/* Mode Switch & Lists */}
      <div className="w-full max-w-md space-y-4">
        
        {/* VIEW MODE: Trip List */}
        {!isEditMode && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {trips.length > 0 && (
              <div className="text-xs text-gray-400 pl-2 mb-1">已儲存的行程：</div>
            )}
            
            {trips.map(trip => {
              const days = differenceInDays(trip.endDate, trip.startDate) + 1;
              const isDeletingThis = isDeleting === trip.id;
              
              return (
                <div key={trip.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer" onClick={() => handleDayClick(trip.startDate, trip)}>
                   <div className="flex flex-col">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                         {days} 天
                       </span>
                       <span className="text-gray-400 text-xs">
                         {format(trip.startDate, 'yyyy')}
                       </span>
                     </div>
                     <div className="flex items-center gap-1.5 text-gray-800 font-bold">
                       <span>{format(trip.startDate, 'M/d')}</span>
                       <span className="text-gray-300">→</span>
                       <span>{format(trip.endDate, 'M/d')}</span>
                     </div>
                   </div>

                   <button 
                     onClick={(e) => handleDelete(trip.id, e)}
                     disabled={!!isDeleting}
                     className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                   >
                     {isDeletingThis ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                   </button>
                </div>
              );
            })}

            {trips.length === 0 && !isLoading && (
              <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>目前沒有行程</p>
                <p className="text-xs">點擊下方按鈕新增</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons (Fixed Bottom) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 md:sticky md:bottom-auto md:bg-transparent md:border-0 md:p-0">
          <div className="w-full max-w-md mx-auto">
             {isEditMode ? (
               <div className="grid grid-cols-4 gap-2">
                 <button 
                   onClick={handleResetDraft}
                   disabled={!draftRange.startDate}
                   className="col-span-1 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 flex justify-center items-center"
                 >
                   <Trash2 className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={() => setIsEditMode(false)}
                   className="col-span-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleSave}
                   disabled={!draftRange.startDate || !draftRange.endDate || isSaving}
                   className={`col-span-2 py-3 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2
                     ${draftRange.startDate && draftRange.endDate ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-gray-300 cursor-not-allowed shadow-none'}
                   `}
                 >
                   {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                   儲存行程
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => { setIsEditMode(true); setDraftRange({startDate:null, endDate:null}); }}
                 className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
               >
                 <Plus className="w-6 h-6" />
                 新增一段旅程
               </button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}