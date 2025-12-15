import JSZip from 'jszip';

import { generateActivityFolderName } from '@/shared/helpers/activityFolderName';
import { buildMarkdownFromItem } from './buildMarkdown';

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
 * Extract year-month (yyyy_mm) from publish date (YYYY-MM-DD)
 */
function extractYearMonth(publishDate: string): string | null {
  const match = publishDate.match(/^(\d{4})-(\d{2})-/);
  if (match) {
    return `${match[1]}_${match[2]}`;
  }
  return null;
}

/**
 * Calculate date range (earliest to latest) from all items
 * Returns format: "yyyy_mm-yyyy_mm" or null if no valid dates found
 */
function calculateDateRange(items: PortfolioItem[]): string | null {
  const yearMonths: string[] = [];

  for (const item of items) {
    if (item.details?.publishDate) {
      const ym = extractYearMonth(item.details.publishDate);
      if (ym) {
        yearMonths.push(ym);
      }
    }
  }

  if (yearMonths.length === 0) {
    return null;
  }

  // Sort year-months (format: yyyy_mm, so string sort works)
  yearMonths.sort();

  const earliest = yearMonths[0];
  const latest = yearMonths[yearMonths.length - 1];

  // Always return "yyyy_mm-yyyy_mm" format (even if same date)
  return `${earliest}-${latest}`;
}

/**
 * Export all portfolio items as a batch zip file
 * Each item becomes a folder containing its images, README.md, and data.json
 */
export async function exportPortfolioBatch(items: PortfolioItem[]): Promise<void> {
  if (items.length === 0) {
    throw new Error('No items to export');
  }

  try {
    const zip = new JSZip();

    console.info('[popup] Starting batch export for', items.length, 'items');

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
        console.info(`[popup] Downloading images for "${folderName}"...`, item.details.images.length);
        for (const image of item.details.images) {
          try {
            const blob = await downloadImage(image.url);
            // Use precomputed export filename (at root level of item folder, no images/ subfolder)
            folder.file(image.exportFilename, blob);
          } catch (error) {
            console.error('[popup] Failed to download image', image.url, error);
            // Continue with other images even if one fails
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
    const batchZipFilename = `qoqolo-portfolio-${dateRangeStr}.zip`;

    // Generate zip file
    console.info('[popup] Generating batch zip file...');
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        // Optional: show progress
        if (metadata.percent) {
          console.info(`[popup] Batch zip progress: ${Math.round(metadata.percent)}%`);
        }
      },
    );

    // Trigger download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = batchZipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    console.info('[popup] Batch export completed:', batchZipFilename);
  } catch (error) {
    console.error('[popup] Failed to export portfolio batch', error);
    throw error;
  }
}

