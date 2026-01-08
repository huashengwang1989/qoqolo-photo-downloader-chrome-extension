import type { PortfolioItemImage } from '@/shared/types/portfolio';
import { buildImageExportFilename } from '@/shared/helpers/imageExport';
import { getImageMainUrl } from '@/content/helpers/getImageMainUrl';

/**
 * Extract images from modal carousel
 * @param modal - The modal HTMLDivElement
 * @returns Array of images with URL and optional caption
 */
export function extractImages(modal: HTMLDivElement): PortfolioItemImage[] {
  const carouselLinks = modal.querySelector<HTMLDivElement>('#carouselLinks');
  const images: PortfolioItemImage[] = [];

  if (!carouselLinks) {
    return images;
  }

  const imageLinks = carouselLinks.querySelectorAll<HTMLAnchorElement>('a.bi-gallery-item');

  imageLinks.forEach((link, index) => {
    // Get image URL from href attribute
    const href = link.getAttribute('href');
    if (!href) {
      return; // Skip if no href
    }

    // Transform thumbnail URL to full-size image URL
    const url = getImageMainUrl(href);

    // Get caption from inner span with className "description"
    const descriptionSpan = link.querySelector<HTMLSpanElement>('span.description');
    let caption: string | undefined = undefined;

    if (descriptionSpan) {
      const captionText = descriptionSpan.textContent?.trim();
      if (captionText && captionText.length > 0) {
        caption = captionText;
      }
    }

    const exportFilename = buildImageExportFilename(index, url);

    images.push({ url, caption, exportFilename });
  });

  return images;
}
