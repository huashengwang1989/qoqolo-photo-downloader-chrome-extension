export function setupOnActionClickedListener() {
  // Handle action button click to toggle between popup and side panel
  // Note: This only fires when popup is disabled (side panel mode)
  chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) {
      return;
    }

    // Open side panel immediately to preserve user gesture context
    // We don't need to check preference here because this listener only fires
    // when popup is disabled, which only happens when useSidePanel is true
    chrome.sidePanel.open({ tabId: tab.id }).catch((error) => {
      console.error('[background] Failed to open side panel:', error);
    });
  });
}
