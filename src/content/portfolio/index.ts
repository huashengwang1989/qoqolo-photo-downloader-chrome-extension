import { collectItems } from './helpers/collectItems';
import { handleCrawlItem } from './helpers/handleCrawlItem';

import { SIGNALS } from '@/shared/enums';
import { getPageType } from '@/shared/helpers/page';
import { sleep } from '@/shared/helpers/utils';
import { MAX_CRAWL_COUNT_PER_TIME } from '@/configs';
import type { ContentMessage, ContentResponse, MonthDate } from '@/shared/types';
import type { PortfolioItem } from '@/shared/types/portfolio';

const STORAGE_KEY = 'portfolioCrawlItems';

// Track crawling state
let isCrawling = false;
let shouldStop = false;

/**
 * Handle portfolio-specific messages
 */
export function handlePortfolioMessage(
  message: ContentMessage,
  sendResponse: (response?: ContentResponse) => void,
) {
  if (message.type === SIGNALS.PORTFOLIO_START_CRAWL) {
    if (isCrawling) {
      console.warn('[content] Crawl already in progress');
      sendResponse({ ok: false });
      return true;
    }
    console.info('[content] handlePortfolioMessage - Starting crawl', message.dateRange);
    startCrawl(message.dateRange).catch(console.error);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === SIGNALS.PORTFOLIO_STOP_CRAWL) {
    console.info('[content] Stop crawl requested');
    shouldStop = true;
    sendResponse({ ok: true });
    return true;
  }

  return false;
}

/**
 * Start crawling portfolio items
 * @param dateRange - Optional date range filter
 */
async function startCrawl(dateRange?: {
  from: MonthDate | null;
  to: MonthDate | null;
}): Promise<void> {
  const pageType = getPageType(location.href);
  if (!pageType || pageType !== 'qoqoloPortfolioPage') {
    console.warn('[crawler] Not on expected page');
    return;
  }

  isCrawling = true;
  shouldStop = false;

  console.info('[crawler] Starting crawl', pageType);

  // Clear previous items
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
    chrome.runtime
      .sendMessage({
        type: SIGNALS.PORTFOLIO_ITEMS_UPDATED,
        items: [],
      })
      .catch(() => {
        // No listeners, that's okay
      });
  } catch (error) {
    console.error('[crawler] Failed to clear previous items:', error);
  }

  const items = collectItems({ maxCount: MAX_CRAWL_COUNT_PER_TIME });
  const processedItems: PortfolioItem[] = [];

  // If no items found, send completion signal immediately
  if (items.length === 0) {
    console.info('[crawler] No items found');
    isCrawling = false;
    shouldStop = false;

    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: [] });
      chrome.runtime
        .sendMessage({
          type: SIGNALS.PORTFOLIO_CRAWL_COMPLETE,
        })
        .catch(() => {
          // No listeners, that's okay
        });
    } catch (error) {
      console.error('[crawler] Failed to send completion signal:', error);
    }
    return;
  }

  // Process items sequentially with 1 second delay between items
  for (const item of items) {
    // Check if stop was requested
    if (shouldStop) {
      console.info('[crawler] Crawl stopped by user');
      isCrawling = false;
      shouldStop = false;

      // Send final state even if stopped
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: processedItems });
        chrome.runtime
          .sendMessage({
            type: SIGNALS.PORTFOLIO_ITEMS_UPDATED,
            items: processedItems,
          })
          .catch(() => {
            // No listeners, that's okay
          });
        chrome.runtime
          .sendMessage({
            type: SIGNALS.PORTFOLIO_CRAWL_COMPLETE,
          })
          .catch(() => {
            // No listeners, that's okay
          });
      } catch (error) {
        console.error('[crawler] Failed to store final items:', error);
      }
      return;
    }

    const result = await handleCrawlItem(item, dateRange);

    // Skip items that are out of date range
    if (result.hasIssue === 'out-of-date-range') {
      console.info('[crawler] Skipping item out of date range', item.link);
      continue;
    }

    processedItems.push(result.itemWithDetails);

    // Log issue if any
    if (result.hasIssue) {
      console.warn(`[crawler] Item had issue: ${result.hasIssue}`, item.link);
    }

    // Send individual item to popup for real-time display
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: processedItems });
      chrome.runtime
        .sendMessage({
          type: SIGNALS.PORTFOLIO_ITEM_ADDED,
          item: result.itemWithDetails,
        })
        .catch(() => {
          // No listeners, that's okay
        });
    } catch (error) {
      console.error('[crawler] Failed to store/send item:', error);
    }

    // Wait 1 second before processing next item to avoid DDOS
    await sleep(1000);
  }

  console.info('[crawler] Crawl complete', processedItems);
  isCrawling = false;
  shouldStop = false;

  // Send final complete array and completion signal
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: processedItems });
    chrome.runtime
      .sendMessage({
        type: SIGNALS.PORTFOLIO_ITEMS_UPDATED,
        items: processedItems,
      })
      .catch(() => {
        // No listeners, that's okay
      });
    chrome.runtime
      .sendMessage({
        type: SIGNALS.PORTFOLIO_CRAWL_COMPLETE,
      })
      .catch(() => {
        // No listeners, that's okay
      });
  } catch (error) {
    console.error('[crawler] Failed to store final items:', error);
  }
}
