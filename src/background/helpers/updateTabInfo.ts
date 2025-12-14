import { setCurrentTabInfo } from '../state';

import { getTabInfo } from './tabInfo';

import { SIGNALS } from '@/shared/enums';

// Update active tab info and notify listeners
export async function updateActiveTabInfo(tabId: number) {
  console.info('[background] Updating tab info for tab:', tabId);
  const tabInfo = await getTabInfo(tabId);
  console.info('[background] Tab info updated:', tabInfo);
  setCurrentTabInfo(tabId, tabInfo);

  // Notify any open popup/side panel about the change
  try {
    chrome.runtime.sendMessage({
      type: SIGNALS.TAB_UPDATED,
      tabId,
      tabInfo,
    });
  } catch (error) {
    // No listeners, that's okay
  }
}
