import JSZip from 'jszip';

import { generateCSVForCheckInOut } from './generateCSV';

import { downloadImage } from '@/shared/utils/export';
import { generateZipBlob } from '@/shared/utils/export';
import { triggerDownload } from '@/shared/utils/export';
import type { CheckInOutMonthItem } from '@/shared/types/checkInOut';

export interface ExportBatchOptions {
  batchFilenamePrefix?: string;
}

/**
 * Export all months as a batch: each month in its own folder
 * @param monthItems - Array of month items to export
 * @param options - Export options
 * @param onProgress - Optional progress callback
 */
export async function exportBatchForCheckInOut(
  monthItems: CheckInOutMonthItem[],
  options: ExportBatchOptions = {},
  onProgress?: (downloaded: number, total: number) => void,
): Promise<void> {
  const { batchFilenamePrefix = 'qoqolo-check-in-out' } = options;

  // Calculate total images for progress tracking
  const totalImages = monthItems.reduce((sum, item) => sum + item.images.length, 0);
  let downloadedImages = 0;

  // Create ZIP
  const zip = new JSZip();

  // Process each month
  for (const monthItem of monthItems) {
    const { yearMonth, dailyRecords, images } = monthItem;

    // Create folder for this month
    const monthFolder = zip.folder(yearMonth);
    if (!monthFolder) {
      console.error(`[export] Failed to create folder for ${yearMonth}`);
      continue;
    }

    // Add CSV file to month folder
    const csvContent = generateCSVForCheckInOut(dailyRecords);
    monthFolder.file(`${yearMonth}.csv`, csvContent);

    // Add JSON file to month folder
    const jsonData = JSON.stringify(monthItem, null, 2);
    monthFolder.file(`${yearMonth}.json`, jsonData);

    // Download images and add to month folder
    for (const image of images) {
      try {
        const blob = await downloadImage(image.src);
        if (blob) {
          // Rename image: use renameAs field (e.g., "2025-01-15-in" -> "2025-01-15-in.jpg")
          const filename = `${image.renameAs}.jpg`;
          monthFolder.file(filename, blob);
        }
        downloadedImages += 1;
        onProgress?.(downloadedImages, totalImages);
      } catch (error) {
        console.error(`[export] Failed to download image ${image.src}:`, error);
        // Continue with other images
      }
    }
  }

  // Calculate date range from month items for filename
  // yearMonth is in YYYY-MM format, convert to YYYY_MM for filename
  const yearMonths = monthItems.map((item) => item.yearMonth.replace('-', '_'));
  let dateRangeStr = '';
  if (yearMonths.length > 0) {
    // Sort to find earliest and latest (string sort works for YYYY_MM format)
    yearMonths.sort();
    const earliest = yearMonths[0];
    const latest = yearMonths[yearMonths.length - 1];
    // Format: earliest-latest (earlier month first)
    dateRangeStr = yearMonths.length === 1 ? earliest : `${earliest}-${latest}`;
  }

  // Generate ZIP blob
  const zipBlob = await generateZipBlob(zip);

  // Trigger download with date range in filename
  const filename = dateRangeStr
    ? `${batchFilenamePrefix}-${dateRangeStr}.zip`
    : `${batchFilenamePrefix}.zip`;
  triggerDownload(zipBlob, filename);
}
