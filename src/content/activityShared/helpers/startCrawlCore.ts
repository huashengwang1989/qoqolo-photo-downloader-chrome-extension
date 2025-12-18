import type { Item } from '@/shared/types/item';
import type { MonthDate } from '@/shared/types';
import { sleep } from '@/shared/helpers/utils';
import { SIGNALS } from '@/shared/enums';
import { hasMoreContent } from './hasMoreContent';

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
    getWrapper?: () => HTMLElement | null,
  ) => Promise<TItem[] | null>;
  processItem: (
    item: TItem,
    dateRange: { from: MonthDate | null; to: MonthDate | null } | undefined,
    shouldStop: { value: boolean },
  ) => Promise<ProcessItemResult<TItem>>;
  getWrapper?: () => HTMLElement | null;
  maxCrawlCount: number;
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
    getWrapper,
    maxCrawlCount,
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
  let allItems = collectItems({ maxCount: maxCrawlCount });
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
    const scrollResult = await preCrawlScroll(allItems, dateRange, shouldStop, getWrapper);
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
      const newItems = collectItems({ maxCount: maxCrawlCount });
      // Filter out already processed items
      let trulyNewItems = newItems.filter((item) => !processedLinks.has(item.link));

      if (trulyNewItems.length === 0) {
        // No new items found, check if there's more content to load
        const wrapper = getWrapper ? getWrapper() : null;
        const moreContent = hasMoreContent(wrapper);

        if (!moreContent) {
          // No more content to load, we're done
          console.info('[crawler] No more new items found and no more content available, crawl complete');
          break;
        }

        // There's more content, retry up to 2 more times
        let retryCount = 0;
        const maxRetries = 2;
        let foundNewItems = false;

        while (retryCount < maxRetries && !foundNewItems && !shouldStop.value) {
          console.info(`[crawler] No new items found but more content available, retrying (${retryCount + 1}/${maxRetries})...`);
          await sleep(1000); // Wait 1 second before retry

          const retryItems = collectItems({ maxCount: maxCrawlCount });
          const retryNewItems = retryItems.filter((item) => !processedLinks.has(item.link));

          if (retryNewItems.length > 0) {
            foundNewItems = true;
            // Update newItems and trulyNewItems with retry results
            newItems.length = 0;
            newItems.push(...retryItems);
            trulyNewItems = retryNewItems;
            break;
          }

          retryCount += 1;
        }

        if (!foundNewItems) {
          // Still no new items after retries, we're done
          console.info('[crawler] No new items found after retries, crawl complete');
          break;
        }
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
    if (!shouldStop.value && processedItems.length < maxCrawlCount) {
      const newItems = collectItems({ maxCount: maxCrawlCount });
      let trulyNewItems = newItems.filter((item) => !processedLinks.has(item.link));

      if (trulyNewItems.length > 0) {
        console.info(`[crawler] Found ${trulyNewItems.length} new items, continuing crawl`);
        allItems = newItems;
      } else {
        // No new items found, check if there's more content to load
        const wrapper = getWrapper ? getWrapper() : null;
        const moreContent = hasMoreContent(wrapper);

        if (!moreContent) {
          // No more content to load, we're done
          console.info('[crawler] No more new items and no more content available, crawl complete');
          break;
        }

        // There's more content, retry up to 2 more times
        let retryCount = 0;
        const maxRetries = 2;
        let foundNewItems = false;

        while (retryCount < maxRetries && !foundNewItems && !shouldStop.value) {
          console.info(`[crawler] No new items found but more content available, retrying (${retryCount + 1}/${maxRetries})...`);
          await sleep(1000); // Wait 1 second before retry

          const retryItems = collectItems({ maxCount: maxCrawlCount });
          const retryNewItems = retryItems.filter((item) => !processedLinks.has(item.link));

          if (retryNewItems.length > 0) {
            foundNewItems = true;
            console.info(`[crawler] Found ${retryNewItems.length} new items after retry, continuing crawl`);
            allItems = retryItems;
            break;
          }

          retryCount += 1;
        }

        if (!foundNewItems) {
          // Still no new items after retries, we're done
          console.info('[crawler] No new items found after retries, crawl complete');
          break;
        }
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
