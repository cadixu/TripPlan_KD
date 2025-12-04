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

export type SelectionMode = 'start' | 'end' | 'idle';

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelectedStart: boolean;
  isSelectedEnd: boolean;
  isInRange: boolean;
  isDisabled: boolean;
}