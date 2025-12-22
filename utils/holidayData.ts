
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
  '2025-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },
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
  '2025-02-08': { name: '補班(陸)', type: 'makeup', region: 'CN' },
  '2025-02-28': { name: '228和平', type: 'holiday', region: 'TW' },
  '2025-04-03': { name: '兒童節', type: 'holiday', region: 'TW' },
  '2025-04-04': { name: '清明節', type: 'holiday', region: 'BOTH' },
  '2025-05-01': { name: '勞動節', type: 'holiday', region: 'BOTH' },
  '2025-05-31': { name: '端午連假', type: 'holiday', region: 'BOTH' },
  '2025-06-01': { name: '端午連假', type: 'holiday', region: 'BOTH' },
  '2025-06-02': { name: '端午節', type: 'holiday', region: 'BOTH' },
  '2025-10-06': { name: '中秋節', type: 'holiday', region: 'BOTH' },
  '2025-10-10': { name: '國慶(台)', type: 'holiday', region: 'TW' },
  '2025-12-25': { name: '行憲紀念', type: 'holiday', region: 'TW' },

  // --- 2026 ---
  '2026-01-01': { name: '元旦', type: 'holiday', region: 'BOTH' },
  
  // 春節 2026 (正月初一 2/17)
  '2026-02-16': { name: '除夕', type: 'holiday', region: 'BOTH' },
  '2026-02-17': { name: '春節', type: 'holiday', region: 'BOTH' },
  '2026-02-18': { name: '初二', type: 'holiday', region: 'BOTH' },
  '2026-02-19': { name: '初三', type: 'holiday', region: 'BOTH' },
  '2026-02-20': { name: '初四', type: 'holiday', region: 'BOTH' },
  '2026-02-21': { name: '初五', type: 'holiday', region: 'BOTH' },
  '2026-02-22': { name: '初六', type: 'holiday', region: 'BOTH' },

  // 228 Peace Memorial 2026
  '2026-02-28': { name: '228和平', type: 'holiday', region: 'TW' },

  // Tomb Sweeping 2026
  '2026-04-04': { name: '兒童/清明', type: 'holiday', region: 'BOTH' },
  '2026-04-05': { name: '清明連假', type: 'holiday', region: 'BOTH' },

  // Labor Day 2026
  '2026-05-01': { name: '勞動節', type: 'holiday', region: 'BOTH' },

  // Dragon Boat 2026 (五月初五 6/19)
  '2026-06-19': { name: '端午節', type: 'holiday', region: 'BOTH' },
  '2026-06-20': { name: '端午連假', type: 'holiday', region: 'BOTH' },
  '2026-06-21': { name: '端午連假', type: 'holiday', region: 'BOTH' },

  // Mid-Autumn 2026 (八月十五 9/25)
  '2026-09-25': { name: '中秋節', type: 'holiday', region: 'BOTH' },
  '2026-09-26': { name: '中秋連假', type: 'holiday', region: 'BOTH' },
  '2026-09-27': { name: '中秋連假', type: 'holiday', region: 'BOTH' },

  // National Day 2026
  '2026-10-01': { name: '國慶(陸)', type: 'holiday', region: 'CN' },
  '2026-10-10': { name: '國慶(台)', type: 'holiday', region: 'TW' },
  '2026-12-25': { name: '行憲紀念', type: 'holiday', region: 'TW' },
};

export const getHoliday = (dateStr: string): HolidayInfo | undefined => {
  return holidayMap[dateStr];
};
