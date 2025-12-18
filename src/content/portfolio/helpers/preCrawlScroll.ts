import { preCrawlScroll as preCrawlScrollShared } from '../../activityShared/helpers/preCrawlScroll';

import { collectItemsForPortfolio } from './collectItems';

import type { MonthDate } from '@/shared/types';
import type { PortfolioItem } from '@/shared/types/portfolio';

/**
 * Pre-crawl scroll logic for date range filtering for Portfolio
 * Items are sorted chronologically from latest to earliest
 * @param allItems - Current items collection
 * @param dateRange - Date range to filter by
 * @param shouldStop - Stop flag reference
 * @param getWrapper - Optional function to get the infinite-panel wrapper
 * @returns Updated items collection after scrolling, or null if no items in range
 */
export async function preCrawlScrollForPortfolio(
  allItems: PortfolioItem[],
  dateRange: { from: MonthDate | null; to: MonthDate | null },
  shouldStop: { value: boolean },
  getWrapper?: () => HTMLElement | null,
): Promise<PortfolioItem[] | null> {
  return preCrawlScrollShared(allItems, dateRange, shouldStop, collectItemsForPortfolio, getWrapper);
}
