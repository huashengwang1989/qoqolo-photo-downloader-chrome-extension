import { extractYearMonth } from './extractYearMonth';

import type { PortfolioItem } from '@/shared/types/portfolio';

/**
 * Calculate date range (earliest to latest) from all items
 * Returns format: "yyyy_mm-yyyy_mm" or null if no valid dates found
 */
export function calculateDateRange(items: PortfolioItem[]): string | null {
  const yearMonths: string[] = [];

  for (const item of items) {
    if (item.details?.publishDate) {
      const ym = extractYearMonth(item.details.publishDate);
      if (ym) {
        yearMonths.push(ym);
      }
    }
  }

  if (yearMonths.length === 0) {
    return null;
  }

  // Sort year-months (format: yyyy_mm, so string sort works)
  yearMonths.sort();

  const earliest = yearMonths[0];
  const latest = yearMonths[yearMonths.length - 1];

  // Always return "yyyy_mm-yyyy_mm" format (even if same date)
  return `${earliest}-${latest}`;
}
