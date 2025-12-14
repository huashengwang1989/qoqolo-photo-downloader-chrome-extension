import type { PortfolioItem } from '@/shared/types/portfolio';

export interface CollectItemsOptions {
  maxCount?: number;
}

export function collectItems(options?: CollectItemsOptions): PortfolioItem[] {
  const anchors = document.querySelectorAll<HTMLAnchorElement>('div.media-body a.foliette-view');

  // Map anchors to items and de-duplicate by link
  const linkMap = new Map<string, PortfolioItem>();

  Array.from(anchors).forEach((a) => {
    const rawLink = a.getAttribute('data-href') || a.getAttribute('href') || '';
    const link = new URL(rawLink, location.origin).toString();

    // Only add if link doesn't exist yet (de-duplicate)
    if (!linkMap.has(link)) {
      linkMap.set(link, {
        link,
        title: a.getAttribute('data-label') || a.textContent?.trim() || '',
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
