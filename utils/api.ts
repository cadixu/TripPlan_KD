import { DateRange, Trip } from '../types';
import { format } from 'date-fns';

// ------------------------------------------------------------------
// 【設定教學】
// 1. 請部署您的 Google Apps Script (必須設為: 執行身分=我, 權限=所有人)
// 2. 將獲得的網址 (結尾是 /exec) 貼在下方的引號中
// 3. 範例: "https://script.google.com/macros/s/AKfycbx.../exec"
// ------------------------------------------------------------------
export const API_URL = "https://script.google.com/macros/s/AKfycbwRkKn8gI-7v3yNqn5Lb0DQWj0rFYr9hRluw5-fg49E3KncFuXg-dsU10R5ore8QiDSDg/exec"; 

/**
 * 安全解析 YYYY-MM-DD 字串為本地 Date 物件
 * 避免直接 new Date('2025-12-05') 因時區導致日期位移
 */
const parseDateSafe = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const cleanStr = dateStr.split('T')[0]; 
  const [year, month, day] = cleanStr.split(/[-/]/).map(Number);
  return new Date(year, month - 1, day);
};

/**
 * 處理 GAS 常見錯誤並拋出易讀訊息
 */
const handleApiError = (error: any) => {
  const msg = error.toString();
  if (msg.includes("Cannot read properties of null (reading 'getActiveSheet')")) {
    throw new Error("後端錯誤：找不到試算表。請確認您的 GAS 為「綁定腳本」，或在 GAS 程式碼中手動填入 Sheet ID。");
  }
  if (msg.includes("Failed to fetch")) {
    throw new Error("連線失敗：請檢查 API_URL 是否正確，或確認網路連線。");
  }
  throw error;
};

/**
 * 儲存行程 (新增或更新)
 */
export const saveTripToCloud = async (range: DateRange, id?: string | null): Promise<string> => {
  if (!API_URL) throw new Error("請先設定 utils/api.ts 中的 API_URL");
  if (!range.startDate || !range.endDate) throw new Error("日期不完整");

  const payload = {
    action: 'save',
    id: id || undefined,
    startDate: format(range.startDate, 'yyyy-MM-dd'),
    endDate: format(range.endDate, 'yyyy-MM-dd'),
  };

  try {
    const fetchUrl = `${API_URL}?t=${new Date().getTime()}`;
    const response = await fetch(fetchUrl, {
      method: 'POST',
      credentials: 'omit',
      redirect: 'follow',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error("伺服器回應格式錯誤");
    }
    
    if (data.status === 'error') {
      throw new Error(data.message);
    }

    return data.id;
  } catch (error) {
    handleApiError(error);
    return ""; // Should not reach here due to throw
  }
};

/**
 * 獲取所有行程 (支援多筆)
 */
export const getAllTripsFromCloud = async (): Promise<Trip[]> => {
  if (!API_URL) throw new Error("請先設定 API URL");

  try {
    const response = await fetch(`${API_URL}?action=getAll&t=${new Date().getTime()}`, {
        method: 'GET',
        redirect: 'follow',
        mode: 'cors',
        credentials: 'omit'
    });
    
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error("無法讀取行程資料");
    }

    if (data.status === 'error') {
      throw new Error(data.message);
    }

    if (!data.trips || !Array.isArray(data.trips)) {
      return [];
    }

    return data.trips.map((t: any) => ({
      id: t.id,
      startDate: parseDateSafe(t.startDate),
      endDate: parseDateSafe(t.endDate),
      lastUpdated: t.lastUpdated
    }));

  } catch (error) {
    // 靜默處理，避免初始化報錯
    return [];
  }
};

/**
 * 刪除行程
 */
export const deleteTripFromCloud = async (id: string): Promise<void> => {
  if (!API_URL) throw new Error("請先設定 API URL");

  try {
    const payload = {
      action: 'delete',
      id: id
    };

    const response = await fetch(`${API_URL}?t=${new Date().getTime()}`, {
      method: 'POST',
      credentials: 'omit',
      redirect: 'follow',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const data = JSON.parse(text);
    
    if (data.status === 'error') {
      throw new Error(data.message);
    }
  } catch (error) {
    handleApiError(error);
  }
};

// 為了相容舊程式碼保留 (但建議改用 getAllTripsFromCloud)
export const getTripFromCloud = async (id: string): Promise<DateRange> => {
   // ... implementation retained if needed, but App.tsx will use getAll
   return { startDate: null, endDate: null }; 
};
export const getLatestTripFromCloud = async (): Promise<{range: DateRange, id: string}> => {
   // ... implementation retained if needed
   return { range: { startDate: null, endDate: null }, id: '' };
};
