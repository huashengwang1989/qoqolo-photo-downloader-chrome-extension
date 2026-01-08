import { processMonthForCheckInOut } from '../processMonth';

import { yearMonthFromMonthDate } from './yearMonthFromMonthDate';
import { yearMonthToMonthYear } from './yearMonthToMonthYear';
import { getCurrentYearMonth } from './getCurrentYearMonth';
import { decrementYearMonth } from './decrementYearMonth';
import { compareYearMonth } from './compareYearMonth';
import { checkLikelyLoginSessionExpired } from './checkLikelyLoginSessionExpired';

import type { CheckInOutMonthItem } from '@/shared/types/checkInOut';
import type { MonthDate } from '@/shared/types';
import { SIGNALS } from '@/shared/enums';
import { sleep, safeSendMessage } from '@/shared/helpers/utils';

const STORAGE_KEY = 'checkInOutCrawlItems';

/**
 * Start crawling check-in/out items
 * @param dateRange - Optional date range filter
 * @param isCrawling - Crawling state flag reference
 * @param shouldStop - Stop flag reference
 */
export async function startCrawlForCheckInOut(
  dateRange: { from: MonthDate | null; to: MonthDate | null } | undefined,
  isCrawling: { value: boolean },
  shouldStop: { value: boolean },
): Promise<void> {
  isCrawling.value = true;
  shouldStop.value = false;

  console.info('[crawler] Starting check-in/out crawl');

  // Check login session
  if (await checkLikelyLoginSessionExpired()) {
    console.warn('[crawler] Login session expired');
    isCrawling.value = false;
    return;
  }

  // Clear previous items
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
    safeSendMessage({
      type: SIGNALS.CHECK_IN_OUT_ITEMS_UPDATED,
      items: [],
    });
  } catch (error) {
    console.error('[crawler] Failed to clear previous items:', error);
  }

  // Get base URL (current page URL with 'c' parameter preserved)
  const currentUrl = new URL(location.href);
  const baseUrl = `${currentUrl.origin}${currentUrl.pathname}?c=${currentUrl.searchParams.get('c') || ''}`;

  // Determine start and end months
  // Empty "to" means start from current month
  const endYearMonth = dateRange?.to ? yearMonthFromMonthDate(dateRange.to) : getCurrentYearMonth();

  // Empty "from" means no lower limit (crawl backward until 5 consecutive months with no data)
  const startYearMonthLimit = dateRange?.from ? yearMonthFromMonthDate(dateRange.from) : null;

  console.info(
    '[crawler] Starting crawl from',
    endYearMonth,
    'backward',
    startYearMonthLimit
      ? `until ${startYearMonthLimit}`
      : 'until 5 consecutive months with no data',
  );

  const processedItems: CheckInOutMonthItem[] = [];
  let consecutiveEmptyMonths = 0;
  const MAX_CONSECUTIVE_EMPTY_MONTHS = 5;
  let currentYearMonth = endYearMonth;

  // Process months backward chronologically
  while (true) {
    if (shouldStop.value) {
      console.info('[crawler] Crawl stopped by user');
      break;
    }

    // Check if we've reached the lower limit (if "from" is set)
    if (startYearMonthLimit && compareYearMonth(currentYearMonth, startYearMonthLimit) < 0) {
      console.info('[crawler] Reached lower limit', startYearMonthLimit);
      break;
    }

    const monthYear = yearMonthToMonthYear(currentYearMonth);

    try {
      const monthItem = await processMonthForCheckInOut(
        baseUrl,
        currentYearMonth,
        monthYear,
        shouldStop,
      );

      if (monthItem) {
        // Month has data, reset consecutive empty counter
        consecutiveEmptyMonths = 0;
        processedItems.push(monthItem);

        // Send update for each month
        try {
          await chrome.storage.local.set({ [STORAGE_KEY]: processedItems });
          safeSendMessage({
            type: SIGNALS.CHECK_IN_OUT_ITEM_ADDED,
            item: monthItem,
          });
        } catch (error) {
          console.error('[crawler] Failed to store/send item:', error);
        }
      } else {
        // Month has no data
        consecutiveEmptyMonths += 1;
        console.info(
          `[crawler] No data for month ${currentYearMonth}, consecutive empty months: ${consecutiveEmptyMonths}`,
        );

        // If "from" is not set and we have 5 consecutive empty months, stop
        if (!startYearMonthLimit && consecutiveEmptyMonths >= MAX_CONSECUTIVE_EMPTY_MONTHS) {
          console.info(
            `[crawler] Stopping crawl: ${MAX_CONSECUTIVE_EMPTY_MONTHS} consecutive months with no data`,
          );
          break;
        }
      }

      // Small delay between months
      await sleep(500);
    } catch (error) {
      if (error instanceof Error && error.message === 'expired-or-wrong-cookie') {
        console.warn('[crawler] Stopping crawl due to login session expiry');
        isCrawling.value = false;
        shouldStop.value = false;
        return;
      }
      console.error(`[crawler] Error processing month ${currentYearMonth}:`, error);
      // On error, count as empty month and continue
      consecutiveEmptyMonths += 1;
      if (!startYearMonthLimit && consecutiveEmptyMonths >= MAX_CONSECUTIVE_EMPTY_MONTHS) {
        console.info(
          `[crawler] Stopping crawl: ${MAX_CONSECUTIVE_EMPTY_MONTHS} consecutive months with errors/no data`,
        );
        break;
      }
    }

    // Move to previous month
    currentYearMonth = decrementYearMonth(currentYearMonth);
  }

  console.info('[crawler] Check-in/out crawl complete', processedItems);
  isCrawling.value = false;
  shouldStop.value = false;

  // Send final complete array and completion signal
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: processedItems });
    safeSendMessage({
      type: SIGNALS.CHECK_IN_OUT_ITEMS_UPDATED,
      items: processedItems,
    });
    safeSendMessage({
      type: SIGNALS.CHECK_IN_OUT_CRAWL_COMPLETE,
    });
  } catch (error) {
    console.error('[crawler] Failed to store final items:', error);
  }
}
