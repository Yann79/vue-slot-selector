import type { RequiredCalendarOptions } from '@/interfaces/CalendarOptions.interface';

const days: string[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const months: string[] = [
  'jan.',
  'feb.',
  'mar.',
  'apr.',
  'may.',
  'jun.',
  'jul.',
  'aug.',
  'sep.',
  'oct.',
  'nov.',
  'dec.',
];

const decomposeDate = (date: Date): number => {
  const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  return parseInt(`${date.getFullYear()}${month}${day}`, 10);
};

const disabledDate = (date1: string | Date, date2: string | Date): boolean => {
  const actualDate = new Date(date1);
  const today = new Date(date2);
  return decomposeDate(actualDate) <= decomposeDate(today);
};

const defaultCalendarOptions: RequiredCalendarOptions = {
  daysLabel: days,
  monthsLabel: months,
  limit: 2,
  spacing: 4,
  loadingLabel: 'Loading ...',
  disabledDate,
};

export default defaultCalendarOptions;
