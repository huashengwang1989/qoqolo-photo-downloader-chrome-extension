import {
  startCrawlCore,
  type StartCrawlCoreConfig,
} from '../../activityShared/helpers/startCrawlCore';

import { collectItemsForClassActivity } from './collectItems';
import { preCrawlScrollForClassActivity } from './preCrawlScroll';
import { processItemForClassActivity } from './processItem';

import { MAX_CRAWL_COUNT } from '@/configs';
import { SIGNALS } from '@/shared/enums';
import type { MonthDate } from '@/shared/types';
import type { Item } from '@/shared/types/item';

const STORAGE_KEY = 'classActivityCrawlItems';

/**
 * Start crawling class activity items
 * @param dateRange - Optional date range filter
 * @param isCrawling - Crawling state flag reference
 * @param shouldStop - Stop flag reference
 */
export async function startCrawlForClassActivity(
  dateRange: { from: MonthDate | null; to: MonthDate | null } | undefined,
  isCrawling: { value: boolean },
  shouldStop: { value: boolean },
): Promise<void> {
  const config: StartCrawlCoreConfig<Item> = {
    storageKey: STORAGE_KEY,
    itemsUpdatedSignal: SIGNALS.CLASS_ACTIVITY_ITEMS_UPDATED,
    itemAddedSignal: SIGNALS.CLASS_ACTIVITY_ITEM_ADDED,
    completionSignal: SIGNALS.CLASS_ACTIVITY_CRAWL_COMPLETE,
    collectItems: collectItemsForClassActivity,
    preCrawlScroll: preCrawlScrollForClassActivity,
    getWrapper: () => document.querySelector<HTMLElement>('div.infinite-panel.posts-container'),
    maxCrawlCount: MAX_CRAWL_COUNT.CLASS_ACTIVITY,
    processItem: async (item, dateRange, shouldStop) => {
      const itemWithDetails = await processItemForClassActivity(item, dateRange, shouldStop);
      if (itemWithDetails === null) {
        return { success: false, skip: true };
      }
      return { success: true, item: itemWithDetails };
    },
  };

  await startCrawlCore(dateRange, isCrawling, shouldStop, config);
}
