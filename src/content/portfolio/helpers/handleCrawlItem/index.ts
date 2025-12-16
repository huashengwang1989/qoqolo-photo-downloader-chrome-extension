import { handleCrawlItemWithAnchor } from './handleCrawlItemWithAnchor';

import { formatDateToYYYYMMDD, checkIsDateInRange } from '@/shared/utils/date';
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
 * Extract itemCode and publishDate from the foliette-item wrapper
 * @param anchor - The anchor element inside the foliette-item wrapper
 * @returns Object with itemCode and publishDate (YYYY-MM-DD format), or null if wrapper not found
 */
function extractFromWrapper(anchor: HTMLAnchorElement): {
  itemCode: string;
  publishDate: string;
} | null {
  // Find the parent foliette-item wrapper
  const wrapper = anchor.closest<HTMLDivElement>('.foliette-item');
  if (!wrapper) {
    return null;
  }

  // Extract itemCode from id (format: "folietteItem_{itemCode}")
  const id = wrapper.id;
  const itemCodeMatch = id.match(/^folietteItem_(.+)$/);
  const itemCode = itemCodeMatch ? itemCodeMatch[1] : '';

  // Extract publishDate from <p class="text-muted"> containing "created this on <span>{date}</span>"
  const textMutedParagraph = wrapper.querySelector<HTMLParagraphElement>('p.text-muted');
  let publishDate = '';

  if (textMutedParagraph) {
    // Look for span containing the date (usually after "created this on")
    const spans = Array.from(textMutedParagraph.querySelectorAll<HTMLSpanElement>('span'));
    for (const span of spans) {
      const text = (span.textContent || '').trim();
      // Try to parse as date (format: "dd mmm yyyy")
      const parsedDate = formatDateToYYYYMMDD(text);
      if (parsedDate) {
        publishDate = parsedDate;
        break;
      }
    }
  }

  return { itemCode, publishDate };
}

/**
 * Handle a single crawl item
 * @param item - The portfolio item to process (immutable)
 * @param dateRange - Optional date range filter
 * @returns Promise of crawl result with item details and issue status
 */
export async function handleCrawlItem(
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

  // Extract itemCode and publishDate from wrapper BEFORE clicking
  const wrapperData = extractFromWrapper(anchor);
  let itemWithWrapperData: PortfolioItem = { ...item };

  if (wrapperData) {
    itemWithWrapperData = {
      ...item,
      itemCode: wrapperData.itemCode,
      details: {
        images: [],
        content: '',
        teacher: '',
        publishDate: wrapperData.publishDate, // Set publishDate from wrapper first
        learningArea: [],
        stickers: [],
      },
    };

    // Check date range BEFORE clicking the link
    if (wrapperData.publishDate && !checkIsDateInRange(wrapperData.publishDate, dateRange)) {
      console.info(
        '[crawler] Item out of date range, skipping',
        item.link,
        wrapperData.publishDate,
      );
      return {
        itemWithDetails: itemWithWrapperData,
        hasIssue: 'out-of-date-range',
        crawledFrom: undefined,
      };
    }
  }

  // Delegate to handler for when anchor is present
  return handleCrawlItemWithAnchor(itemWithWrapperData, anchor);
}
