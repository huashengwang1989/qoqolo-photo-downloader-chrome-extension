import type { Item } from '@/shared/types/item';
import type { MonthDate } from '@/shared/types';
import { sleep } from '@/shared/helpers/utils';
import { MAX_CRAWL_COUNT_PER_TIME } from '@/configs';
import { SIGNALS } from '@/shared/enums';

export interface StartCrawlCoreConfig<TItem extends Item> {
  storageKey: string;
  itemsUpdatedSignal: SIGNALS;
  itemAddedSignal: SIGNALS;
  completionSignal: SIGNALS;
  collectItems: (options?: { maxCount?: number }) => TItem[];
  preCrawlScroll: (
    allItems: TItem[],
    dateRange: { from: MonthDate | null; to: MonthDate | null },
    shouldStop: { value: boolean },
  ) => Promise<TItem[] | null>;
  processItem: (
    item: TItem,
    dateRange: { from: MonthDate | null; to: MonthDate | null } | undefined,
    shouldStop: { value: boolean },
  ) => Promise<ProcessItemResult<TItem>>;
}

export type ProcessItemResult<TItem extends Item> =
  | { success: true; item: TItem; stopCrawl?: boolean }
  | { success: false; skip: true };

/**
 * Core crawl logic shared between Portfolio and Class Activity
 */
export async function startCrawlCore<TItem extends Item>(
  dateRange: { from: MonthDate | null; to: MonthDate | null } | undefined,
  isCrawling: { value: boolean },
  shouldStop: { value: boolean },
  config: StartCrawlCoreConfig<TItem>,
): Promise<void> {
  const {
    storageKey,
    itemsUpdatedSignal,
    itemAddedSignal,
    completionSignal,
    collectItems,
    preCrawlScroll,
    processItem,
  } = config;

  isCrawling.value = true;
  shouldStop.value = false;

  console.info('[crawler] Starting crawl');

  // Clear previous items
  try {
    await chrome.storage.local.set({ [storageKey]: [] });
    chrome.runtime
      .sendMessage({
        type: itemsUpdatedSignal,
        items: [],
      })
      .catch(() => {
        // No listeners, that's okay
      });
  } catch (error) {
    console.error('[crawler] Failed to clear previous items:', error);
  }

  // Track all processed item links to avoid duplicates
  const processedLinks = new Set<string>();
  let allItems = collectItems({ maxCount: MAX_CRAWL_COUNT_PER_TIME });
  const processedItems: TItem[] = [];

  // If no items found, send completion signal immediately
  if (allItems.length === 0) {
    console.info('[crawler] No items found');
    isCrawling.value = false;
    shouldStop.value = false;

    try {
      await chrome.storage.local.set({ [storageKey]: [] });
      chrome.runtime
        .sendMessage({
          type: completionSignal,
        })
        .catch(() => {
          // No listeners, that's okay
        });
    } catch (error) {
      console.error('[crawler] Failed to send completion signal:', error);
    }
    return;
  }

  // Edge case: Pre-crawl scroll logic for date range filtering
  if (dateRange) {
    const scrollResult = await preCrawlScroll(allItems, dateRange, shouldStop);
    if (scrollResult === null) {
      // No items in range found
      isCrawling.value = false;
      shouldStop.value = false;

      try {
        await chrome.storage.local.set({ [storageKey]: [] });
        chrome.runtime
          .sendMessage({
            type: completionSignal,
          })
          .catch(() => {
            // No listeners, that's okay
          });
      } catch (error) {
        console.error('[crawler] Failed to send completion signal:', error);
      }
      return;
    }
    allItems = scrollResult;
  }

  // Process items in batches, checking for new items after each batch
  while (allItems.length > 0 && !shouldStop.value) {
    // Filter out already processed items
    const itemsToProcess = allItems.filter((item) => !processedLinks.has(item.link));

    if (itemsToProcess.length === 0) {
      // No new items to process, check if more items loaded
      const newItems = collectItems({ maxCount: MAX_CRAWL_COUNT_PER_TIME });
      // Filter out already processed items
      const trulyNewItems = newItems.filter((item) => !processedLinks.has(item.link));

      if (trulyNewItems.length === 0) {
        // No more new items found, we're done
        console.info('[crawler] No more new items found, crawl complete');
        break;
      }

      // Found new items, add them to the processing list
      console.info(
        `[crawler] Found ${trulyNewItems.length} new items after scrolling, continuing crawl`,
      );
      allItems = newItems;
      continue;
    }

    // Process items sequentially with 1 second delay between items
    for (const item of itemsToProcess) {
      // Check if stop was requested
      if (shouldStop.value) {
        console.info('[crawler] Crawl stopped by user');
        isCrawling.value = false;
        shouldStop.value = false;

        // Send final state even if stopped
        try {
          await chrome.storage.local.set({ [storageKey]: processedItems });
          chrome.runtime
            .sendMessage({
              type: itemsUpdatedSignal,
              items: processedItems,
            })
            .catch(() => {
              // No listeners, that's okay
            });
          chrome.runtime
            .sendMessage({
              type: completionSignal,
            })
            .catch(() => {
              // No listeners, that's okay
            });
        } catch (error) {
          console.error('[crawler] Failed to store final items:', error);
        }
        return;
      }

      const result = await processItem(item, dateRange, shouldStop);

      if (!result.success) {
        // Item was skipped
        processedLinks.add(item.link); // Mark as processed even if skipped
        continue;
      }

      // Check if we should stop crawling (e.g., login session expired)
      if (result.stopCrawl) {
        isCrawling.value = false;
        shouldStop.value = false;

        try {
          await chrome.storage.local.set({ [storageKey]: processedItems });
          chrome.runtime
            .sendMessage({
              type: itemsUpdatedSignal,
              items: processedItems,
            })
            .catch(() => {
              // No listeners, that's okay
            });
          chrome.runtime
            .sendMessage({
              type: completionSignal,
            })
            .catch(() => {
              // No listeners, that's okay
            });
        } catch (error) {
          console.error('[crawler] Failed to store items after stop condition:', error);
        }

        return;
      }

      processedItems.push(result.item);
      processedLinks.add(item.link); // Mark as processed

      // Send individual item to popup for real-time display
      try {
        await chrome.storage.local.set({ [storageKey]: processedItems });
        chrome.runtime
          .sendMessage({
            type: itemAddedSignal,
            item: result.item,
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

    // After processing this batch, check for new items that may have loaded
    if (!shouldStop.value && processedItems.length < MAX_CRAWL_COUNT_PER_TIME) {
      const newItems = collectItems({ maxCount: MAX_CRAWL_COUNT_PER_TIME });
      const trulyNewItems = newItems.filter((item) => !processedLinks.has(item.link));

      if (trulyNewItems.length > 0) {
        console.info(`[crawler] Found ${trulyNewItems.length} new items, continuing crawl`);
        allItems = newItems;
      } else {
        // No more new items, we're done
        break;
      }
    }
  }

  console.info('[crawler] Crawl complete', processedItems);
  isCrawling.value = false;
  shouldStop.value = false;

  // Send final complete array and completion signal
  try {
    await chrome.storage.local.set({ [storageKey]: processedItems });
    chrome.runtime
      .sendMessage({
        type: itemsUpdatedSignal,
        items: processedItems,
      })
      .catch(() => {
        // No listeners, that's okay
      });
    chrome.runtime
      .sendMessage({
        type: completionSignal,
      })
      .catch(() => {
        // No listeners, that's okay
      });
  } catch (error) {
    console.error('[crawler] Failed to store final items:', error);
  }
}
