import { collectItems } from './helpers/collectItems';
import { extractItemDetails } from './helpers/extractItemDetails';

import { SIGNALS } from '@/shared/enums';
import { getPageType } from '@/shared/helpers/page';
import { sleep } from '@/shared/helpers/utils';
import { checkIsDateInRange } from '@/shared/utils/date';
import { MAX_CRAWL_COUNT_PER_TIME } from '@/configs';
import type { ContentMessage, ContentResponse, MonthDate } from '@/shared/types';
import type { Item } from '@/shared/types/item';

const STORAGE_KEY = 'classActivityCrawlItems';

// Track crawling state
let isCrawling = false;
let shouldStop = false;

/**
 * Handle class activity-specific messages
 */
export function handleClassActivityMessage(
  message: ContentMessage,
  sendResponse: (response?: ContentResponse) => void,
) {
  if (message.type === SIGNALS.CLASS_ACTIVITY_START_CRAWL) {
    if (isCrawling) {
      console.warn('[content] Crawl already in progress');
      sendResponse({ ok: false });
      return true;
    }
    console.info('[content] handleClassActivityMessage - Starting crawl', message.dateRange);
    startCrawl(message.dateRange).catch(console.error);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === SIGNALS.CLASS_ACTIVITY_STOP_CRAWL) {
    console.info('[content] Stop crawl requested');
    shouldStop = true;
    sendResponse({ ok: true });
    return true;
  }

  return false;
}

/**
 * Start crawling class activity items
 * @param dateRange - Optional date range filter
 */
async function startCrawl(dateRange?: {
  from: MonthDate | null;
  to: MonthDate | null;
}): Promise<void> {
  const pageType = getPageType(location.href);
  if (!pageType || pageType !== 'qoqoloClassActivityPage') {
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
        type: SIGNALS.CLASS_ACTIVITY_ITEMS_UPDATED,
        items: [],
      })
      .catch(() => {
        // No listeners, that's okay
      });
  } catch (error) {
    console.error('[crawler] Failed to clear previous items:', error);
  }

  const items = collectItems({ maxCount: MAX_CRAWL_COUNT_PER_TIME });
  const processedItems: Item[] = [];

  // If no items found, send completion signal immediately
  if (items.length === 0) {
    console.info('[crawler] No items found');
    isCrawling = false;
    shouldStop = false;

    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: [] });
      chrome.runtime
        .sendMessage({
          type: SIGNALS.CLASS_ACTIVITY_CRAWL_COMPLETE,
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
            type: SIGNALS.CLASS_ACTIVITY_ITEMS_UPDATED,
            items: processedItems,
          })
          .catch(() => {
            // No listeners, that's okay
          });
        chrome.runtime
          .sendMessage({
            type: SIGNALS.CLASS_ACTIVITY_CRAWL_COMPLETE,
          })
          .catch(() => {
            // No listeners, that's okay
          });
      } catch (error) {
        console.error('[crawler] Failed to store final items:', error);
      }
      return;
    }

    // Extract details directly from the panel (no modal needed for Class Activity)
    const panel = document.querySelector<HTMLDivElement>(
      `div.infinite-item.post[data-rid="${item.rid}"]`,
    );

    if (!panel) {
      console.warn('[crawler] Panel not found for item', item.rid);
      continue;
    }

    const details = extractItemDetails(panel);

    // Check date range filter
    if (dateRange && details.publishDate) {
      const isInRange = checkIsDateInRange(details.publishDate, dateRange);
      if (!isInRange) {
        console.info('[crawler] Skipping item out of date range', item.link, details.publishDate);
        continue;
      }
    }

    const itemWithDetails: Item = {
      ...item,
      details,
    };

    processedItems.push(itemWithDetails);

    // Send update for each item
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: processedItems });
      chrome.runtime
        .sendMessage({
          type: SIGNALS.CLASS_ACTIVITY_ITEM_ADDED,
          item: itemWithDetails,
        })
        .catch(() => {
          // No listeners, that's okay
        });
    } catch (error) {
      console.error('[crawler] Failed to store item:', error);
    }

    // Wait 1 second before processing next item
    await sleep(1000);
  }

  // Crawl complete
  isCrawling = false;
  shouldStop = false;

  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: processedItems });
    chrome.runtime
      .sendMessage({
        type: SIGNALS.CLASS_ACTIVITY_ITEMS_UPDATED,
        items: processedItems,
      })
      .catch(() => {
        // No listeners, that's okay
      });
    chrome.runtime
      .sendMessage({
        type: SIGNALS.CLASS_ACTIVITY_CRAWL_COMPLETE,
      })
      .catch(() => {
        // No listeners, that's okay
      });
  } catch (error) {
    console.error('[crawler] Failed to store final items:', error);
  }
}
