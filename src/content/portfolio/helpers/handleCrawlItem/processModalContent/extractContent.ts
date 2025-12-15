/**
 * Extract content text from modal body
 * @param modalBody - The modal body HTMLDivElement
 * @returns Content text with <br> tags converted to "\n\n"
 */
export function extractContent(modalBody: HTMLDivElement | null): string {
  if (!modalBody) {
    return '';
  }

  // Extract content from first <p> tag
  const firstParagraph = modalBody.querySelector<HTMLParagraphElement>('p:first-of-type');
  if (!firstParagraph) {
    return '';
  }

  // Clone to avoid modifying the original
  const clonedP = firstParagraph.cloneNode(true) as HTMLParagraphElement;
  // Replace <br> tags with "\n", but if <br> is immediately before "\n", just remove it
  clonedP.querySelectorAll('br').forEach((br) => {
    const nextSibling = br.nextSibling;
    // Check if next sibling is a text node that starts with "\n"
    if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
      const textContent = nextSibling.textContent || '';
      if (textContent.startsWith('\n')) {
        // Just remove the <br> since there's already a newline
        br.remove();
        return;
      }
    }
    // Otherwise, replace <br> with "\n"
    br.replaceWith('\n');
  });

  return clonedP.textContent?.trim() || '';
}
