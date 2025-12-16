import { useEffect, useMemo, useState } from 'react';

import type { MonthDate } from '@/shared/types';

import {
  DEFAULT_STORAGE_KEY_DATE_FROM,
  DEFAULT_STORAGE_KEY_DATE_TO,
} from './constants';
import { loadSavedDates } from './handlers/loadSavedDates';
import { saveDateFrom } from './handlers/saveDateFrom';
import { saveDateTo } from './handlers/saveDateTo';
import { getCurrentMonth } from './utils/getCurrentMonth';
import { isDateRangeValid } from './utils/isDateRangeValid';

export interface UseDateStorageOptions {
  /** Storage key for dateFrom (defaults to DEFAULT_STORAGE_KEY_DATE_FROM) */
  storageKeyDateFrom?: string;
  /** Storage key for dateTo (defaults to DEFAULT_STORAGE_KEY_DATE_TO) */
  storageKeyDateTo?: string;
}

/**
 * Custom hook to manage date range storage and persistence
 * @param options - Optional configuration for storage keys
 * @returns Object containing dateFrom, dateTo, setters, maxDate, and validation
 */
export function useDateStorage(options?: UseDateStorageOptions) {
  const {
    storageKeyDateFrom = DEFAULT_STORAGE_KEY_DATE_FROM,
    storageKeyDateTo = DEFAULT_STORAGE_KEY_DATE_TO,
  } = options || {};

  const [dateFrom, setDateFrom] = useState<MonthDate | null>(null);
  const [dateTo, setDateTo] = useState<MonthDate | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current month as max date
  const maxDate = useMemo<MonthDate>(() => getCurrentMonth(), []);

  // Load saved date selections from storage on mount
  useEffect(() => {
    loadSavedDates(storageKeyDateFrom, storageKeyDateTo, maxDate, setDateFrom, setDateTo, setIsInitialized);
  }, [maxDate, storageKeyDateFrom, storageKeyDateTo]);

  // Save dateFrom to storage whenever it changes (after initialization)
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    saveDateFrom(storageKeyDateFrom, dateFrom);
  }, [dateFrom, isInitialized, storageKeyDateFrom]);

  // Save dateTo to storage whenever it changes (after initialization)
  // Special handling: if current month is selected, clear storage instead
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    saveDateTo(storageKeyDateTo, dateTo, maxDate);
  }, [dateTo, maxDate, isInitialized, storageKeyDateTo]);

  // Check if date range is valid (from <= to)
  const dateRangeValid = useMemo(() => {
    return isDateRangeValid(dateFrom, dateTo);
  }, [dateFrom, dateTo]);

  return {
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    maxDate,
    isDateRangeValid: dateRangeValid,
  };
}

