import { updateActiveTabInfo } from '../helpers/updateTabInfo';

export function setupOnActivatedListener() {
  // Listen for tab activation (when user switches tabs)
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await updateActiveTabInfo(activeInfo.tabId);
  });
}
