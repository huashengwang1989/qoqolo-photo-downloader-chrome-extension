import { getTableRowsForCheckInOut } from './getTableRows';
import { getImageSrcsForCheckInOut } from './getImageSrcs';
import { addQueryParams } from './addQueryParams';

import { sleep } from '@/shared/helpers/utils';
import type {
  CheckInOutMonthItem,
  DailyCheckInOut,
  CheckInOutImage,
} from '@/shared/types/checkInOut';

/**
 * Process a single month: get table rows and images for each day
 * @param baseUrl - Base URL for check-in/out page
 * @param yearMonth - Year-month in YYYY-MM format (e.g., "2025-01")
 * @param monthYear - Month-year in MM-YYYY format (e.g., "01-2025") for folder naming
 * @param shouldStop - Stop flag reference
 * @returns Processed month item with daily records and images
 */
export async function processMonthForCheckInOut(
  baseUrl: string,
  yearMonth: string,
  monthYear: string,
  shouldStop: { value: boolean },
): Promise<CheckInOutMonthItem | null> {
  // Construct URL for this month
  const monthUrl = addQueryParams(baseUrl, {
    func: 'recent',
    selectDate: monthYear, // MM-YYYY format for URL
  });

  console.info(`[crawler] Processing month: ${yearMonth}`);

  // Fetch the month page
  let response: Response;
  try {
    response = await fetch(monthUrl);
    if (!response.ok) {
      console.error(`[crawler] Failed to fetch month page: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`[crawler] Error fetching month page:`, error);
    return null;
  }

  // Parse HTML
  const html = await response.text();
  const parser = new DOMParser();
  const monthDoc = parser.parseFromString(html, 'text/html');

  // Get table rows
  let dailyRecords: DailyCheckInOut[];
  try {
    dailyRecords = getTableRowsForCheckInOut(monthDoc);
  } catch (error) {
    if (error instanceof Error && error.message === 'expired-or-wrong-cookie') {
      console.warn('[crawler] Login session expired');
      throw error;
    }
    console.error(`[crawler] Error parsing table rows:`, error);
    return null;
  }

  if (dailyRecords.length === 0) {
    console.info(`[crawler] No data for month ${yearMonth}`);
    return null;
  }

  // Extract hostname from base URL for constructing image URLs
  const hostname = new URL(baseUrl).hostname;

  // Get images for each day
  // Note: We don't check shouldStop here - we finish processing all photos for this month
  // even if stop was requested, to avoid leaving a month partially processed
  const allImages: CheckInOutImage[] = [];

  for (const record of dailyRecords) {
    if (!record.date || !record.buttonId) {
      continue;
    }

    // Construct URL for viewing individual check-in
    const viewUrl = addQueryParams(baseUrl, {
      func: 'view_checkin',
      type: 'students',
      output: 'ajax',
      rid: record.buttonId,
      selectDate: record.date,
    });

    try {
      const viewResponse = await fetch(viewUrl, {
        credentials: 'include', // Include cookies for authenticated requests
      });
      if (!viewResponse.ok) {
        console.warn(
          `[crawler] Failed to fetch view page for ${record.date}: ${viewResponse.status}`,
        );
        continue;
      }

      const viewHtml = await viewResponse.text();
      const viewDoc = parser.parseFromString(viewHtml, 'text/html');

      const images = getImageSrcsForCheckInOut(viewDoc, record.date, hostname);
      allImages.push(...images);

      // Update record with photo links
      const checkInImage = images.find((img) => img.inout === 'in');
      const checkOutImage = images.find((img) => img.inout === 'out');
      record.checkInPhotoLink = checkInImage?.src || undefined;
      record.checkOutPhotoLink = checkOutImage?.src || undefined;

      // Small delay between requests
      await sleep(200);
    } catch (error) {
      console.error(`[crawler] Error fetching images for ${record.date}:`, error);
      continue;
    }
  }

  const monthItem: CheckInOutMonthItem = {
    yearMonth,
    url: monthUrl,
    dailyRecords,
    images: allImages,
  };

  return monthItem;
}
