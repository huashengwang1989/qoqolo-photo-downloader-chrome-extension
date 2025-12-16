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

/**
 * Convert datetime from "dd mmm yyyy, HH:MMam/pm" format (e.g., "29 Nov 2025, 10:58pm") to both date and datetime
 * @param datetimeText - Datetime string in "dd mmm yyyy, HH:MMam/pm" format
 * @returns Object with publishDate (YYYY-MM-DD) and publishDatetime (YYYY-MM-DD HH:MM), or empty strings if parsing fails
 */
export function parseDatetimeToDateAndDatetime(datetimeText: string): {
  publishDate: string;
  publishDatetime: string;
} {
  // Parse datetime from "dd mmm yyyy, HH:MMam/pm" format (e.g., "29 Nov 2025, 10:58pm")
  const datetimeMatch = datetimeText.match(/(\d{1,2})\s+(\w{3})\s+(\d{4}),\s+(\d{1,2}):(\d{2})(am|pm)/i);
  if (!datetimeMatch) {
    return { publishDate: '', publishDatetime: '' };
  }

  const [, day, monthName, year, hour, minute, ampm] = datetimeMatch;
  const month = MONTH_MAP[monthName] || '01';
  const paddedDay = day.padStart(2, '0');

  // Convert to 24-hour format
  let hour24 = parseInt(hour, 10);
  if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
    hour24 += 12;
  } else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
    hour24 = 0;
  }
  const paddedHour = hour24.toString().padStart(2, '0');
  const paddedMinute = minute.padStart(2, '0');

  const publishDate = `${year}-${month}-${paddedDay}`;
  const publishDatetime = `${publishDate} ${paddedHour}:${paddedMinute}`;

  return { publishDate, publishDatetime };
}
