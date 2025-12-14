/**
 * Extract learning areas from modal body
 * @param modalBody - The modal body HTMLDivElement
 * @returns Array of learning area strings
 */
export function extractLearningArea(modalBody: HTMLDivElement | null): string[] {
  if (!modalBody) {
    return [];
  }

  // Find all h5 elements
  const h5Elements = modalBody.querySelectorAll<HTMLHeadingElement>('h5');
  let learningAreaList: HTMLUListElement | null = null;

  // Find the h5 with "Learning Area" text (case-insensitive)
  for (const h5 of Array.from(h5Elements)) {
    const h5Text = (h5.textContent || '').trim().toLowerCase();
    if (h5Text === 'learning area') {
      // Find the next <ul> sibling after this h5
      let nextSibling: Element | null = h5.nextElementSibling;
      while (nextSibling) {
        if (nextSibling.tagName === 'UL') {
          learningAreaList = nextSibling as HTMLUListElement;
          break;
        }
        nextSibling = nextSibling.nextElementSibling;
      }
      break;
    }
  }

  if (!learningAreaList) {
    return [];
  }

  // Extract text content from all <li> elements
  const listItems = learningAreaList.querySelectorAll<HTMLLIElement>('li');
  const learningAreas: string[] = [];

  listItems.forEach((li) => {
    const text = (li.textContent || '').trim();
    if (text) {
      learningAreas.push(text);
    }
  });

  return learningAreas;
}
