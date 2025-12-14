import type { TabInfo } from '@/shared/types/message';

// Track current active tab's info
export const TAB_STATE = {
  currentActiveTabId: null as number | null,
  currentTabInfo: null as TabInfo | null,
};

export function setCurrentTabInfo(tabId: number, tabInfo: TabInfo) {
  TAB_STATE.currentActiveTabId = tabId;
  TAB_STATE.currentTabInfo = tabInfo;
}
