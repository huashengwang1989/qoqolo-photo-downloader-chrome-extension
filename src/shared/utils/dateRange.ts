import type { MonthDate } from '@/shared/types';

/**
 * Check if a date (YYYY-MM-DD) is within the date range (month-level accuracy)
 * @param date - Date string in YYYY-MM-DD format
 * @param dateRange - Date range with from/to months
 * @returns true if date is within range (or range is not specified)
 */
export function checkIsDateInRange(
  date: string,
  dateRange?: { from: MonthDate | null; to: MonthDate | null },
): boolean {
  if (!dateRange || (!dateRange.from && !dateRange.to)) {
    return true; // No filter if range is not specified
  }

  // Parse date string (YYYY-MM-DD) to year-month
  const dateMatch = date.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!dateMatch) {
    return true; // If date format is invalid, include it
  }

  const [, yearStr, monthStr] = dateMatch;
  const itemYear = parseInt(yearStr, 10);
  const itemMonth = parseInt(monthStr, 10);

  // Check "from" constraint
  if (dateRange.from) {
    if (itemYear < dateRange.from.year) {
      return false;
    }
    if (itemYear === dateRange.from.year && itemMonth < dateRange.from.month) {
      return false;
    }
  }

  // Check "to" constraint
  if (dateRange.to) {
    if (itemYear > dateRange.to.year) {
      return false;
    }
    if (itemYear === dateRange.to.year && itemMonth > dateRange.to.month) {
      return false;
    }
  }

  return true;
}

