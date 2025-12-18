/**
 * Check if there's more content to load by looking for infinite-more-link
 * @param wrapper - The infinite-panel wrapper element (or null to search document)
 * @returns true if infinite-more-link exists and has a valid href, false otherwise
 */
export function hasMoreContent(wrapper: HTMLElement | null = null): boolean {
  const searchRoot = wrapper || document;
  const moreLink = searchRoot.querySelector<HTMLAnchorElement>('a.infinite-more-link');

  if (!moreLink) {
    return false;
  }

  const href = moreLink.getAttribute('href') || '';
  return href.trim().length > 0;
}

