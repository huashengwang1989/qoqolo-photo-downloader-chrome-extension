import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SIGNALS } from '@/shared/enums';
import type { BackgroundMessage } from '@/shared/types';

export interface UseCrawlControlOptions {
  /** Signal type for crawl completion */
  completionSignal: SIGNALS;
  /** Storage key for storing crawl in-progress state */
  crawlStateStorageKey: string;
  /** Maximum crawl count for timeout calculation */
  maxCrawlCount: number;
  /** Current item count (for timeout detection) */
  itemCount: number;
  /** Function to clear items when starting a new crawl */
  clearItems: () => void;
  /** Function to actually start the crawl */
  startCrawl: () => Promise<void>;
  /** Function to actually stop the crawl */
  stopCrawl: () => Promise<void>;
}

export interface UseCrawlControlReturn {
  /** Whether crawl is currently loading */
  isLoading: boolean;
  /** Whether crawl is currently stopping */
  isStopping: boolean;
  /** Callback to start crawl */
  onStartCrawl: () => Promise<void>;
  /** Callback to stop crawl */
  onStopCrawl: () => Promise<void>;
}

/**
 * Custom hook to manage crawl control state and logic
 * Handles loading/stopping states, timeout detection, and crawl completion listening
 */
export function useCrawlControl({
  completionSignal,
  crawlStateStorageKey,
  maxCrawlCount,
  itemCount,
  clearItems,
  startCrawl,
  stopCrawl,
}: UseCrawlControlOptions): UseCrawlControlReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Restore loading state from storage on mount (handles tab switches)
  useEffect(() => {
    const checkCrawlState = () => {
      chrome.storage.local.get([crawlStateStorageKey], (result) => {
        const isCrawlingInStorage = result[crawlStateStorageKey] === true;
        if (isCrawlingInStorage) {
          // Restore loading state
          setIsLoading(true);
          // Initialize crawl start time to current time for timeout calculation
          // This is an approximation since we don't know when crawl actually started
          crawlStartTimeRef.current = Date.now();
        }
      });
    };

    checkCrawlState();

    // Also listen for storage changes to update state if crawl state changes elsewhere
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[crawlStateStorageKey]) {
        const isCrawling = changes[crawlStateStorageKey].newValue === true;
        setIsLoading(isCrawling);
        if (!isCrawling) {
          setIsStopping(false);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [crawlStateStorageKey]);

  // Store timeout ID in a ref so we can clear it when crawl completes
  const timeoutRef = useRef<number | null>(null);
  // Track when crawl started to detect if items are still being added
  const crawlStartTimeRef = useRef<number | null>(null);
  const currentItemCountRef = useRef<number>(0);
  const lastItemCountRef = useRef<number>(0);

  // Keep item count ref in sync with items array
  useEffect(() => {
    if (isLoading) {
      lastItemCountRef.current = currentItemCountRef.current;
      currentItemCountRef.current = itemCount;
    }
  }, [itemCount, isLoading]);

  // Listen for crawl completion
  useEffect(() => {
    const handleMessage = (
      message: BackgroundMessage,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) => {
      if (message.type === completionSignal) {
        setIsLoading(false);
        setIsStopping(false);
        crawlStartTimeRef.current = null;
        currentItemCountRef.current = 0;
        lastItemCountRef.current = 0;
        // Clear crawl state from storage
        chrome.storage.local.remove([crawlStateStorageKey]);
        // Clear timeout if it exists
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [completionSignal, crawlStateStorageKey]);

  const onStartCrawl = useCallback(async () => {
    setIsLoading(true);
    // Store crawl state in storage so it persists across tab switches
    chrome.storage.local.set({ [crawlStateStorageKey]: true });
    clearItems();
    crawlStartTimeRef.current = Date.now();
    currentItemCountRef.current = 0;
    lastItemCountRef.current = 0;

    // Calculate timeout based on maxCrawlCount
    // Each item takes ~1 second delay + processing time (~2-3 seconds per item)
    // Add extra buffer for safety
    const timeoutMs = maxCrawlCount * 5000 + 30000; // 5 seconds per item + 30 second buffer

    // Set a timeout fallback in case the content script doesn't send completion message
    // This handles edge cases like: wrong page type, script errors, or network issues
    timeoutRef.current = window.setTimeout(() => {
      // Only reset if no items have been added recently (items still at 0 or same count)
      // This prevents resetting if crawl is legitimately still in progress
      const currentItemCount = currentItemCountRef.current;
      const timeSinceStart = crawlStartTimeRef.current ? Date.now() - crawlStartTimeRef.current : 0;

      // If we have items and they're still being added, extend the timeout
      if (
        currentItemCount > 0 &&
        currentItemCount === lastItemCountRef.current &&
        timeSinceStart < timeoutMs * 2
      ) {
        // Items were added but stopped - might still be processing, give more time
        console.warn('[popup] Crawl appears stalled, but extending timeout');
        return;
      }

      // Only reset if truly no progress (no items or no recent updates)
      if (currentItemCount === 0 || currentItemCount === lastItemCountRef.current) {
        console.warn('[popup] Crawl timeout - resetting loading state');
        setIsLoading(false);
        chrome.storage.local.remove([crawlStateStorageKey]);
        crawlStartTimeRef.current = null;
        currentItemCountRef.current = 0;
        lastItemCountRef.current = 0;
      }
    }, timeoutMs);

    try {
      await startCrawl();
    } catch (error) {
      // onError handling
      console.error('[popup] Failed to start crawl:', error);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsLoading(false);
      chrome.storage.local.remove([crawlStateStorageKey]);
    }
  }, [clearItems, maxCrawlCount, startCrawl, crawlStateStorageKey]);

  const onStopCrawl = useCallback(async () => {
    setIsStopping(true);
    try {
      await stopCrawl();
    } catch (error) {
      console.error('[popup] Failed to stop crawl:', error);
      // If error, reset stopping state
      setIsStopping(false);
    }
    // Loading state will be set to false when completion signal is received
  }, [stopCrawl]);

  return useMemo(
    () => ({
      isLoading,
      isStopping,
      onStartCrawl,
      onStopCrawl,
    }),
    [isLoading, isStopping, onStartCrawl, onStopCrawl],
  );
}
