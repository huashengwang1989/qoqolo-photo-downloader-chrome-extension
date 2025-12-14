import { formatDateToYYYYMMDD } from '@/shared/utils/date';

/**
 * Extract teacher name and publish date from modal body
 * @param modalBody - The modal body HTMLDivElement
 * @returns Object with teacher name and publish date (YYYY-MM-DD format)
 */
export function extractTeacherAndDate(modalBody: HTMLDivElement | null): {
  teacher: string;
  publishDate: string;
} {
  let teacher = '';
  let publishDate = '';

  if (!modalBody) {
    return { teacher, publishDate };
  }

  // Find the <hr> or <hr /> element
  const hrElement = modalBody.querySelector<HTMLHRElement>('hr');
  if (!hrElement) {
    return { teacher, publishDate };
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
    return { teacher, publishDate };
  }

  // Extract teacher name from <a> tag
  const teacherLink = infoParagraph.querySelector<HTMLAnchorElement>('a');
  if (teacherLink) {
    teacher = (teacherLink.textContent || '').trim();
  }

  // Extract date from spans (second span contains the date)
  const spans = infoParagraph.querySelectorAll<HTMLSpanElement>('span.text-muted');
  if (spans.length >= 2) {
    const dateSpan = spans[1];
    const dateText = (dateSpan.textContent || '').trim();
    publishDate = formatDateToYYYYMMDD(dateText);
  }

  return { teacher, publishDate };
}
