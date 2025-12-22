
import { HolidayMap, HolidayInfo } from '../types';

const CACHE_KEY = 'tripplan_holiday_ics_cache_v2'; // 更新版本號以強制重新整理
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * 使用 JSDelivr CDN 存取 GitHub 檔案。
 * 格式：https://cdn.jsdelivr.net/gh/[user]/[repo]@[branch]/[file]
 * 這樣可以避開 GitHub raw 的限制並獲得更好的全球加速。
 */
const SOURCES = [
  {
    // 中國節假日：shuyz/china-holiday-calender
    url: 'https://cdn.jsdelivr.net/gh/shuyz/china-holiday-calender@master/holidayCal.ics',
    region: 'CN' as const
  },
  {
    // 台灣節假日：abc9070410/Taiwan-Holiday-ICS
    url: 'https://cdn.jsdelivr.net/gh/abc9070410/Taiwan-Holiday-ICS@master/taiwan_holidays.ics',
    region: 'TW' as const
  }
];

// 增強型 ICS 解析器
const parseICS = (icsText: string, region: 'TW' | 'CN'): HolidayMap => {
  const map: HolidayMap = {};
  if (!icsText || !icsText.includes('BEGIN:VEVENT')) return map;

  const events = icsText.split('BEGIN:VEVENT');
  events.shift(); // 移除 header

  events.forEach(event => {
    // 處理可能的換行符號 (\r\n 或 \n)
    const lines = event.split(/\r?\n/);
    let name = '';
    let date = '';

    lines.forEach(line => {
      if (line.startsWith('SUMMARY:')) {
        name = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('DTSTART')) {
        // 匹配 DTSTART;VALUE=DATE:20250101 或 DTSTART:20250101
        const dateMatch = line.match(/:(\d{8})/);
        if (dateMatch) date = dateMatch[1];
      }
    });

    if (name && date && date.length === 8) {
      const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      
      // 判定是否為補班日 (支援繁簡體偵測)
      const isMakeup = /補班|上班|工作日|Working Day/.test(name);
      
      map[formattedDate] = {
        name: name.replace(/\[.*\]/g, '').trim(), // 移除括號內的額外資訊
        type: isMakeup ? 'makeup' : 'holiday',
        region: region
      };
    }
  });

  return map;
};

export const fetchHolidays = async (): Promise<HolidayMap> => {
  // 1. 檢查快取
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        console.log('Using cached holiday data');
        return data;
      }
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  console.log('Fetching fresh holiday data from CDN...');
  let finalMap: HolidayMap = {};

  try {
    const results = await Promise.all(
      SOURCES.map(source => 
        fetch(source.url)
          .then(async res => {
            if (!res.ok) {
              console.warn(`Failed to fetch ${source.region} holidays from ${source.url}: ${res.status}`);
              return '';
            }
            return res.text();
          })
          .then(text => parseICS(text, source.region))
          .catch(err => {
            console.error(`Fetch error for ${source.region}:`, err);
            return {};
          })
      )
    );

    // 2. 合併台灣與中國大陸的結果
    results.forEach(res => {
      Object.entries(res).forEach(([date, info]) => {
        if (finalMap[date]) {
          // 如果同一天都有 (例如元旦)，標註為 BOTH，名稱以當前區域優先
          if (finalMap[date].region !== info.region) {
            finalMap[date].region = 'BOTH';
          }
        } else {
          finalMap[date] = info;
        }
      });
    });

    // 3. 儲存快取
    if (Object.keys(finalMap).length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: finalMap,
        timestamp: Date.now()
      }));
    }

    return finalMap;
  } catch (error) {
    console.error('All holiday fetches failed:', error);
    return {};
  }
};
