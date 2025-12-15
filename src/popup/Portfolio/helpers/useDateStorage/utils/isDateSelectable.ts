import type { MonthDate } from '../../../components/MonthDatePicker';

/**
 * Check if a MonthDate is within the selectable range (not after maxDate)
 */
export function isDateSelectable(date: MonthDate, maxDate: MonthDate): boolean {
  if (date.year > maxDate.year) {
    return false;
  }
  if (date.year === maxDate.year && date.month > maxDate.month) {
    return false;
  }
  return true;
}
