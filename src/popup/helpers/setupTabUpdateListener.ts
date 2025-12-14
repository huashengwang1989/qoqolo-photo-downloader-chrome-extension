import { requestTabInfo } from './requestTabInfo';

import { SIGNALS } from '@/shared/enums';
import type { BackgroundMessage, TabInfo } from '@/shared/types';

export type TabInfoUpdateCallback = (tabInfo: TabInfo) => void;

/**
 * Setup listener for tab update messages from background
 */
export function setupTabUpdateListener(callback: TabInfoUpdateCallback) {
  const handleMessage = (
    message: BackgroundMessage,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: unknown) => void,
  ) => {
    if (message.type === SIGNALS.TAB_UPDATED) {
      console.info('Tab updated', message.tabInfo);
      callback(message.tabInfo);
    }
  };

  chrome.runtime.onMessage.addListener(handleMessage);

  return () => {
    chrome.runtime.onMessage.removeListener(handleMessage);
  };
}

/**
 * Setup listener for visibility changes (when popup reopens)
 */
export function setupVisibilityChangeListener(callback: () => void) {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      callback();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Setup all tab info synchronization listeners
 */
export function setupTabInfoSync(callback: TabInfoUpdateCallback) {
  // Setup message listener
  const cleanupMessage = setupTabUpdateListener(callback);

  // Setup visibility change listener
  const cleanupVisibility = setupVisibilityChangeListener(() => {
    requestTabInfo(callback);
  });

  // Return combined cleanup function
  return () => {
    cleanupMessage();
    cleanupVisibility();
  };
}
