import { useEffect, useState } from 'react';

import { SIGNALS } from '@/shared/enums';
import type { BackgroundMessage } from '@/shared/types';
import type { Item } from '@/shared/types/item';

interface UseItemsOptions {
  storageKey: string;
  itemsUpdatedSignal: SIGNALS;
  itemAddedSignal: SIGNALS;
}

/**
 * Custom hook to manage activity items state and listeners
 * Generic version that works for both Portfolio and Class Activity
 */
export function useItems(options: UseItemsOptions) {
  const { storageKey, itemsUpdatedSignal, itemAddedSignal } = options;
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    // Initial load
    const loadItems = () => {
      chrome.storage.local.get([storageKey], (result) => {
        if (result[storageKey]) {
          setItems(result[storageKey]);
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
      if (message.type === itemsUpdatedSignal && 'items' in message) {
        setItems(message.items as Item[]);
      } else if (message.type === itemAddedSignal && 'item' in message) {
        // Add new item to the list for real-time display
        setItems((prevItems) => {
          // Check if item already exists (by link)
          const exists = prevItems.some((item) => item.link === (message.item as Item).link);
          if (exists) {
            // Update existing item
            return prevItems.map((item) =>
              item.link === (message.item as Item).link ? (message.item as Item) : item,
            );
          }
          // Add new item
          return [...prevItems, message.item as Item];
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Also listen to storage changes (in case updated from another source)
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[storageKey]) {
        setItems(changes[storageKey].newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [storageKey, itemsUpdatedSignal, itemAddedSignal]);

  return { items, setItems };
}
