/**
 * Get the main (full-size) image URL from a thumbnail URL
 * If the filename starts with ".tn." and ends with ".big.jpg",
 * removes ".tn." prefix and removes ".big.jpg" suffix
 * @param url - The image URL (can be relative or absolute)
 * @returns The transformed URL, or the original URL if transformation is not needed or fails
 * @example
 * getImageMainUrl("https://example.com/path/.tn.image.jpg.big.jpg")
 * // Returns: "https://example.com/path/image.jpg"
 * getImageMainUrl("https://example.com/path/.tn.image.jpeg.big.jpg")
 * // Returns: "https://example.com/path/image.jpeg"
 */
export function getImageMainUrl(url: string): string {
  // Convert relative URL to absolute URL
  let absoluteUrl: string;
  try {
    absoluteUrl = new URL(url, location.origin).toString();
  } catch {
    // If URL parsing fails, return the original URL
    return url;
  }

  // Process thumbnail URLs: if filename starts with ".tn." and ends with ".big.jpg",
  // remove ".tn." prefix and remove ".big.jpg" suffix
  try {
    const urlObj = new URL(absoluteUrl);
    const pathname = urlObj.pathname;
    const lastSlashIndex = pathname.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const filename = pathname.substring(lastSlashIndex + 1);
      // Check if filename starts with ".tn." and ends with ".big.jpg"
      if (filename.startsWith('.tn.') && filename.endsWith('.big.jpg')) {
        // Remove ".tn." prefix and ".big.jpg" suffix
        const newFilename = filename.slice(4).replace('.big.jpg', '');
        // Reconstruct the URL with the new filename
        const newPathname = pathname.substring(0, lastSlashIndex + 1) + newFilename;
        urlObj.pathname = newPathname;
        return urlObj.toString();
      }
    }
  } catch {
    // If URL parsing fails, use the original URL
  }

  return absoluteUrl;
}
