
import { HolidayMap, HolidayInfo } from '../types';

const CACHE_KEY = 'tripplan_holiday_ics_cache_v3'; 
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * 定義多個備用來源，如果第一個失敗會自動嘗試下一個。
 */
const SOURCE_GROUPS = {
  CN: [
    // 來源 1: NPM 鏡像 (極度穩定)
    'https://cdn.jsdelivr.net/npm/chinese-days/dist/holidays.ics',
    // 來源 2: GitHub Raw (備用)
    'https://raw.githubusercontent.com/shuyz/china-holiday-calender/master/holidayCal.ics'
  ],
  TW: [
    // 來源 1: 另一個穩定維護的台灣假日
    'https://raw.githubusercontent.com/l89/taiwan-holidays-ics/master/taiwan_holidays.ics',
    // 來源 2: 原本的台灣假日
    'https://raw.githubusercontent.com/abc9070410/Taiwan-Holiday-ICS/master/taiwan_holidays.ics'
  ]
};

// 增強型 ICS 解析器
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
      // 處理 SUMMARY 可能被拆行的情況
      if (line.startsWith('SUMMARY:')) {
        name = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('DTSTART')) {
        const dateMatch = line.match(/:(\d{8})/);
        if (dateMatch) date = dateMatch[1];
      }
    });

    if (name && date && date.length === 8) {
      const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      
      // 判定是否為補班日
      // chinese-days 的格式通常會寫 [上班] 或 (補班)
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

/**
 * 嘗試從一個來源組中抓取資料，直到成功為止
 */
const fetchWithFallback = async (urls: string[], region: 'TW' | 'CN'): Promise<HolidayMap> => {
  for (const url of urls) {
    try {
      console.log(`Trying to fetch ${region} holidays from: ${url}`);
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) {
        const text = await res.text();
        const data = parseICS(text, region);
        if (Object.keys(data).length > 0) {
          console.log(`Successfully loaded ${region} holidays from ${url}`);
          return data;
        }
      } else {
        console.warn(`Source ${url} returned status ${res.status}`);
      }
    } catch (e) {
      console.warn(`Failed to fetch from ${url}`, e);
    }
  }
  return {};
};

export const fetchHolidays = async (): Promise<HolidayMap> => {
  // 1. 檢查快取
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  // 2. 執行抓取
  let finalMap: HolidayMap = {};

  try {
    const [cnMap, twMap] = await Promise.all([
      fetchWithFallback(SOURCE_GROUPS.CN, 'CN'),
      fetchWithFallback(SOURCE_GROUPS.TW, 'TW')
    ]);

    // 3. 合併結果
    const merge = (target: HolidayMap, source: HolidayMap) => {
      Object.entries(source).forEach(([date, info]) => {
        if (target[date]) {
          if (target[date].region !== info.region) {
            target[date].region = 'BOTH';
          }
        } else {
          target[date] = info;
        }
      });
    };

    merge(finalMap, cnMap);
    merge(finalMap, twMap);

    // 4. 內建基礎保險 (如果網路全掛，至少有大節日)
    const safetyHolidays: HolidayMap = {
      '2025-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },
      '2025-01-28': { name: '除夕', type: 'holiday', region: 'BOTH' },
      '2025-01-29': { name: '春節', type: 'holiday', region: 'BOTH' },
      '2025-10-01': { name: '國慶節', type: 'holiday', region: 'CN' },
      '2025-10-10': { name: '國慶日', type: 'holiday', region: 'TW' },
    };

    // 只有在 finalMap 真的抓不到東西時才補入保險
    if (Object.keys(finalMap).length === 0) {
      finalMap = safetyHolidays;
    }

    // 5. 儲存快取
    if (Object.keys(finalMap).length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: finalMap,
        timestamp: Date.now()
      }));
    }

    return finalMap;
  } catch (error) {
    console.error('All holiday fetch methods failed:', error);
    return {};
  }
};
