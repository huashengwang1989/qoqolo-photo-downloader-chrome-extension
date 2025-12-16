import type { ContentMessage, ContentResponse } from '@/shared/types';

/**
 * Send message to content script, injecting it if necessary
 * @param tabId - The tab ID to send message to
 * @param message - The message to send
 * @param onSuccess - Callback when message is sent successfully
 * @param onError - Callback when message fails
 */
export async function sendMessageToContentScript(
  tabId: number,
  message: ContentMessage,
  onSuccess?: (response: ContentResponse | undefined) => void,
  onError?: (error: string) => void,
): Promise<void> {
  // First, try to send message (content script might already be loaded)
  chrome.tabs.sendMessage(tabId, message, async (response: ContentResponse | undefined) => {
    if (chrome.runtime.lastError) {
      // Content script not loaded, try to inject it programmatically
      console.warn(
        '[popup] Content script not loaded, attempting to inject:',
        chrome.runtime.lastError.message,
      );

      try {
        // Inject the content script programmatically
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js'],
        });
        console.info('[popup] Content script injected successfully');

        // Wait a bit for the script to initialize
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Try sending the message again
        chrome.tabs.sendMessage(tabId, message, (retryResponse: ContentResponse | undefined) => {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message || 'Unknown error';
            console.error('[popup] Error sending message after injection:', errorMsg);
            console.error('[popup] Please reload the page and try again');
            onError?.(errorMsg);
            return;
          }
          console.info('[popup] Crawler response', retryResponse);
          onSuccess?.(retryResponse);
        });
      } catch (injectError) {
        const errorMsg = injectError instanceof Error ? injectError.message : 'Unknown error';
        console.error('[popup] Failed to inject content script:', injectError);
        console.error('[popup] Please reload the page and try again');
        onError?.(errorMsg);
      }
      return;
    }

    // Success - content script was already loaded
    console.info('[popup] Message sent successfully', response);
    onSuccess?.(response);
  });
}
