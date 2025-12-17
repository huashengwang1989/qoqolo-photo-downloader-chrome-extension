/**
 * Generate month-year range from start to end (inclusive)
 * @param startYearMonth - Start year-month in YYYY-MM format (e.g., "2024-01")
 * @param endYearMonth - End year-month in YYYY-MM format (e.g., "2024-12")
 * @param maxMonths - Maximum number of months to generate (default: 12)
 * @returns Array of month-year strings in MM-YYYY format (e.g., "01-2024")
 */
export function generateMonthYearRange(
  startYearMonth: string,
  endYearMonth: string,
  maxMonths: number = 12,
): string[] {
  if (!startYearMonth || !endYearMonth) {
    return [];
  }

  const monthYearArray: string[] = [];
  let currentYearMonth = startYearMonth;
  let count = 0;

  while (currentYearMonth <= endYearMonth && count < maxMonths) {
    const [year, month] = currentYearMonth.split('-').map(Number);
    const monthYear = `${month.toString().padStart(2, '0')}-${year}`;
    monthYearArray.push(monthYear);

    // Increment month
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    currentYearMonth = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
    count += 1;
  }

  return monthYearArray;
}
