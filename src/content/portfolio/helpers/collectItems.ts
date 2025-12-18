import { formatDateToYYYYMMDD } from '@/shared/utils/date';
import type { PortfolioItem } from '@/shared/types/portfolio';

export interface CollectItemsOptions {
  maxCount?: number;
}

/**
 * Extract publishDate from foliette-item wrapper
 * @param wrapper - The foliette-item wrapper HTMLDivElement
 * @returns publishDate in YYYY-MM-DD format, or empty string if not found
 */
function extractPublishDateFromWrapper(wrapper: HTMLDivElement): string {
  const textMutedParagraph = wrapper.querySelector<HTMLParagraphElement>('p.text-muted');
  if (!textMutedParagraph) {
    return '';
  }

  // Look for span containing the date (usually after "created this on")
  const spans = Array.from(textMutedParagraph.querySelectorAll<HTMLSpanElement>('span'));
  for (const span of spans) {
    const text = (span.textContent || '').trim();
    // Use formatDateToYYYYMMDD to parse the date (format: "dd mmm yyyy")
    const parsedDate = formatDateToYYYYMMDD(text);
    if (parsedDate) {
      return parsedDate;
    }
  }

  return '';
}

/**
 * Extract itemCode from foliette-item wrapper id
 * @param wrapper - The foliette-item wrapper HTMLDivElement
 * @returns itemCode, or empty string if not found
 */
function extractItemCodeFromWrapper(wrapper: HTMLDivElement): string {
  const id = wrapper.id;
  const itemCodeMatch = id.match(/^folietteItem_(.+)$/);
  return itemCodeMatch ? itemCodeMatch[1] : '';
}

export function collectItemsForPortfolio(options?: CollectItemsOptions): PortfolioItem[] {
  // Find the infinite-panel container first
  const wrapper = document.querySelector<HTMLDivElement>('div.infinite-panel.foliettes-container');
  if (!wrapper) {
    return [];
  }

  // Get all foliette-item panels then
  const panels = wrapper.querySelectorAll<HTMLDivElement>('div.foliette-item');

  // Map wrappers to items and de-duplicate by link
  const linkMap = new Map<string, PortfolioItem>();

  Array.from(panels).forEach((panel) => {
    // Find the anchor within this panel
    const anchor = panel.querySelector<HTMLAnchorElement>('div.media-body a.foliette-view');
    if (!anchor) {
      return; // Skip if no anchor found
    }

    const rawLink = anchor.getAttribute('data-href') || anchor.getAttribute('href') || '';
    const link = new URL(rawLink, location.origin).toString();

    // Only add if link doesn't exist yet (de-duplicate)
    if (!linkMap.has(link)) {
      const publishDate = extractPublishDateFromWrapper(panel);
      const itemCode = extractItemCodeFromWrapper(panel);

      linkMap.set(link, {
        link,
        title: anchor.getAttribute('data-label') || anchor.textContent?.trim() || '',
        publishDate,
        itemCode: itemCode || undefined,
      });
    }
  });

  // Convert map values to array
  let items = Array.from(linkMap.values());

  // Limit to maxCount if provided and > 0
  if (options?.maxCount && options.maxCount > 0 && items.length > options.maxCount) {
    items = items.slice(0, options.maxCount);
  }

  return items;
}
