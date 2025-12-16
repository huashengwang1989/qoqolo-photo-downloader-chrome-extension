import JSZip from 'jszip';

import { buildMarkdownFromItem } from '../helpers/buildMarkdown';

import { generateActivityFolderName } from '@/shared/helpers/activityFolderName';
import {
  calculateDateRange,
  downloadImage,
  generateZipBlob,
  triggerDownload,
} from '@/shared/utils/export';
import { sleep } from '@/shared/helpers/utils';
import type { Item } from '@/shared/types/item';

interface ExportBatchOptions {
  batchFilenamePrefix: string; // e.g., "qoqolo-portfolio" or "qoqolo-class-activity"
}

/**
 * Export all activity items as a batch zip file
 * Each item becomes a folder containing its images, README.md, and data.json
 * @param items - Activity items to export
 * @param options - Export options including batch filename prefix
 * @param onProgress - Optional callback for progress updates (downloadedImages, totalImages)
 */
export async function exportBatch(
  items: Item[],
  options: ExportBatchOptions,
  onProgress?: (downloadedImages: number, totalImages: number) => void,
): Promise<void> {
  if (items.length === 0) {
    throw new Error('No items to export');
  }

  try {
    const zip = new JSZip();

    // Calculate total number of images
    const totalImages = items.reduce((sum, item) => sum + (item.details?.images?.length || 0), 0);

    console.info(
      '[popup] Starting batch export for',
      items.length,
      'items',
      `(${totalImages} images)`,
    );

    let downloadedImages = 0;

    // Process each item
    for (const item of items) {
      const folderName = generateActivityFolderName(item);
      const folder = zip.folder(folderName);

      if (!folder) {
        console.error('[popup] Failed to create folder', folderName);
        continue;
      }

      // Download all images for this item
      if (item.details?.images && item.details.images.length > 0) {
        console.info(
          `[popup] Downloading images for "${folderName}"...`,
          item.details.images.length,
        );
        for (const image of item.details.images) {
          try {
            const blob = await downloadImage(image.url);
            // Use precomputed export filename (at root level of item folder, no images/ subfolder)
            folder.file(image.exportFilename, blob);
            downloadedImages++;
            // Update progress
            onProgress?.(downloadedImages, totalImages);
            await sleep(300); // Do not give too much pressure to the server
          } catch (error) {
            console.error('[popup] Failed to download image', image.url, error);
            // Continue with other images even if one fails
            // Still count as downloaded for progress (or skip if preferred)
            downloadedImages++;
            onProgress?.(downloadedImages, totalImages);
          }
        }
      }

      // Generate README.md for this item
      const markdown = buildMarkdownFromItem(item);
      folder.file('README.md', markdown, { createFolders: false });

      // Generate data.json for this item
      const jsonData = JSON.stringify(item, null, 2);
      folder.file('data.json', jsonData, { createFolders: false });
    }

    // Calculate date range for batch zip filename
    const dateRange = calculateDateRange(items);
    const dateRangeStr = dateRange || new Date().toISOString().slice(0, 7).replace('-', '_');
    const batchZipFilename = `${options.batchFilenamePrefix}-${dateRangeStr}.zip`;

    // Generate zip file
    console.info('[popup] Generating batch zip file...');
    const zipBlob = await generateZipBlob(zip, (percent) => {
      console.info(`[popup] Batch zip progress: ${Math.round(percent)}%`);
    });

    // Trigger download
    triggerDownload(zipBlob, batchZipFilename);

    console.info('[popup] Batch export completed:', batchZipFilename);
  } catch (error) {
    console.error('[popup] Failed to export activity batch', error);
    throw error;
  }
}
