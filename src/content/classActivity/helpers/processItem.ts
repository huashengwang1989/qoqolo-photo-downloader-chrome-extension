import { extractItemDetailsForClassActivity } from './extractItemDetails';

import { scrollToElement } from '@/shared/helpers/scroll';
import { sleep } from '@/shared/helpers/utils';
import { checkIsDateInRange } from '@/shared/utils/date';
import type { MonthDate } from '@/shared/types';
import type { Item } from '@/shared/types/item';

/**
 * Process a single item for Class Activity by extracting its details
 * @param item - The item to process
 * @param dateRange - Optional date range filter
 * @param shouldStop - Stop flag reference
 * @returns Processed item with details, or null if skipped/stopped
 */
export async function processItemForClassActivity(
  item: Item,
  dateRange: { from: MonthDate | null; to: MonthDate | null } | undefined,
  shouldStop: { value: boolean },
): Promise<Item | null> {
  if (shouldStop.value) {
    return null;
  }

  // Extract details directly from the panel (no modal needed for Class Activity)
  const panel = document.querySelector<HTMLDivElement>(
    `div.infinite-item.post[data-rid="${item.rid}"]`,
  );

  if (!panel) {
    console.warn('[crawler] Panel not found for item', item.rid);
    return null;
  }

  // Scroll to the panel to ensure it's loaded (lazy loading support)
  scrollToElement(panel, 100); // 100px offset to account for any fixed headers
  await sleep(500); // Wait for scroll and potential lazy loading

  const details = extractItemDetailsForClassActivity(panel);

  // Check date range filter (publishDate is now at Item level)
  if (dateRange && item.publishDate) {
    const isInRange = checkIsDateInRange(item.publishDate, dateRange);
    if (!isInRange) {
      console.info('[crawler] Skipping item out of date range', item.link, item.publishDate);
      return null;
    }
  }

  const itemWithDetails: Item = {
    ...item,
    details,
  };

  return itemWithDetails;
}
