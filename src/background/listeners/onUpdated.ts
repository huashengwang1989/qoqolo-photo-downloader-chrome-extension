import { updateActiveTabInfo } from '../helpers/updateTabInfo';

export function setupOnUpdatedListener() {
  // Listen for tab updates (when URL changes)
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Check if URL changed
    if (changeInfo.url) {
      console.info('[background] Tab URL changed:', tabId, changeInfo.url);
      // Check if this is the active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id === tabId) {
        await updateActiveTabInfo(tabId);
      }
    }
    // Also check when page finishes loading (in case URL didn't change but page reloaded)
    else if (changeInfo.status === 'complete' && tab?.url) {
      console.info('[background] Tab finished loading:', tabId);
      // Check if this is the active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id === tabId) {
        await updateActiveTabInfo(tabId);
      }
    }
  });
}
