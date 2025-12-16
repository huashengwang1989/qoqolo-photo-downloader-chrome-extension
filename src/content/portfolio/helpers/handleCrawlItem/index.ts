import { handleCrawlItemWithAnchorForPortfolio } from './handleCrawlItemWithAnchor';

import { checkIsDateInRange } from '@/shared/utils/date';
import { scrollToElement } from '@/shared/helpers/scroll';
import { sleep } from '@/shared/helpers/utils';
import type { MonthDate } from '@/shared/types';
import type { PortfolioItem } from '@/shared/types/portfolio';

export type HandleCrawlItemResult = {
  itemWithDetails: PortfolioItem;
  hasIssue:
    | false
    | 'missing-link-anchor'
    | 'missing-modal'
    | 'out-of-date-range'
    | 'likely-login-session-expired';
  crawledFrom: undefined; // future use
};

/**
 * Extract itemCode from the foliette-item wrapper
 * @param anchor - The anchor element inside the foliette-item wrapper
 * @returns itemCode, or null if wrapper not found
 */
function extractItemCodeFromWrapper(anchor: HTMLAnchorElement): string | null {
  // Find the parent foliette-item wrapper
  const wrapper = anchor.closest<HTMLDivElement>('.foliette-item');
  if (!wrapper) {
    return null;
  }

  // Extract itemCode from id (format: "folietteItem_{itemCode}")
  const id = wrapper.id;
  const itemCodeMatch = id.match(/^folietteItem_(.+)$/);
  return itemCodeMatch ? itemCodeMatch[1] : null;
}

/**
 * Handle a single crawl item for Portfolio
 * @param item - The portfolio item to process (immutable)
 * @param dateRange - Optional date range filter
 * @returns Promise of crawl result with item details and issue status
 */
export async function handleCrawlItemForPortfolio(
  item: PortfolioItem,
  dateRange?: { from: MonthDate | null; to: MonthDate | null },
): Promise<HandleCrawlItemResult> {
  console.info('[crawler] Visiting', item.link);

  const anchor = document.querySelector<HTMLAnchorElement>(
    `a[data-href="${item.link.replace(location.origin, '')}"]`,
  );

  if (!anchor) {
    console.warn('[crawler] Anchor not found', item.link);
    return {
      itemWithDetails: item,
      hasIssue: 'missing-link-anchor',
      crawledFrom: undefined,
    };
  }

  // Scroll to the anchor to ensure it's loaded (lazy loading support)
  scrollToElement(anchor, 100); // 100px offset to account for any fixed headers
  await sleep(500); // Wait for scroll and potential lazy loading

  // Extract itemCode from wrapper BEFORE clicking
  const itemCode = extractItemCodeFromWrapper(anchor);
  const itemWithItemCode: PortfolioItem = {
    ...item,
    itemCode: itemCode || item.itemCode,
  };

  // Check date range BEFORE clicking the link (publishDate is now at Item level)
  if (item.publishDate && !checkIsDateInRange(item.publishDate, dateRange)) {
    console.info('[crawler] Item out of date range, skipping', item.link, item.publishDate);
    return {
      itemWithDetails: itemWithItemCode,
      hasIssue: 'out-of-date-range',
      crawledFrom: undefined,
    };
  }

  // Delegate to handler for when anchor is present
  return handleCrawlItemWithAnchorForPortfolio(itemWithItemCode, anchor);
}
