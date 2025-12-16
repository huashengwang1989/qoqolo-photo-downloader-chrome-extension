import { processModalContent } from './processModalContent';
import { handleLikelyLoginSessionExpired } from './helpers/handleLikelyLoginSessionExpired';
import { getModalCloseButton } from './getModalCloseButton';

import type { HandleCrawlItemResult } from './index';

import { sleep } from '@/shared/helpers/utils';
import type { PortfolioItem } from '@/shared/types/portfolio';

/**
 * Handle a crawl item for Portfolio when anchor is present
 * @param item - The portfolio item to process (immutable)
 * @param anchor - The HTML anchor element that was found
 * @returns Promise of crawl result with item details and issue status
 */
export async function handleCrawlItemWithAnchorForPortfolio(
  item: PortfolioItem,
  anchor: HTMLAnchorElement,
): Promise<HandleCrawlItemResult> {
  // Close any existing modals first to prevent multiple modals stacking
  const existingModals = document.querySelectorAll<HTMLDivElement>('.view-foliette-modal');
  for (const existingModal of Array.from(existingModals)) {
    const existingCloseButton = getModalCloseButton(existingModal);
    if (existingCloseButton) {
      existingCloseButton.click();
      await sleep(200); // Small delay between closing modals
    }
  }
  // Wait a bit more to ensure modals are fully closed
  await sleep(300);

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

  // Look for close button
  const closeButton = getModalCloseButton(modal);

  // Detect likely login session expiry based on modal content
  const isLikelyLoginSessionExpired = handleLikelyLoginSessionExpired(modal, closeButton ?? null);

  if (isLikelyLoginSessionExpired) {
    return {
      itemWithDetails: item,
      hasIssue: 'likely-login-session-expired',
      crawledFrom: undefined,
    };
  }

  // Process modal content to extract details
  const details = processModalContent(modal);

  // Close ALL modals, not just one (in case multiple modals exist)
  const allModals = document.querySelectorAll<HTMLDivElement>('.view-foliette-modal');
  let closedAny = false;
  for (const modalToClose of Array.from(allModals)) {
    const modalCloseButton = getModalCloseButton(modalToClose);
    if (modalCloseButton) {
      modalCloseButton.click();
      closedAny = true;
      await sleep(200); // Small delay between closing modals
    }
  }

  if (!closedAny) {
    console.warn('[crawler] Close button not found for any modal', item.link);
  }

  // Wait 500ms after closing modals to ensure they're fully closed
  await sleep(500);

  // Stage 1: return item with details (publishDate is already at Item level)
  return {
    itemWithDetails: {
      ...item,
      details,
      itemCode: item.itemCode, // Preserve itemCode from wrapper
    },
    hasIssue: false,
    crawledFrom: undefined,
  };
}
