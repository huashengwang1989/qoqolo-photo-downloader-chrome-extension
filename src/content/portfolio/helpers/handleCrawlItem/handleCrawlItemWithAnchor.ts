import { processModalContent } from './processModalContent';

import type { HandleCrawlItemResult } from './index';

import { sleep } from '@/shared/helpers/utils';
import type { PortfolioItem } from '@/shared/types/portfolio';

/**
 * Handle a crawl item when anchor is present
 * @param item - The portfolio item to process (immutable)
 * @param anchor - The HTML anchor element that was found
 * @returns Promise of crawl result with item details and issue status
 */
export async function handleCrawlItemWithAnchor(
  item: PortfolioItem,
  anchor: HTMLAnchorElement,
): Promise<HandleCrawlItemResult> {
  anchor.click();

  await sleep(1000);

  const modal = document.querySelector('.view-foliette-modal') as HTMLDivElement | null;

  if (!modal) {
    console.warn('[crawler] Modal not found', item.link);
    return {
      itemWithDetails: {
        ...item,
        details: undefined,
      },
      hasIssue: 'missing-modal',
      crawledFrom: undefined,
    };
  }

  // Wait one more second after modal appears
  await sleep(1000);

  // Look for close button with data-bb-handler="cancel"
  const closeButton = document.querySelector<HTMLButtonElement>('button[data-bb-handler="cancel"]');

  // Process modal content to extract details
  const details = processModalContent(modal);

  if (closeButton) {
    closeButton.click();
    // Wait 500ms after clicking close button
    await sleep(500);
  }

  // Stage 1: return item with details
  return {
    itemWithDetails: {
      ...item,
      details,
    },
    hasIssue: false,
    crawledFrom: undefined,
  };
}
