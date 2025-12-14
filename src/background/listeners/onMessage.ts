import { STORAGE_KEY } from '../constants';
import { updateActionPopup } from '../helpers/actionPopup';
import { getTabInfo } from '../helpers/tabInfo';
import { TAB_STATE } from '../state';

import { SIGNALS } from '@/shared/enums';
import type { BackgroundMessage } from '@/shared/types';
import type { PortfolioItem } from '@/shared/types/portfolio';

export function setupOnMessageListener() {
  chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
    console.info('[background] Message received', message, sender);

    if (message.type === SIGNALS.VIEW_TOGGLE_MODE) {
      chrome.storage.local.get([STORAGE_KEY], async (result) => {
        const newValue = !(result[STORAGE_KEY] || false);
        await chrome.storage.local.set({ [STORAGE_KEY]: newValue });

        // Update action popup state
        await updateActionPopup();

        // Note: sidePanel.open() must be called from user gesture context (popup/side panel)
        // So we don't open it here - it's handled in PanelWrapper component

        sendResponse({ useSidePanel: newValue });
      });
      return true; // Indicates we will send a response asynchronously
    }

    if (message.type === SIGNALS.VIEW_GET_MODE) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        sendResponse({ useSidePanel: result[STORAGE_KEY] || false });
      });
      return true;
    }

    if (message.type === SIGNALS.TAB_GET_INFO) {
      // Return current cached tab info, or check if not cached
      if (TAB_STATE.currentActiveTabId !== null && TAB_STATE.currentTabInfo !== null) {
        console.info('[background] Returning cached tab info', TAB_STATE.currentTabInfo);
        sendResponse({ tabInfo: TAB_STATE.currentTabInfo });
      } else {
        // Check current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
          if (tab?.id) {
            const tabInfo = await getTabInfo(tab.id);
            sendResponse({ tabInfo });
          } else {
            sendResponse({ tabInfo: { isSupported: false, pageType: null, url: null } });
          }
        });
        return true; // Async response
      }
      return true;
    }

    if (message.type === SIGNALS.PORTFOLIO_ITEMS_UPDATED) {
      // Forward the message to popup/side panel if open
      try {
        chrome.runtime.sendMessage(message);
      } catch (error) {
        // No listeners, that's okay
      }
      return false; // Not a response message
    }

    if (message.type === SIGNALS.PORTFOLIO_ITEMS_GET) {
      const PORTFOLIO_STORAGE_KEY = 'portfolioCrawlItems';
      chrome.storage.local.get([PORTFOLIO_STORAGE_KEY], (result) => {
        sendResponse({ items: (result[PORTFOLIO_STORAGE_KEY] as PortfolioItem[]) || [] });
      });
      return true;
    }
  });
}
