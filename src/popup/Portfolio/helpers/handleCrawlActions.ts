import { sendMessageToContentScript } from './injectContentScript';

import { SIGNALS } from '@/shared/enums';
import type { ContentMessage } from '@/shared/types';

/**
 * Handle stop crawl action
 * @param onError - Callback when error occurs
 */
export async function handleStopCrawl(onError?: (error: string) => void): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    const errorMsg = 'No tab found';
    console.error('[popup]', errorMsg);
    onError?.(errorMsg);
    return;
  }

  const tabId = tab.id;
  const message: ContentMessage = { type: SIGNALS.PORTFOLIO_STOP_CRAWL };
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

/**
 * Handle start crawl action
 * @param onStart - Callback when crawl starts successfully
 * @param onError - Callback when error occurs
 */
export async function handleStartCrawl(
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
  const message: ContentMessage = { type: SIGNALS.PORTFOLIO_START_CRAWL };
  console.info('[popup] Starting crawl, sending message to tab:', tabId, tab.url);

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
