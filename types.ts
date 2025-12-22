
export type DateRange = {
  startDate: Date | null;
  endDate: Date | null;
};

export interface Trip {
  id: string;
  startDate: Date;
  endDate: Date;
  lastUpdated?: string;
}

export type HolidayType = 'holiday' | 'makeup' | 'commemoration';

export interface HolidayInfo {
  name: string;
  type: HolidayType;
  region: 'TW' | 'CN' | 'BOTH';
}

export type HolidayMap = Record<string, HolidayInfo>;

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelectedStart: boolean;
  isSelectedEnd: boolean;
  isInRange: boolean;
  isDisabled: boolean;
}
