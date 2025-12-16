import type { MonthDate } from '@/shared/types';

/**
 * Get current month as max date
 */
export function getCurrentMonth(): MonthDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // getMonth() returns 0-11
  };
}

