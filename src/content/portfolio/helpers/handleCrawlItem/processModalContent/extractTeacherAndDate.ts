/**
 * Extract teacher name from modal body
 * @param modalBody - The modal body HTMLDivElement
 * @returns Teacher name
 */
export function extractTeacherAndDate(modalBody: HTMLDivElement | null): {
  teacher: string;
} {
  let teacher = '';

  if (!modalBody) {
    return { teacher };
  }

  // Find the <hr> or <hr /> element
  const hrElement = modalBody.querySelector<HTMLHRElement>('hr');
  if (!hrElement) {
    return { teacher };
  }

  // Find the first <p class="top-lg"> that appears above the <hr> (the one immediately before it)
  // Walk backwards from the hr element to find the closest <p class="top-lg">
  let currentElement: Element | null = hrElement.previousElementSibling;
  let infoParagraph: HTMLParagraphElement | null = null;

  while (currentElement) {
    if (
      currentElement.tagName === 'P' &&
      currentElement.classList.contains('top-lg') &&
      currentElement.querySelector('span.text-muted')
    ) {
      infoParagraph = currentElement as HTMLParagraphElement;
      break;
    }
    currentElement = currentElement.previousElementSibling;
  }

  if (!infoParagraph) {
    return { teacher };
  }

  // Extract teacher name from <a> tag
  const teacherLink = infoParagraph.querySelector<HTMLAnchorElement>('a');
  if (teacherLink) {
    teacher = (teacherLink.textContent || '').trim();
  }

  return { teacher };
}
