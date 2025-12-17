import { sendMessageToContentScript } from '@/shared/helpers/injectContentScript';
import { SIGNALS } from '@/shared/enums';
import type { ContentMessage, MonthDate } from '@/shared/types';

/**
 * Handle start crawl action
 * @param startCrawlSignal - Signal type for starting crawl
 * @param dateRange - Optional date range filter (from/to months)
 * @param onStart - Callback when crawl starts successfully
 * @param onError - Callback when error occurs
 */
export async function handleStartCrawl(
  startCrawlSignal:
    | SIGNALS.PORTFOLIO_START_CRAWL
    | SIGNALS.CLASS_ACTIVITY_START_CRAWL
    | SIGNALS.CHECK_IN_OUT_START_CRAWL,
  dateRange?: { from: MonthDate | null; to: MonthDate | null },
  onStart?: () => void,
  onError?: (error: string) => void,
): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    const errorMsg = 'No tab found';
    console.error('[popup]', errorMsg);
    onError?.(errorMsg);
    return;
  }

  const tabId = tab.id;
  const message: ContentMessage = {
    type: startCrawlSignal,
    dateRange,
  };
  console.info('[popup] Starting crawl, sending message to tab:', tabId, tab.url, dateRange);

  await sendMessageToContentScript(
    tabId,
    message,
    (response) => {
      console.info('[popup] Crawler response', response);
      onStart?.();
    },
    (error) => {
      console.error('[popup] Error starting crawl:', error);
      onError?.(error);
    },
  );
}
