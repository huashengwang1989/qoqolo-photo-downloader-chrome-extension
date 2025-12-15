import JSZip from 'jszip';

/**
 * Generate a zip blob from a JSZip instance
 */
export async function generateZipBlob(
  zip: JSZip,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  return zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      // Optional: show progress
      if (metadata.percent && onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    },
  );
}
