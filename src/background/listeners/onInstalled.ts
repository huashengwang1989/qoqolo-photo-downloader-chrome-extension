import { STORAGE_KEY } from '../constants';
import { updateActionPopup } from '../helpers/actionPopup';
import { updateActiveTabInfo } from '../helpers/updateTabInfo';

export function setupOnInstalledListener() {
  chrome.runtime.onInstalled.addListener(async () => {
    console.info('[background] Extension installed');
    // Initialize default preference
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    if (result[STORAGE_KEY] === undefined) {
      await chrome.storage.local.set({ [STORAGE_KEY]: false });
    }
    await updateActionPopup();

    // Initialize active tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await updateActiveTabInfo(tab.id);
    }
  });
}
