import { handlePortfolioMessage } from './portfolio';
import { extractLogo } from './helpers/extractLogo';

import { SIGNALS } from '@/shared/enums';
import type { ContentMessage, ContentResponse } from '@/shared/types';

// Top-level log to verify script is injected
console.info('[content] Content script loaded', location.href, new Date().toISOString());

// Also log to window for easier debugging
if (typeof window !== 'undefined') {
  (window as unknown as { __contentScriptLoaded?: boolean }).__contentScriptLoaded = true;
}

chrome.runtime.onMessage.addListener(
  (message: ContentMessage, _sender, sendResponse: (response?: ContentResponse) => void) => {
    console.info('[content] onMessage', message);
    // Route portfolio messages
    if (handlePortfolioMessage(message, sendResponse)) {
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
