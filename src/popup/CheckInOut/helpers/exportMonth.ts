import JSZip from 'jszip';

import { generateCSVForCheckInOut } from './generateCSV';

import { downloadImage } from '@/shared/utils/export';
import { generateZipBlob } from '@/shared/utils/export';
import { triggerDownload } from '@/shared/utils/export';
import type { CheckInOutMonthItem } from '@/shared/types/checkInOut';

/**
 * Export a single month: images + CSV + JSON as ZIP
 * @param monthItem - Month item to export
 * @param onProgress - Optional progress callback
 */
export async function exportMonthForCheckInOut(
  monthItem: CheckInOutMonthItem,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<void> {
  const { yearMonth, dailyRecords, images } = monthItem;

  // Create ZIP
  const zip = new JSZip();

  // Add CSV file (without photo links)
  const csvContent = generateCSVForCheckInOut(dailyRecords);
  zip.file(`${yearMonth}.csv`, csvContent);

  // Add JSON file with full month item data (including photo links)
  const jsonData = JSON.stringify(monthItem, null, 2);
  zip.file(`${yearMonth}.json`, jsonData);
  console.info(`[export] Added ${yearMonth}.json to ZIP`);

  // Download images and add to ZIP
  let downloaded = 0;
  const total = images.length;

  for (const image of images) {
    try {
      const blob = await downloadImage(image.src);
      if (blob) {
        // Rename image: use renameAs field (e.g., "2025-01-15-in" -> "2025-01-15-in.jpg")
        const filename = `${image.renameAs}.jpg`;
        zip.file(filename, blob);
      }
      downloaded += 1;
      onProgress?.(downloaded, total);
    } catch (error) {
      console.error(`[export] Failed to download image ${image.src}:`, error);
      // Continue with other images
    }
  }

  // Generate ZIP blob
  const zipBlob = await generateZipBlob(zip);

  // Convert yearMonth from YYYY-MM to YYYY_MM for filename
  const yearMonthForFilename = yearMonth.replace('-', '_');

  // Trigger download
  triggerDownload(zipBlob, `qoqolo-check-in-out-${yearMonthForFilename}.zip`);
}
