import type { MonthDate } from '@/shared/types';

/**
 * Save dateFrom to storage
 */
export function saveDateFrom(storageKey: string, dateFrom: MonthDate | null): void {
  if (dateFrom === null) {
    chrome.storage.local.remove([storageKey]);
  } else {
    chrome.storage.local.set({ [storageKey]: dateFrom });
  }
}

