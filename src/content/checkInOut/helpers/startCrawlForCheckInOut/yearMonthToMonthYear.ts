/**
 * Convert year-month (YYYY-MM) to month-year (MM-YYYY)
 */
export function yearMonthToMonthYear(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${month}-${year}`;
}

