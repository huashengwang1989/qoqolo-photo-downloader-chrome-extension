/**
 * Sanitize filename to be safe for file system.
 */
export function sanitizeFilenameForExport(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200); // Limit length
}

/**
 * Extract original filename (last path segment) from URL, without query/hash.
 */
export function getOriginalFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const segments = pathname.split('/');
    const last = segments[segments.length - 1] || 'image';
    return last;
  } catch {
    // Fallback: try simple regex
    const match = url.match(/\/([^/?#]+)(?:[?#]|$)/);
    return match?.[1] || 'image';
  }
}

/**
 * Build export filename for an image, including index prefix (01_, 02_, etc.)
 * The base name is derived from the original filename in the URL and sanitized.
 *
 * Examples:
 * - index=0, url=.../photo.jpg -> "01_photo.jpg"
 * - index=1, url=.../abc -> "02_abc"
 */
export function buildImageExportFilename(index: number, url: string): string {
  const indexStr = String(index + 1).padStart(2, '0');
  const originalName = getOriginalFilenameFromUrl(url);
  const baseName = sanitizeFilenameForExport(originalName);
  return `${indexStr}_${baseName}`;
}
