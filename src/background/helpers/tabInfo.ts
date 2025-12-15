import { getPageType } from '@/shared/helpers/page';
import { SIGNALS } from '@/shared/enums';
import type { TabInfo } from '@/shared/types/message';

const STORAGE_KEY_LOGO_URL = 'qoqoloLogoUrl';

/**
 * Extract logo from content script
 * Injects content script if needed
 */
async function extractLogoFromContentScript(tabId: number): Promise<string | null> {
  try {
    // Try to send message first (content script might already be loaded)
    const response = await chrome.tabs.sendMessage(tabId, { type: SIGNALS.GET_LOGO });
    if (response && 'logoUrl' in response) {
      return response.logoUrl as string | null;
    }
  } catch (error) {
    // Content script might not be loaded, try to inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      // Wait a bit for the script to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Try again
      const response = await chrome.tabs.sendMessage(tabId, { type: SIGNALS.GET_LOGO });
      if (response && 'logoUrl' in response) {
        return response.logoUrl as string | null;
      }
    } catch (injectError) {
      // Failed to inject or extract logo
      console.info('[background] Failed to extract logo from content script:', injectError);
    }
  }
  return null;
}

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
        isQoqoloSite: false,
        logoUrl: null,
        url: null,
      };
    }

    const pageType = getPageType(tab.url);

    // Check if it's a Qoqolo site
    const isQoqoloSite = /^https:\/\/.+\.qoqolo\.com/.test(tab.url);

    // Load stored logo URL first (for immediate display)
    const stored = await chrome.storage.local.get([STORAGE_KEY_LOGO_URL]);
    let logoUrl: string | null = stored[STORAGE_KEY_LOGO_URL] || null;

    // Extract logo if it's a Qoqolo site (will update if different)
    if (isQoqoloSite) {
      const extractedLogoUrl = await extractLogoFromContentScript(tabId);
      // Update logo URL if extracted and different from stored
      if (extractedLogoUrl && extractedLogoUrl !== logoUrl) {
        logoUrl = extractedLogoUrl;
        chrome.storage.local.set({ [STORAGE_KEY_LOGO_URL]: logoUrl });
      }
    }

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
      isQoqoloSite,
      logoUrl,
      url: urlParts,
    };
  } catch (error) {
    console.error('[background] Error getting tab info:', error);
    // Load stored logo URL on error
    let logoUrl: string | null = null;
    try {
      const stored = await chrome.storage.local.get([STORAGE_KEY_LOGO_URL]);
      logoUrl = stored[STORAGE_KEY_LOGO_URL] || null;
    } catch (storageError) {
      console.warn('[background] Failed to load stored logo URL:', storageError);
    }

    return {
      isSupported: false,
      pageType: null,
      isQoqoloSite: false,
      logoUrl,
      url: null,
    };
  }
}
