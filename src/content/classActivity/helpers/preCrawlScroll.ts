import { preCrawlScroll as preCrawlScrollShared } from '../../activityShared/helpers/preCrawlScroll';

import { collectItemsForClassActivity } from './collectItems';

import type { MonthDate } from '@/shared/types';
import type { Item } from '@/shared/types/item';

/**
 * Pre-crawl scroll logic for date range filtering for Class Activity
 * Items are sorted chronologically from latest to earliest
 * @param allItems - Current items collection
 * @param dateRange - Date range to filter by
 * @param shouldStop - Stop flag reference
 * @returns Updated items collection after scrolling, or null if no items in range
 */
export async function preCrawlScrollForClassActivity(
  allItems: Item[],
  dateRange: { from: MonthDate | null; to: MonthDate | null },
  shouldStop: { value: boolean },
): Promise<Item[] | null> {
  return preCrawlScrollShared(allItems, dateRange, shouldStop, collectItemsForClassActivity);
}
