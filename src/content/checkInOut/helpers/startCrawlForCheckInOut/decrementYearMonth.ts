/**
 * Decrement a year-month by one month (go backward)
 */
export function decrementYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  return `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
}

