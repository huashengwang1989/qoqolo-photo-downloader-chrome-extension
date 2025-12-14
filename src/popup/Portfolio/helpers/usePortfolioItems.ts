import { useEffect, useState } from 'react';

import { SIGNALS } from '@/shared/enums';
import type { BackgroundMessage } from '@/shared/types';
import type { PortfolioItem } from '@/shared/types/portfolio';

const STORAGE_KEY = 'portfolioCrawlItems';

/**
 * Custom hook to manage portfolio items state and listeners
 */
export function usePortfolioItems() {
  const [items, setItems] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    // Initial load
    const loadItems = () => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY]) {
          setItems(result[STORAGE_KEY]);
        }
      });
    };

    loadItems();

    // Listen for items updates
    const handleMessage = (
      message: BackgroundMessage,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) => {
      if (message.type === SIGNALS.PORTFOLIO_ITEMS_UPDATED) {
        setItems(message.items);
      } else if (message.type === SIGNALS.PORTFOLIO_ITEM_ADDED) {
        // Add new item to the list for real-time display
        setItems((prevItems) => {
          // Check if item already exists (by link)
          const exists = prevItems.some((item) => item.link === message.item.link);
          if (exists) {
            // Update existing item
            return prevItems.map((item) => (item.link === message.item.link ? message.item : item));
          }
          // Add new item
          return [...prevItems, message.item];
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Also listen to storage changes (in case updated from another source)
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[STORAGE_KEY]) {
        setItems(changes[STORAGE_KEY].newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return { items, setItems };
}
