import type { Item } from '@/shared/types/item';

export interface CollectItemsOptions {
  maxCount?: number;
}

export function collectItems(options?: CollectItemsOptions): Item[] {
  // Find all infinite-item panels
  const panels = document.querySelectorAll<HTMLDivElement>(
    'div.infinite-panel.posts-container div.infinite-item.post',
  );

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
      linkMap.set(link, {
        link,
        title,
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
