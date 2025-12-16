import type { MonthDate } from '@/shared/types';

/**
 * Check if a MonthDate equals the current month
 */
export function isCurrentMonth(date: MonthDate, maxDate: MonthDate): boolean {
  return date.year === maxDate.year && date.month === maxDate.month;
}

