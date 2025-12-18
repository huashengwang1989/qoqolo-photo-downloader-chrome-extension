import { parseDatetimeToDateAndDatetime } from '@/shared/utils/date';
import type { Item } from '@/shared/types/item';

export interface CollectItemsOptions {
  maxCount?: number;
}

/**
 * Extract publishDate from panel
 * @param panel - The infinite-item panel HTMLDivElement
 * @returns publishDate in YYYY-MM-DD format, or empty string if not found
 */
function extractPublishDateFromPanel(panel: HTMLDivElement): string {
  // Extract publish datetime from media-right > p.text-muted
  const publishDateParagraph = panel.querySelector<HTMLParagraphElement>(
    'div.media-right p.text-muted',
  );
  if (!publishDateParagraph) {
    return '';
  }

  const datetimeText = (publishDateParagraph.textContent || '').trim();
  const parsed = parseDatetimeToDateAndDatetime(datetimeText);
  return parsed.publishDate;
}

export function collectItemsForClassActivity(options?: CollectItemsOptions): Item[] {
  // Find the infinite-panel container first
  const wrapper = document.querySelector<HTMLDivElement>('div.infinite-panel.posts-container');
  if (!wrapper) {
    return [];
  }

  // Find all infinite-item panels
  const panels = wrapper.querySelectorAll<HTMLDivElement>('div.infinite-item.post');

  // Map panels to items and de-duplicate by link
  const linkMap = new Map<string, Item>();

  Array.from(panels).forEach((panel) => {
    // Extract data-rid and data-type
    const rid = panel.getAttribute('data-rid') || '';
    const type = (panel.getAttribute('data-type') || '') as 'album' | 'activity';

    // Find the album link from view-album anchor
    const albumLinkAnchor = panel.querySelector<HTMLAnchorElement>('a.view-album.post-title');
    if (!albumLinkAnchor) {
      return; // Skip if no link found
    }

    const rawLink = albumLinkAnchor.getAttribute('href') || '';
    const link = new URL(rawLink, location.origin).toString();

    // Extract title
    const title = (albumLinkAnchor.textContent || '').trim();

    // Only add if link doesn't exist yet (de-duplicate) and has required fields
    if (!linkMap.has(link) && rid && (type === 'album' || type === 'activity')) {
      const publishDate = extractPublishDateFromPanel(panel);

      linkMap.set(link, {
        link,
        title,
        publishDate,
        rid,
        type,
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
