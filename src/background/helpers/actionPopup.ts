import { POPUP_PATH, STORAGE_KEY } from '../constants';

// Initialize popup state based on preference
export async function updateActionPopup() {
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  const useSidePanel = result[STORAGE_KEY] || false;

  if (useSidePanel) {
    // Disable popup when side panel mode is active
    await chrome.action.setPopup({ popup: '' });
  } else {
    // Enable popup when popup mode is active
    await chrome.action.setPopup({ popup: POPUP_PATH });
  }
}
