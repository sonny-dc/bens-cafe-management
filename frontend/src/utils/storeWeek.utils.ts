export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;

export const DEFAULT_CLOSING_DAY = 3; // Wednesday

export type StoreWeekRange = {
  startDate: string;
  endDate: string;
  weekStart: Date;
  weekEnd: Date;
};

export const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const getStoreWeekRange = (
  date: Date,
  closingDay: number
): StoreWeekRange => {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);

  const day = base.getDay();

  const diffToWeekStart =
    day >= closingDay
      ? day - closingDay
      : day + (7 - closingDay);

  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() - diffToWeekStart);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return {
    startDate: formatDateToYYYYMMDD(weekStart),
    endDate: formatDateToYYYYMMDD(weekEnd),
    weekStart,
    weekEnd
  };
};