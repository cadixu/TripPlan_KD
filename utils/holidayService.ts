
import { HolidayMap, HolidayInfo } from '../types';

const CACHE_KEY = 'tripplan_holiday_v6_2026'; 
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * 靜態數據庫：包含 2025-2026 年節假日與專屬紀念日
 */
const STATIC_HOLIDAY_DATABASE: HolidayMap = {
  // --- 專屬紀念日 (每年固定) ---
  '2025-03-13': { name: '🎂 KD 生日', type: 'commemoration', region: 'BOTH' },
  '2025-06-08': { name: '🎂 Ivy 生日', type: 'commemoration', region: 'BOTH' },
  '2025-10-19': { name: '🎂 CX 生日', type: 'commemoration', region: 'BOTH' },
  '2026-03-13': { name: '🎂 KD 生日', type: 'commemoration', region: 'BOTH' },
  '2026-06-08': { name: '🎂 Ivy 生日', type: 'commemoration', region: 'BOTH' },
  '2026-10-19': { name: '🎂 CX 生日', type: 'commemoration', region: 'BOTH' },

  // --- 2025 數據 (保留) ---
  '2025-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },
  '2025-01-28': { name: '除夕', type: 'holiday', region: 'BOTH' },
  '2025-01-29': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2025-01-30': { name: '初二', type: 'holiday', region: 'BOTH' },
  '2025-01-31': { name: '初三', type: 'holiday', region: 'BOTH' },
  '2025-02-01': { name: '初四/春節假', type: 'holiday', region: 'BOTH' },
  '2025-02-02': { name: '初五/春節假', type: 'holiday', region: 'BOTH' },
  '2025-04-04': { name: '兒童節/清明', type: 'holiday', region: 'BOTH' },
  '2025-04-05': { name: '清明節', type: 'holiday', region: 'BOTH' },
  '2025-05-31': { name: '端午節', type: 'holiday', region: 'BOTH' },
  '2025-06-02': { name: '端午節', type: 'holiday', region: 'BOTH' },
  '2025-10-06': { name: '中秋節/國慶', type: 'holiday', region: 'BOTH' },
  '2025-10-10': { name: '國慶日', type: 'holiday', region: 'TW' },

  // --- 2026 綜合預估數據 (合併 TW 與 CN) ---
  '2026-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },
  '2026-02-16': { name: '除夕', type: 'holiday', region: 'TW' },
  '2026-02-17': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2026-02-18': { name: '初二', type: 'holiday', region: 'BOTH' },
  '2026-02-19': { name: '初三', type: 'holiday', region: 'BOTH' },
  '2026-02-20': { name: '初四', type: 'holiday', region: 'BOTH' },
  '2026-02-21': { name: '初五', type: 'holiday', region: 'BOTH' },
  '2026-02-22': { name: '初六', type: 'holiday', region: 'BOTH' },
  '2026-02-23': { name: '春節假', type: 'holiday', region: 'CN' },
  '2026-02-24': { name: '春節假', type: 'holiday', region: 'CN' },
  '2026-02-28': { name: '和平紀念日', type: 'holiday', region: 'TW' },
  '2026-04-03': { name: '兒童節(彈)', type: 'holiday', region: 'TW' },
  '2026-04-04': { name: '兒童節/清明', type: 'holiday', region: 'BOTH' },
  '2026-04-05': { name: '清明節', type: 'holiday', region: 'BOTH' },
  '2026-04-06': { name: '清明節', type: 'holiday', region: 'CN' },
  '2026-05-01': { name: '勞動節', type: 'holiday', region: 'CN' },
  '2026-05-02': { name: '勞動節', type: 'holiday', region: 'CN' },
  '2026-05-03': { name: '勞動節', type: 'holiday', region: 'CN' },
  '2026-05-04': { name: '勞動節', type: 'holiday', region: 'CN' },
  '2026-05-05': { name: '勞動節', type: 'holiday', region: 'CN' },
  '2026-06-19': { name: '端午節', type: 'holiday', region: 'BOTH' },
  '2026-06-20': { name: '端午節', type: 'holiday', region: 'CN' },
  '2026-06-21': { name: '端午節', type: 'holiday', region: 'CN' },
  '2026-09-25': { name: '中秋節', type: 'holiday', region: 'BOTH' },
  '2026-09-26': { name: '中秋節', type: 'holiday', region: 'CN' },
  '2026-09-27': { name: '中秋節', type: 'holiday', region: 'CN' },
  '2026-10-01': { name: '國慶節', type: 'holiday', region: 'CN' },
  '2026-10-02': { name: '國慶節', type: 'holiday', region: 'CN' },
  '2026-10-03': { name: '國慶節', type: 'holiday', region: 'CN' },
  '2026-10-04': { name: '國慶節', type: 'holiday', region: 'CN' },
  '2026-10-05': { name: '國慶節', type: 'holiday', region: 'CN' },
  '2026-10-06': { name: '國慶節', type: 'holiday', region: 'CN' },
  '2026-10-07': { name: '國慶節', type: 'holiday', region: 'CN' },
  '2026-10-10': { name: '國慶日', type: 'holiday', region: 'TW' }
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

  // 靜默嘗試從遠端更新（針對大陸數據）
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
          remoteData[date] = {
            name: s.trim(),
            type: s.includes('上班') || s.includes('補') ? 'makeup' : 'holiday',
            region: 'CN'
          };
        }
      });
      Object.assign(finalMap, remoteData);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: remoteData, timestamp: Date.now() }));
    }
  } catch (error) {
    console.log('Using static database');
  }

  return finalMap;
};
