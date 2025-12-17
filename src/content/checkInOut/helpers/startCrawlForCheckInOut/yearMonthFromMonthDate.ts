import type { MonthDate } from '@/shared/types';

/**
 * Generate year-month from MonthDate
 */
export function yearMonthFromMonthDate(monthDate: MonthDate): string {
  return `${monthDate.year}-${monthDate.month.toString().padStart(2, '0')}`;
}

