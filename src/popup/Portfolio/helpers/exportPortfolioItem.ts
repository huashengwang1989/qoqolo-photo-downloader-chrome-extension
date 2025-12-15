import JSZip from 'jszip';

import { buildMarkdownFromItem } from './buildMarkdown';

import { generateActivityFolderName } from '@/shared/helpers/activityFolderName';
import type { PortfolioItem } from '@/shared/types/portfolio';

/**
 * Download an image from a URL and return as blob
 */
async function downloadImage(url: string): Promise<Blob> {
  try {
    const response = await fetch(url, {
      credentials: 'include', // Include cookies for authenticated requests
    });
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('[popup] Failed to download image', url, error);
    throw error;
  }
}

/**
 * Export portfolio item as a zip file containing images, README.md, and data.json
 */
export async function exportPortfolioItem(item: PortfolioItem): Promise<void> {
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
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        // Optional: show progress
        if (metadata.percent) {
          console.info(`[popup] Zip progress: ${Math.round(metadata.percent)}%`);
        }
      },
    );

    // Create download filename using generateActivityFolderName
    const folderName = generateActivityFolderName(item);
    const filename = `${folderName}.zip`;

    // Trigger download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    console.info('[popup] Export completed:', filename);
  } catch (error) {
    console.error('[popup] Failed to export portfolio item', error);
    throw error;
  }
}
