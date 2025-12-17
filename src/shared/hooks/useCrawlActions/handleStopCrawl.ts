import { sendMessageToContentScript } from '@/shared/helpers/injectContentScript';
import { SIGNALS } from '@/shared/enums';
import type { ContentMessage } from '@/shared/types';

/**
 * Handle stop crawl action
 * @param stopCrawlSignal - Signal type for stopping crawl
 * @param onError - Callback when error occurs
 */
export async function handleStopCrawl(
  stopCrawlSignal:
    | SIGNALS.PORTFOLIO_STOP_CRAWL
    | SIGNALS.CLASS_ACTIVITY_STOP_CRAWL
    | SIGNALS.CHECK_IN_OUT_STOP_CRAWL,
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
  const message: ContentMessage = { type: stopCrawlSignal };
  console.info('[popup] Stopping crawl, sending message to tab:', tabId, tab.url);

  await sendMessageToContentScript(
    tabId,
    message,
    (response) => {
      console.info('[popup] Stop crawl response', response);
    },
    (error) => {
      console.error('[popup] Error sending stop message:', error);
      onError?.(error);
    },
  );
}
