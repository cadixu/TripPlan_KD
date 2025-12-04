
export type HolidayType = 'holiday' | 'makeup';

export interface HolidayInfo {
  name: string;
  type: HolidayType;
  region: 'TW' | 'CN' | 'BOTH';
}

const holidayMap: Record<string, HolidayInfo> = {
  // --- 2024 ---
  '2024-09-17': { name: '中秋節', type: 'holiday', region: 'BOTH' },
  '2024-10-01': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2024-10-02': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2024-10-03': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2024-10-04': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2024-10-05': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2024-10-06': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2024-10-07': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2024-10-10': { name: '國慶(台)', type: 'holiday', region: 'TW' },

  // --- 2025 ---
  
  // New Year
  '2025-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },

  // Lunar New Year (Spring Festival)
  '2025-01-25': { name: '春節(台)', type: 'holiday', region: 'TW' },
  '2025-01-26': { name: '春節(台)', type: 'holiday', region: 'TW' },
  '2025-01-27': { name: '除夕前', type: 'holiday', region: 'TW' },
  '2025-01-28': { name: '除夕', type: 'holiday', region: 'BOTH' },
  '2025-01-29': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2025-01-30': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2025-01-31': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2025-02-01': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2025-02-02': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2025-02-03': { name: '春節(陸)', type: 'holiday', region: 'CN' },
  '2025-02-04': { name: '春節(陸)', type: 'holiday', region: 'CN' },
  
  // LNY Makeup Workdays
  '2025-02-08': { name: '補班(陸)', type: 'makeup', region: 'CN' },

  // 228 Peace Memorial (TW)
  '2025-02-28': { name: '228和平', type: 'holiday', region: 'TW' },
  '2025-03-01': { name: '228連假', type: 'holiday', region: 'TW' },
  '2025-03-02': { name: '228連假', type: 'holiday', region: 'TW' },

  // Qingming / Children's Day
  '2025-04-03': { name: '兒童節', type: 'holiday', region: 'TW' },
  '2025-04-04': { name: '清明節', type: 'holiday', region: 'BOTH' },
  '2025-04-05': { name: '清明連假', type: 'holiday', region: 'BOTH' }, // Overlap
  '2025-04-06': { name: '清明連假', type: 'holiday', region: 'BOTH' },

  // Labor Day
  '2025-04-27': { name: '補班(陸)', type: 'makeup', region: 'CN' },
  '2025-05-01': { name: '勞動節', type: 'holiday', region: 'BOTH' }, // TW usually 1 day
  '2025-05-02': { name: '勞動節(陸)', type: 'holiday', region: 'CN' },
  '2025-05-03': { name: '勞動節(陸)', type: 'holiday', region: 'CN' },
  '2025-05-04': { name: '勞動節(陸)', type: 'holiday', region: 'CN' },
  '2025-05-05': { name: '勞動節(陸)', type: 'holiday', region: 'CN' },

  // Dragon Boat Festival
  '2025-05-31': { name: '端午連假', type: 'holiday', region: 'BOTH' },
  '2025-06-01': { name: '端午連假', type: 'holiday', region: 'BOTH' },
  '2025-06-02': { name: '端午節', type: 'holiday', region: 'BOTH' },

  // Mid-Autumn Festival
  '2025-10-06': { name: '中秋節', type: 'holiday', region: 'BOTH' },

  // China National Day
  '2025-09-28': { name: '補班(陸)', type: 'makeup', region: 'CN' },
  '2025-10-01': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2025-10-02': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2025-10-03': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2025-10-04': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2025-10-05': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2025-10-07': { name: '國慶(陸)', type: 'holiday', region: 'CN' },

  // Taiwan Double Tenth
  '2025-10-10': { name: '國慶(台)', type: 'holiday', region: 'TW' },
  '2025-10-11': { name: '國慶(台)', type: 'holiday', region: 'TW' }, // Overlap date handled by logic if needed, treating as TW holiday here as primary label
  '2025-10-12': { name: '國慶連假', type: 'holiday', region: 'TW' },
};

export const getHoliday = (dateStr: string): HolidayInfo | undefined => {
  return holidayMap[dateStr];
};
