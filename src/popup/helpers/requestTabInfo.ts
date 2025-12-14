import { SIGNALS } from '@/shared/enums';
import type { BackgroundResponse, TabInfo } from '@/shared/types';

export type TabInfoUpdateCallback = (tabInfo: TabInfo) => void;

/**
 * Request current tab info from background script
 */
export function requestTabInfo(callback: TabInfoUpdateCallback) {
  chrome.runtime.sendMessage(
    { type: SIGNALS.TAB_GET_INFO },
    (response: BackgroundResponse | undefined) => {
      if (response && 'tabInfo' in response) {
        callback(response.tabInfo);
      }
    },
  );
}
