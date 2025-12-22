
import { HolidayMap, HolidayInfo } from '../types';

const CACHE_KEY = 'tripplan_holiday_ics_cache_v4'; 
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * 經過驗證的穩定來源組。
 * 使用 jsdelivr CDN 加速 github 和 npm 資源。
 */
const SOURCE_GROUPS = {
  CN: [
    // 來源 1: 來自 NPM (最推薦，極度穩定)
    'https://cdn.jsdelivr.net/npm/chinese-days/dist/holidays.ics',
    // 來源 2: GitHub 鏡像
    'https://cdn.jsdelivr.net/gh/shuyz/china-holiday-calender@master/holidayCal.ics'
  ],
  TW: [
    // 來源 1: 目前最活躍的台灣節假日倉庫 (shixu1991)
    'https://cdn.jsdelivr.net/gh/shixu1991/taiwan-holidays@main/taiwan-holidays.ics',
    // 來源 2: 備用穩定來源 (poychang)
    'https://cdn.jsdelivr.net/gh/poychang/taiwan-holidays@main/taiwan_holidays.ics'
  ]
};

// 2025 年硬編碼保險清單 (確保斷網或 404 時依然有資料)
const SAFETY_HOLIDAYS_2025: HolidayMap = {
  // 共同假日
  '2025-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },
  '2025-01-28': { name: '除夕', type: 'holiday', region: 'BOTH' },
  '2025-01-29': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2025-01-30': { name: '初二', type: 'holiday', region: 'BOTH' },
  '2025-01-31': { name: '初三', type: 'holiday', region: 'BOTH' },
  // 台灣專屬
  '2025-02-28': { name: '和平紀念日', type: 'holiday', region: 'TW' },
  '2025-04-04': { name: '兒童節', type: 'holiday', region: 'TW' },
  '2025-04-05': { name: '清明節', type: 'holiday', region: 'TW' },
  '2025-05-31': { name: '端午節', type: 'holiday', region: 'TW' },
  '2025-10-06': { name: '中秋節', type: 'holiday', region: 'TW' },
  '2025-10-10': { name: '國慶日', type: 'holiday', region: 'TW' },
  // 大陸專屬
  '2025-05-01': { name: '勞動節', type: 'holiday', region: 'CN' },
  '2025-10-01': { name: '國慶節', type: 'holiday', region: 'CN' }
};

const parseICS = (icsText: string, region: 'TW' | 'CN'): HolidayMap => {
  const map: HolidayMap = {};
  if (!icsText || !icsText.includes('BEGIN:VEVENT')) return map;

  const events = icsText.split('BEGIN:VEVENT');
  events.shift(); 

  events.forEach(event => {
    const lines = event.split(/\r?\n/);
    let name = '';
    let date = '';

    lines.forEach(line => {
      if (line.startsWith('SUMMARY:')) {
        name = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('DTSTART')) {
        const dateMatch = line.match(/:(\d{8})/);
        if (dateMatch) date = dateMatch[1];
      }
    });

    if (name && date && date.length === 8) {
      const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      const isMakeup = /補班|上班|工作日|Working|Makeup/i.test(name);
      
      map[formattedDate] = {
        name: name.replace(/\[.*\]|\(.*\)/g, '').trim(),
        type: isMakeup ? 'makeup' : 'holiday',
        region: region
      };
    }
  });

  return map;
};

const fetchWithFallback = async (urls: string[], region: 'TW' | 'CN'): Promise<HolidayMap> => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { 
        method: 'GET',
        cache: 'default' // 允許 CDN 快取
      });
      if (res.ok) {
        const text = await res.text();
        const data = parseICS(text, region);
        if (Object.keys(data).length > 0) return data;
      }
    } catch (e) {
      console.warn(`Retry failed for ${url}`);
    }
  }
  return {};
};

export const fetchHolidays = async (): Promise<HolidayMap> => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) return data;
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  let finalMap: HolidayMap = { ...SAFETY_HOLIDAYS_2025 }; // 先用保險清單初始化

  try {
    const [cnMap, twMap] = await Promise.all([
      fetchWithFallback(SOURCE_GROUPS.CN, 'CN'),
      fetchWithFallback(SOURCE_GROUPS.TW, 'TW')
    ]);

    const merge = (target: HolidayMap, source: HolidayMap) => {
      Object.entries(source).forEach(([date, info]) => {
        if (target[date]) {
          if (target[date].region !== info.region && target[date].region !== 'BOTH') {
            target[date].region = 'BOTH';
          }
        } else {
          target[date] = info;
        }
      });
    };

    if (Object.keys(cnMap).length > 0) merge(finalMap, cnMap);
    if (Object.keys(twMap).length > 0) merge(finalMap, twMap);

    if (Object.keys(finalMap).length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: finalMap,
        timestamp: Date.now()
      }));
    }

    return finalMap;
  } catch (error) {
    console.error('Fetching holidays failed, using safety data only.');
    return SAFETY_HOLIDAYS_2025;
  }
};
