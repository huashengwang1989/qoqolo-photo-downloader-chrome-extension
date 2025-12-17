import { handlePortfolioMessage } from './portfolio';
import { handleClassActivityMessage } from './classActivity';
import { handleCheckInOutMessage } from './checkInOut';
import { extractLogo } from './helpers/extractLogo';

import { SIGNALS } from '@/shared/enums';
import type { ContentMessage, ContentResponse } from '@/shared/types';

/**
 * Prevent duplicate listener registration if script is loaded multiple times.
 *
 * Why this is needed:
 * - Content script can be injected multiple times: once from manifest.json automatic injection,
 *   and again programmatically via chrome.scripting.executeScript() in injectContentScript.ts
 *   (which happens when sendMessage fails, indicating script wasn't loaded).
 * - Each time the script runs, chrome.runtime.onMessage.addListener() would register a new listener.
 * - Without this guard, messages would be handled by all registered listeners, causing duplicate
 *   processing (e.g., PORTFOLIO_START_CRAWL would trigger crawl twice).
 *
 * What happens without this:
 * - Messages are received and processed multiple times (once per listener)
 * - Crawl operations start multiple times for a single request
 * - State management becomes inconsistent due to duplicate operations
 */
if (typeof window !== 'undefined') {
  const windowWithFlag = window as unknown as {
    __contentScriptListenerRegistered?: boolean;
  };

  // Only register listener once, even if script runs multiple times
  if (windowWithFlag.__contentScriptListenerRegistered) {
    console.warn('[content] Message listener already registered, skipping duplicate registration');
  } else {
    windowWithFlag.__contentScriptListenerRegistered = true;

    // Top-level log to verify script is injected
    console.info('[content] Content script loaded', location.href, new Date().toISOString());

    chrome.runtime.onMessage.addListener(
      (message: ContentMessage, _sender, sendResponse: (response?: ContentResponse) => void) => {
        console.info('[content] onMessage', message);
        // Route portfolio messages
        if (handlePortfolioMessage(message, sendResponse)) {
          return true;
        }

        // Route class activity messages
        if (handleClassActivityMessage(message, sendResponse)) {
          return true;
        }

        // Route check-in/out messages
        if (handleCheckInOutMessage(message, sendResponse)) {
          return true;
        }

        // Handle common messages
        if (message.type === SIGNALS.PING) {
          sendResponse({ ok: true });
          return true;
        }

        // Handle logo extraction
        if (message.type === SIGNALS.GET_LOGO) {
          const logoUrl = extractLogo();
          sendResponse({ logoUrl });
          return true;
        }
      },
    );
  }
} else {
  // Fallback if window is not available (shouldn't happen in content script context)
  console.error('[content] Window object not available, cannot register message listener');
}
