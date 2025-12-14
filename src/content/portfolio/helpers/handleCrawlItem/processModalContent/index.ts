import { extractContent } from './extractContent';
import { extractImages } from './extractImages';
import { extractLearningArea } from './extractLearningArea';
import { extractStickers } from './extractStickers';
import { extractTeacherAndDate } from './extractTeacherAndDate';

import type { PortfolioItemDetails } from '@/shared/types/portfolio';

/**
 * Process modal content to extract portfolio item details
 * @param modal - The modal HTMLDivElement containing the carousel
 * @returns Portfolio item details with images and other metadata
 */
export function processModalContent(modal: HTMLDivElement): PortfolioItemDetails {
  // Query modalBody once and pass to all extraction functions
  const modalBody = modal.querySelector<HTMLDivElement>('.view-foliette-modal-body');

  const images = extractImages(modal);
  const content = extractContent(modalBody);
  const { teacher, publishDate } = extractTeacherAndDate(modalBody);
  const learningArea = extractLearningArea(modalBody);
  const stickers = extractStickers(modalBody);

  return {
    images,
    content,
    teacher,
    publishDate,
    learningArea,
    stickers,
  };
}
