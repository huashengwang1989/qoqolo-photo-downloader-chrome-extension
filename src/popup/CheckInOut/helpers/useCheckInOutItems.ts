import { useEffect, useState } from 'react';

import { SIGNALS } from '@/shared/enums';
import type { BackgroundMessage } from '@/shared/types';
import type { CheckInOutMonthItem } from '@/shared/types/checkInOut';

const STORAGE_KEY = 'checkInOutCrawlItems';

/**
 * Custom hook to manage check-in/out month items state and listeners
 */
export function useCheckInOutItems() {
  const [items, setItems] = useState<CheckInOutMonthItem[]>([]);

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
      if (message.type === SIGNALS.CHECK_IN_OUT_ITEMS_UPDATED && 'items' in message) {
        setItems(message.items as CheckInOutMonthItem[]);
      } else if (message.type === SIGNALS.CHECK_IN_OUT_ITEM_ADDED && 'item' in message) {
        // Add new item to the list for real-time display
        setItems((prevItems) => {
          // Check if item already exists (by yearMonth)
          const exists = prevItems.some(
            (item) => item.yearMonth === (message.item as CheckInOutMonthItem).yearMonth,
          );
          if (exists) {
            // Update existing item
            return prevItems.map((item) =>
              item.yearMonth === (message.item as CheckInOutMonthItem).yearMonth
                ? (message.item as CheckInOutMonthItem)
                : item,
            );
          }
          // Add new item
          return [...prevItems, message.item as CheckInOutMonthItem];
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
