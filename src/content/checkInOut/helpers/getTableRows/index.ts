import { isLikelyLoginSessionExpired } from './isLikelyLoginSessionExpired';
import { removeSuffix } from './removeSuffix';
import { formatTimestamp } from './formatTimestamp';
import { extractDate } from './extractDate';

import type { DailyCheckInOut } from '@/shared/types/checkInOut';

/**
 * Get table rows from check-in/out page
 * @param document - Document object (should be from fetched page)
 * @returns Array of daily check-in/out records
 */
export function getTableRowsForCheckInOut(document: Document): DailyCheckInOut[] {
  const resultArray: DailyCheckInOut[] = [];

  // Check if login session is expired
  if (isLikelyLoginSessionExpired(document)) {
    throw new Error('expired-or-wrong-cookie');
  }

  // Find the first table in the HTML
  const table = document.querySelector('table');
  if (!table) {
    return resultArray;
  }

  // Extract rows from the table
  const rows = table.querySelectorAll('tr');

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) {
      return;
    }

    // Extract text content from cells
    const rowData = Array.from(cells).map((cell) => cell.textContent?.trim() || '');

    // Check if the last cell contains a button
    const buttonCell = cells[cells.length - 1];
    const button = buttonCell.querySelector('button');
    if (!button || !button.hasAttribute('_id')) {
      return;
    }

    const buttonId = button.getAttribute('_id') || '';

    // Extract drop-off information
    const dropTs = formatTimestamp(rowData[1] || '');
    const dropInfo = cells[2];
    const dropCommentP = dropInfo.querySelector('p');
    const dropComment = dropCommentP?.textContent?.trim() || '';
    const dropPerson = dropComment ? removeSuffix(rowData[2] || '', dropComment) : rowData[2] || '';

    // Extract pick-up information
    const pickTs = formatTimestamp(rowData[4] || '');
    const pickInfo = cells[5];
    const pickCommentP = pickInfo.querySelector('p');
    const pickComment = pickCommentP?.textContent?.trim() || '';
    const pickPerson = pickComment ? removeSuffix(rowData[5] || '', pickComment) : rowData[5] || '';

    // Extract date (prefer drop timestamp, fallback to pick timestamp)
    let date = extractDate(dropTs);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      date = extractDate(pickTs);
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        date = '';
      }
    }

    // Extract index (0-based)
    const idx = parseInt(rowData[0] || '0', 10) - 1;

    const dailyInfo: DailyCheckInOut = {
      buttonId,
      idx: isNaN(idx) ? 0 : idx,
      date,
      dropTs,
      dropPerson,
      dropComment,
      pickTs,
      pickPerson,
      pickComment,
    };

    resultArray.push(dailyInfo);
  });

  return resultArray;
}
