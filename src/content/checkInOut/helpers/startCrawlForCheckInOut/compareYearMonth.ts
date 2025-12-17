/**
 * Compare two year-months (YYYY-MM format)
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareYearMonth(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

