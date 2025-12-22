
import { HolidayMap, HolidayInfo } from '../types';

const CACHE_KEY = 'tripplan_holiday_ics_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// 定應來源 (選擇 CORS 友善或常見的 CDN/GitHub 來源)
const SOURCES = [
  {
    url: 'https://raw.githubusercontent.com/shuyz/china-holiday-calender/master/holidayCal.ics',
    region: 'CN' as const
  },
  {
    // 台灣政府與社群維護的 ICS (透過 raw 存取避免 CORS)
    url: 'https://raw.githubusercontent.com/abc9070410/Taiwan-Holiday-ICS/master/taiwan_holidays.ics',
    region: 'TW' as const
  }
];

// 簡易 ICS 解析器
const parseICS = (icsText: string, region: 'TW' | 'CN'): HolidayMap => {
  const map: HolidayMap = {};
  const events = icsText.split('BEGIN:VEVENT');
  
  events.shift(); // 移除 header 部分

  events.forEach(event => {
    const summaryMatch = event.match(/SUMMARY:(.*)/);
    const dtStartMatch = event.match(/DTSTART;VALUE=DATE:(\d{8})/) || event.match(/DTSTART:(\d{8})/);
    
    if (summaryMatch && dtStartMatch) {
      const name = summaryMatch[1].trim();
      const rawDate = dtStartMatch[1]; // YYYYMMDD
      const formattedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
      
      // 判定是否為補班日
      const isMakeup = name.includes('補班') || name.includes('上班') || name.includes('工作日') || name.includes('Working Day');
      
      map[formattedDate] = {
        name: name.replace(/\[.*\]/g, '').trim(), // 移除括號備註
        type: isMakeup ? 'makeup' : 'holiday',
        region: region
      };
    }
  });

  return map;
};

export const fetchHolidays = async (): Promise<HolidayMap> => {
  // 檢查快取
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRY) {
      return data;
    }
  }

  let finalMap: HolidayMap = {};

  try {
    const results = await Promise.all(
      SOURCES.map(source => 
        fetch(source.url)
          .then(res => res.ok ? res.text() : '')
          .then(text => parseICS(text, source.region))
          .catch(() => ({}))
      )
    );

    // 合併結果
    results.forEach(res => {
      Object.entries(res).forEach(([date, info]) => {
        if (finalMap[date]) {
          // 如果同一天都有，標註為 BOTH
          if (finalMap[date].region !== info.region) {
            finalMap[date].region = 'BOTH';
          }
        } else {
          finalMap[date] = info;
        }
      });
    });

    // 儲存快取
    if (Object.keys(finalMap).length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: finalMap,
        timestamp: Date.now()
      }));
    }

    return finalMap;
  } catch (error) {
    console.error('ICS Fetch failed:', error);
    return {};
  }
};
