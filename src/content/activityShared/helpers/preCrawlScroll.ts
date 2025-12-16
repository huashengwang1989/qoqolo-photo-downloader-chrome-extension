import type { Item } from '@/shared/types/item';
import type { MonthDate } from '@/shared/types';
import { scrollToEnd } from '@/shared/helpers/scroll';
import { sleep } from '@/shared/helpers/utils';
import {
  checkIsDateInRange,
  hasItemsInRange,
  areAllItemsBeforeFrom,
  areAllItemsAfterTo,
} from '@/shared/utils/date';

/**
 * Pre-crawl scroll logic for date range filtering
 * Items are sorted chronologically from latest to earliest
 * @param allItems - Current items collection
 * @param dateRange - Date range to filter by
 * @param shouldStop - Stop flag reference
 * @param collectItems - Function to collect items from the page
 * @returns Updated items collection after scrolling, or null if no items in range
 */
export async function preCrawlScroll(
  allItems: Item[],
  dateRange: { from: MonthDate | null; to: MonthDate | null },
  shouldStop: { value: boolean },
  collectItems: (options?: { maxCount?: number }) => Item[],
): Promise<Item[] | null> {
  // Check if all initial items are before "From" date - if so, stop immediately
  // (items will only get older as we scroll, so no point continuing)
  if (areAllItemsBeforeFrom(allItems, dateRange)) {
    console.info('[crawler] All initial items are before "From" date, no items to crawl');
    return null;
  }

  // If all items are after "To" date, scroll to load older items
  if (areAllItemsAfterTo(allItems, dateRange)) {
    console.info('[crawler] All initial items are after "To" date, scrolling to load older items');
    const seenLinks = new Set<string>(allItems.map((item) => item.link));

    // Keep scrolling and checking until items within range are found or stopping condition met
    while (!shouldStop.value) {
      scrollToEnd();
      await sleep(1500); // Wait for lazy loading

      // Don't limit by maxCount during pre-crawl scroll - we need to see all items to detect newly loaded ones
      const newItems = collectItems();
      const trulyNewItems = newItems.filter((item) => !seenLinks.has(item.link));

      if (trulyNewItems.length === 0) {
        // No new items loaded, we're done
        console.info('[crawler] No more items loaded, stopping pre-crawl scroll');
        break;
      }

      // If all newly loaded items are before "From" date, stop (items will only get older)
      if (areAllItemsBeforeFrom(trulyNewItems, dateRange)) {
        console.info('[crawler] All newly loaded items are before "From" date, stopping scroll');
        break;
      }

      // Check if any of the new items are within range
      if (hasItemsInRange(trulyNewItems, dateRange)) {
        console.info('[crawler] Found items within date range after scrolling');
        // Find the first item in range and return only items from that index onwards
        const firstInRangeIndex = newItems.findIndex(
          (item) => item.publishDate && checkIsDateInRange(item.publishDate, dateRange),
        );
        if (firstInRangeIndex >= 0) {
          return newItems.slice(firstInRangeIndex);
        }
        return newItems; // Fallback: return all items if index not found
      }

      // All new items are still after "To" date, continue scrolling
      console.info(
        `[crawler] Still no items within range (${trulyNewItems.length} new items loaded)`,
      );
      trulyNewItems.forEach((item) => seenLinks.add(item.link));
      allItems = newItems; // Update items list to include newly loaded ones
    }

    // Final check: if still no items in range after scrolling, return null
    if (!hasItemsInRange(allItems, dateRange)) {
      console.info('[crawler] No items within date range found after scrolling');
      return null;
    }

    // Find the first item in range and return only items from that index onwards
    const firstInRangeIndex = allItems.findIndex(
      (item) => item.publishDate && checkIsDateInRange(item.publishDate, dateRange),
    );
    if (firstInRangeIndex >= 0) {
      return allItems.slice(firstInRangeIndex);
    }
  }

  // If initial items already contain items in range, find the first one and return from there
  if (hasItemsInRange(allItems, dateRange)) {
    const firstInRangeIndex = allItems.findIndex(
      (item) => item.publishDate && checkIsDateInRange(item.publishDate, dateRange),
    );
    if (firstInRangeIndex >= 0) {
      return allItems.slice(firstInRangeIndex);
    }
  }

  return allItems;
}
