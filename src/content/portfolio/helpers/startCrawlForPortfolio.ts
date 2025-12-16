import {
  startCrawlCore,
  type StartCrawlCoreConfig,
} from '../../activityShared/helpers/startCrawlCore';

import { collectItemsForPortfolio } from './collectItems';
import { handleCrawlItemForPortfolio } from './handleCrawlItem';
import { preCrawlScrollForPortfolio } from './preCrawlScroll';

import { SIGNALS } from '@/shared/enums';
import type { MonthDate } from '@/shared/types';
import type { PortfolioItem } from '@/shared/types/portfolio';

const STORAGE_KEY = 'portfolioCrawlItems';

/**
 * Start crawling portfolio items
 * @param dateRange - Optional date range filter
 * @param isCrawling - Crawling state flag reference
 * @param shouldStop - Stop flag reference
 */
export async function startCrawlForPortfolio(
  dateRange: { from: MonthDate | null; to: MonthDate | null } | undefined,
  isCrawling: { value: boolean },
  shouldStop: { value: boolean },
): Promise<void> {
  const config: StartCrawlCoreConfig<PortfolioItem> = {
    storageKey: STORAGE_KEY,
    itemsUpdatedSignal: SIGNALS.PORTFOLIO_ITEMS_UPDATED,
    itemAddedSignal: SIGNALS.PORTFOLIO_ITEM_ADDED,
    completionSignal: SIGNALS.PORTFOLIO_CRAWL_COMPLETE,
    collectItems: collectItemsForPortfolio,
    preCrawlScroll: preCrawlScrollForPortfolio,
    processItem: async (item, dateRange, _shouldStop) => {
      const result = await handleCrawlItemForPortfolio(item, dateRange);

      // Skip items that are out of date range
      if (result.hasIssue === 'out-of-date-range') {
        console.info('[crawler] Skipping item out of date range', item.link);
        return { success: false, skip: true };
      }

      // If login session is likely expired, stop crawling further items
      if (result.hasIssue === 'likely-login-session-expired') {
        console.warn('[crawler] Stopping crawl due to likely login session expiry');
        return { success: true, item: result.itemWithDetails, stopCrawl: true };
      }

      // Log issue if any
      if (result.hasIssue) {
        console.warn(`[crawler] Item had issue: ${result.hasIssue}`, item.link);
      }

      return { success: true, item: result.itemWithDetails };
    },
  };

  await startCrawlCore(dateRange, isCrawling, shouldStop, config);
}
