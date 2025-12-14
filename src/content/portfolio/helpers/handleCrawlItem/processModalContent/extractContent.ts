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
  // Replace <br> tags with "\n\n"
  clonedP.querySelectorAll('br').forEach((br) => {
    br.replaceWith('\n');
  });

  return clonedP.textContent?.trim() || '';
}
