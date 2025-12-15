/**
 * Download an image from a URL and return as blob
 */
export async function downloadImage(url: string): Promise<Blob> {
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
