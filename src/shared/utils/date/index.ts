import { MONTH_MAP } from './constants';

/**
 * Convert date from "dd mmm yyyy" format (e.g., "25 Aug 2025") to "YYYY-MM-DD" format (e.g., "2025-08-25")
 * @param dateText - Date string in "dd mmm yyyy" format
 * @returns Date string in "YYYY-MM-DD" format, or empty string if parsing fails
 */
export function formatDateToYYYYMMDD(dateText: string): string {
  // Parse date from "dd mmm yyyy" format (e.g., "25 Aug 2025")
  const dateMatch = dateText.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (!dateMatch) {
    return '';
  }

  const [, day, monthName, year] = dateMatch;
  const month = MONTH_MAP[monthName] || '01';
  const paddedDay = day.padStart(2, '0');

  return `${year}-${month}-${paddedDay}`;
}
