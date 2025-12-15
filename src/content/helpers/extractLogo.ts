/**
 * Extract logo URL from Qoqolo page navbar
 * @returns Full logo URL or null if not found
 */
export function extractLogo(): string | null {
  const logoSpan = document.querySelector<HTMLSpanElement>('span.navbar-brand-logo');
  if (!logoSpan) {
    return null;
  }

  const logoImg = logoSpan.querySelector<HTMLImageElement>('img');
  if (!logoImg || !logoImg.src) {
    return null;
  }

  const src = logoImg.src;

  // Check if src matches the pattern "/skin/custom/{hash}..../logo.png"
  if (!src.includes('/skin/custom/') || !src.includes('/logo.png')) {
    return null;
  }

  // If it's already a full URL, return it
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // Convert relative URL to absolute URL
  try {
    const fullUrl = new URL(src, location.origin).toString();
    return fullUrl;
  } catch (error) {
    console.warn('[content] Failed to convert logo URL to absolute:', src, error);
    return null;
  }
}
