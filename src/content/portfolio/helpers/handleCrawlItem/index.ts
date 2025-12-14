import { handleCrawlItemWithAnchor } from './handleCrawlItemWithAnchor';

import type { PortfolioItem } from '@/shared/types/portfolio';

export type HandleCrawlItemResult = {
  itemWithDetails: PortfolioItem;
  hasIssue: false | 'missing-link-anchor' | 'missing-modal';
  crawledFrom: undefined; // future use
};

/**
 * Handle a single crawl item
 * @param item - The portfolio item to process (immutable)
 * @returns Promise of crawl result with item details and issue status
 */
export async function handleCrawlItem(item: PortfolioItem): Promise<HandleCrawlItemResult> {
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

  // Delegate to handler for when anchor is present
  return handleCrawlItemWithAnchor(item, anchor);
}
