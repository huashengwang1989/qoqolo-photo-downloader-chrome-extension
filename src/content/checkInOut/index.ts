import { startCrawlForCheckInOut } from './helpers/startCrawlForCheckInOut';

import { SIGNALS } from '@/shared/enums';
import { getPageType } from '@/shared/helpers/page';
import type { ContentMessage, ContentResponse } from '@/shared/types';

// Track crawling state
const isCrawling = { value: false };
const shouldStop = { value: false };

/**
 * Handle check-in/out-specific messages
 */
export function handleCheckInOutMessage(
  message: ContentMessage,
  sendResponse: (response?: ContentResponse) => void,
) {
  if (message.type === SIGNALS.CHECK_IN_OUT_START_CRAWL) {
    if (isCrawling.value) {
      console.warn('[content] Crawl already in progress');
      sendResponse({ ok: false });
      return true;
    }

    const pageType = getPageType(location.href);
    if (!pageType || pageType !== 'qoqoloCheckInOutPage') {
      console.warn('[content] Not on expected page');
      sendResponse({ ok: false });
      return true;
    }

    console.info('[content] handleCheckInOutMessage - Starting crawl', message.dateRange);
    startCrawlForCheckInOut(message.dateRange, isCrawling, shouldStop).catch(console.error);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === SIGNALS.CHECK_IN_OUT_STOP_CRAWL) {
    console.info('[content] Stop crawl requested');
    shouldStop.value = true;
    sendResponse({ ok: true });
    return true;
  }

  return false;
}
