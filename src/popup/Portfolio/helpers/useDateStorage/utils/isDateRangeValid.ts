import type { MonthDate } from '../../../components/MonthDatePicker';

/**
 * Check if date range is valid (from <= to)
 */
export function isDateRangeValid(dateFrom: MonthDate | null, dateTo: MonthDate | null): boolean {
  // If either date is not set, range is valid (no filtering)
  if (!dateFrom || !dateTo) {
    return true;
  }

  // Compare year-month: from should be <= to
  // If from year is less than to year, it's valid
  if (dateFrom.year < dateTo.year) {
    return true;
  }

  // If from year is greater than to year, it's invalid
  if (dateFrom.year > dateTo.year) {
    return false;
  }

  // Same year: from month must be <= to month
  return dateFrom.month <= dateTo.month;
}

