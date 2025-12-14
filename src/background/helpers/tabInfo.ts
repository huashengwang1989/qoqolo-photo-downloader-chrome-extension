import { getPageType } from '@/shared/helpers/page';
import type { TabInfo } from '@/shared/types/message';

// Get tab info (support status and page type)
export async function getTabInfo(tabId: number): Promise<TabInfo> {
  try {
    const tab = await chrome.tabs.get(tabId);
    console.info('[background] Getting tab info for tab:', tabId, tab);
    if (!tab?.url) {
      console.info('[background] Tab has no URL:', tabId);
      return {
        isSupported: false,
        pageType: null,
        url: null,
      };
    }

    const pageType = getPageType(tab.url);

    // Parse URL parts
    let urlParts: TabInfo['url'] = null;

    // Check if URL is a valid HTTP/HTTPS URL (not Chrome internal pages)
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      try {
        const url = new URL(tab.url);
        // Extract domain (hostname without subdomain)
        const hostnameParts = url.hostname.split('.');
        const domain = hostnameParts.length >= 2 ? hostnameParts.slice(-2).join('.') : url.hostname;

        urlParts = {
          fullUrl: tab.url,
          protocol: url.protocol,
          hostname: url.hostname,
          domain,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          origin: url.origin,
        };
      } catch (urlError) {
        // Invalid URL format
        console.warn('[background] Failed to parse URL:', tab.url, urlError);
      }
    } else {
      // Chrome internal pages (chrome://, chrome-extension://, about:, etc.)
      console.info('[background] Chrome internal URL, skipping parsing:', tab.url);
    }

    return {
      isSupported: Boolean(pageType),
      pageType,
      url: urlParts,
    };
  } catch (error) {
    console.error('[background] Error getting tab info:', error);
    return {
      isSupported: false,
      pageType: null,
      url: null,
    };
  }
}
