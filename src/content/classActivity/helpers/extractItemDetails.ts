import { buildImageExportFilename } from '@/shared/helpers/imageExport';
import { parseDatetimeToDateAndDatetime } from '@/shared/utils/date';
import type { ItemDetails, ItemImage } from '@/shared/types/item';

/**
 * Extract Class Activity item details from the infinite-item panel
 * @param panel - The infinite-item panel HTMLDivElement
 * @returns Class Activity item details
 */
export function extractItemDetails(panel: HTMLDivElement): ItemDetails {
  const images: ItemImage[] = [];
  let content = '';
  let teacher = '';
  let publishDate = '';
  let publishDatetime = '';

  // Extract teacher name from media-right > a > strong
  const teacherLink = panel.querySelector<HTMLAnchorElement>('div.media-right a strong');
  if (teacherLink) {
    teacher = (teacherLink.textContent || '').trim();
  }

  // Extract publish datetime from media-right > p.text-muted
  const publishDateParagraph = panel.querySelector<HTMLParagraphElement>(
    'div.media-right p.text-muted',
  );
  if (publishDateParagraph) {
    const datetimeText = (publishDateParagraph.textContent || '').trim();
    const parsed = parseDatetimeToDateAndDatetime(datetimeText);
    publishDate = parsed.publishDate;
    publishDatetime = parsed.publishDatetime;
  }

  // Extract content from the paragraph after view-album anchor
  // The structure is: <p><a class="view-album post-title">...</a></p><p>{content}</p>
  const albumLinkAnchor = panel.querySelector<HTMLAnchorElement>('a.view-album.post-title');
  if (albumLinkAnchor) {
    // Find the parent <p> tag containing the anchor
    const albumTitleParagraph = albumLinkAnchor.closest<HTMLParagraphElement>('p');
    if (albumTitleParagraph) {
      // Find the next sibling <p> tag after the title paragraph
      let nextSibling: Element | null = albumTitleParagraph.nextElementSibling;
      while (nextSibling) {
        if (nextSibling.tagName === 'P') {
          content = (nextSibling.textContent || '').trim();
          break;
        }
        nextSibling = nextSibling.nextElementSibling;
      }
    }
  }

  // Extract images from whole-album > a.bi-gallery-item
  const wholeAlbumDiv = panel.querySelector<HTMLDivElement>('div.whole-album');
  if (wholeAlbumDiv) {
    const imageLinks = wholeAlbumDiv.querySelectorAll<HTMLAnchorElement>('a.bi-gallery-item');
    imageLinks.forEach((link, index) => {
      // Get image URL from href attribute (not thumbnail)
      const href = link.getAttribute('href');
      if (!href) {
        return; // Skip if no href
      }

      // Convert relative URL to absolute URL
      const url = new URL(href, location.origin).toString();

      // Get caption from span.bi-gallery-item-description
      const descriptionSpan = link.querySelector<HTMLSpanElement>(
        'span.bi-gallery-item-description',
      );
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
  }

  return {
    images,
    content,
    teacher,
    publishDate,
    publishDatetime,
  };
}
