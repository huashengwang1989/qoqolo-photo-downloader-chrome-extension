/**
 * Extract year-month (yyyy_mm) from publish date (YYYY-MM-DD)
 */
export function extractYearMonth(publishDate: string): string | null {
  const match = publishDate.match(/^(\d{4})-(\d{2})-/);
  if (match) {
    return `${match[1]}_${match[2]}`;
  }
  return null;
}

