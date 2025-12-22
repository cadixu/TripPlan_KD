
import { HolidayMap, HolidayInfo } from '../types';

const CACHE_KEY = 'tripplan_holiday_v8_emoji_update'; 
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * 靜態數據庫：包含 2025-2026 年節假日、新增法定假日與專屬紀念日
 */
const STATIC_HOLIDAY_DATABASE: HolidayMap = {
  // --- 專屬紀念日 (每年固定) ---
  '2025-03-13': { name: '🎂🧔 KD 生日', type: 'commemoration', region: 'BOTH' },
  '2025-06-08': { name: '🎂👩 Ivy 生日', type: 'commemoration', region: 'BOTH' },
  '2025-10-19': { name: '🎂👶 CX 生日', type: 'commemoration', region: 'BOTH' },
  '2026-03-13': { name: '🎂🧔 KD 生日', type: 'commemoration', region: 'BOTH' },
  '2026-06-08': { name: '🎂👩 Ivy 生日', type: 'commemoration', region: 'BOTH' },
  '2026-10-19': { name: '🎂👶 CX 生日', type: 'commemoration', region: 'BOTH' },

  // --- 2025 數據 (含台灣新增假日) ---
  '2025-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },
  '2025-01-28': { name: '除夕', type: 'holiday', region: 'BOTH' },
  '2025-01-29': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2025-01-30': { name: '初二', type: 'holiday', region: 'BOTH' },
  '2025-01-31': { name: '初三', type: 'holiday', region: 'BOTH' },
  '2025-02-01': { name: '初四/春節假', type: 'holiday', region: 'BOTH' },
  '2025-02-02': { name: '初五/春節假', type: 'holiday', region: 'BOTH' },
  '2025-02-28': { name: '和平紀念日', type: 'holiday', region: 'TW' },
  '2025-04-04': { name: '兒童節/清明', type: 'holiday', region: 'BOTH' },
  '2025-04-05': { name: '清明節', type: 'holiday', region: 'BOTH' },
  '2025-05-31': { name: '端午節', type: 'holiday', region: 'BOTH' },
  '2025-06-02': { name: '端午節', type: 'holiday', region: 'BOTH' },
  '2025-09-28': { name: '教師節', type: 'holiday', region: 'TW' },
  '2025-10-06': { name: '中秋節/國慶', type: 'holiday', region: 'BOTH' },
  '2025-10-10': { name: '國慶日', type: 'holiday', region: 'TW' },
  '2025-10-25': { name: '光復節', type: 'holiday', region: 'TW' },
  '2025-12-25': { name: '行憲紀念日', type: 'holiday', region: 'TW' },

  // --- 2026 綜合預估數據 (含新增假日) ---
  '2026-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },
  '2026-02-16': { name: '除夕', type: 'holiday', region: 'TW' },
  '2026-02-17': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2026-02-18': { name: '初二', type: 'holiday', region: 'BOTH' },
  '2026-02-19': { name: '初三', type: 'holiday', region: 'BOTH' },
  '2026-02-20': { name: '初四', type: 'holiday', region: 'BOTH' },
  '2026-02-21': { name: '初五', type: 'holiday', region: 'BOTH' },
  '2026-02-22': { name: '初六', type: 'holiday', region: 'BOTH' },
  '2026-02-28': { name: '和平紀念日', type: 'holiday', region: 'TW' },
  '2026-04-04': { name: '兒童節/清明', type: 'holiday', region: 'BOTH' },
  '2026-04-05': { name: '清明節', type: 'holiday', region: 'BOTH' },
  '2026-05-01': { name: '勞動節', type: 'holiday', region: 'CN' },
  '2026-06-19': { name: '端午節', type: 'holiday', region: 'BOTH' },
  '2026-09-25': { name: '中秋節', type: 'holiday', region: 'BOTH' },
  '2026-09-28': { name: '教師節', type: 'holiday', region: 'TW' },
  '2026-10-01': { name: '國慶節', type: 'holiday', region: 'CN' },
  '2026-10-10': { name: '國慶日', type: 'holiday', region: 'TW' },
  '2026-10-25': { name: '光復節', type: 'holiday', region: 'TW' },
  '2026-12-25': { name: '行憲紀念日', type: 'holiday', region: 'TW' }
};

export const fetchHolidays = async (): Promise<HolidayMap> => {
  let finalMap: HolidayMap = { ...STATIC_HOLIDAY_DATABASE };

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return { ...finalMap, ...data };
      }
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/chinese-days/dist/holidays.ics', { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const remoteData: HolidayMap = {};
      const events = text.split('BEGIN:VEVENT');
      events.shift();
      events.forEach(event => {
        const d = event.match(/DTSTART:(\d{8})/)?.[1];
        const s = event.match(/SUMMARY:(.*)/)?.[1];
        if (d && s) {
          const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
          // 只有當靜態數據庫沒有該日期時才使用遠端，避免覆蓋生日或新增假期
          if (!finalMap[date]) {
            remoteData[date] = {
              name: s.trim(),
              type: s.includes('上班') || s.includes('補') ? 'makeup' : 'holiday',
              region: 'CN'
            };
          }
        }
      });
      Object.assign(finalMap, remoteData);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: remoteData, timestamp: Date.now() }));
    }
  } catch (error) {
    console.log('Using static holiday DB');
  }

  return finalMap;
};
