import JSZip from 'jszip';

import { buildMarkdownFromItem } from '../helpers/buildMarkdown';

import { generateActivityFolderName } from '@/shared/helpers/activityFolderName';
import { downloadImage, generateZipBlob, triggerDownload } from '@/shared/utils/export';
import type { Item } from '@/shared/types/item';

/**
 * Export activity item as a zip file containing images, README.md, and data.json
 */
export async function exportItem(item: Item): Promise<void> {
  try {
    const zip = new JSZip();

    // Download all images
    if (item.details?.images && item.details.images.length > 0) {
      console.info('[popup] Downloading images...', item.details.images.length);
      for (let i = 0; i < item.details.images.length; i++) {
        const image = item.details.images[i];
        try {
          const blob = await downloadImage(image.url);

          // Use precomputed export filename from item details (at root level, no images/ subfolder)
          const filename = image.exportFilename;

          zip.file(filename, blob);
        } catch (error) {
          console.error('[popup] Failed to download image', image.url, error);
          // Continue with other images even if one fails
        }
      }
    }

    // Generate README.md with markdown content (shared markdown builder)
    const markdown = buildMarkdownFromItem(item);
    zip.file('README.md', markdown, { createFolders: false });

    // Generate data.json with item object
    const jsonData = JSON.stringify(item, null, 2);
    zip.file('data.json', jsonData, { createFolders: false });

    // Generate zip file
    console.info('[popup] Generating zip file...');
    const zipBlob = await generateZipBlob(zip, (percent) => {
      console.info(`[popup] Zip progress: ${Math.round(percent)}%`);
    });

    // Create download filename using generateActivityFolderName
    const folderName = generateActivityFolderName(item);
    const filename = `${folderName}.zip`;

    // Trigger download
    triggerDownload(zipBlob, filename);

    console.info('[popup] Export completed:', filename);
  } catch (error) {
    console.error('[popup] Failed to export activity item', error);
    throw error;
  }
}
