
import { HolidayMap, HolidayInfo } from '../types';

const CACHE_KEY = 'tripplan_holiday_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小時過期

// 針對 API 可能漏掉的特定紀念日進行補充
const SPECIAL_MEMORIAL_DAYS: HolidayMap = {
  '2024-12-25': { name: '行憲紀念日', type: 'commemoration', region: 'TW' },
  '2025-12-25': { name: '行憲紀念日', type: 'commemoration', region: 'TW' },
  '2026-12-25': { name: '行憲紀念日', type: 'commemoration', region: 'TW' },
};

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  types: string[];
}

export const fetchHolidays = async (years: number[]): Promise<HolidayMap> => {
  // 檢查快取
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRY) {
      return data;
    }
  }

  const newHolidayMap: HolidayMap = { ...SPECIAL_MEMORIAL_DAYS };
  const countries = ['TW', 'CN'];

  try {
    const fetchPromises = years.flatMap(year => 
      countries.map(country => 
        fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      )
    );

    const results = await Promise.all(fetchPromises);
    const allHolidays: NagerHoliday[] = results.flat();

    allHolidays.forEach(h => {
      // 如果同一天多個區域都有，標註為 BOTH
      const existing = newHolidayMap[h.date];
      if (existing) {
        if (existing.region !== h.countryCode) {
          existing.region = 'BOTH';
          // 偏好顯示本地名稱，但如果有多個名稱則合併
          if (!existing.name.includes(h.localName)) {
            existing.name = `${existing.name}/${h.localName}`;
          }
        }
      } else {
        newHolidayMap[h.date] = {
          name: h.localName,
          type: 'holiday',
          region: h.countryCode as 'TW' | 'CN'
        };
      }
    });

    // 儲存至快取
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: newHolidayMap,
      timestamp: Date.now()
    }));

    return newHolidayMap;
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return SPECIAL_MEMORIAL_DAYS; // 失敗時回傳基礎資料
  }
};
