/**
 * Scroll to an element's position smoothly
 * @param element - The DOM element to scroll to
 * @param offset - Optional offset in pixels (e.g., to account for fixed headers)
 */
export function scrollToElement(element: HTMLElement, offset: number = 0): void {
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const targetY = rect.top + scrollTop - offset;

  window.scrollTo({
    top: targetY,
    behavior: 'smooth',
  });
}

/**
 * Scroll to the end of the page smoothly
 */
export function scrollToEnd(): void {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth',
  });
}
