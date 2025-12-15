import type { PortfolioItem } from '@/shared/types/portfolio';

/**
 * Generate activity folder/zip name in format: yyyy_mm_dd {title} {teacher first word}
 * @param item - Portfolio item
 * @param maxLength - Maximum length (default: 200)
 * @returns Sanitized folder/zip name
 */
export function generateActivityFolderName(item: PortfolioItem, maxLength = 200): string {
  // Format date: YYYY-MM-DD -> yyyy_mm_dd
  const publishDate = item.details?.publishDate || new Date().toISOString().split('T')[0];
  const dateStr = publishDate.replace(/-/g, '_'); // 2025-08-25 -> 2025_08_25

  // Get title (default to "Untitled")
  const title = item.title || 'Untitled';

  // Get teacher's first word (default to empty)
  const teacher = item.details?.teacher || '';
  const teacherFirstWord = teacher.trim().split(/\s+/)[0] || '';

  // Build base name: "yyyy_mm_dd {title} {teacher first word}"
  const parts: string[] = [dateStr];
  if (title) {
    parts.push(title);
  }
  if (teacherFirstWord) {
    parts.push(`[${teacherFirstWord}]`);
  }

  let baseName = parts.join(' ');

  // Convert all non-regular whitespaces to regular whitespaces
  // Non-regular whitespaces include: \u00A0 (non-breaking space), \u2000-\u200B (various spaces), etc.
  baseName = baseName.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ');

  // Reduce consecutive whitespaces to one
  baseName = baseName.replace(/\s+/g, ' ');

  // Trim whitespaces at ends
  baseName = baseName.trim();

  // Replace illegal characters (Windows: < > : " / \ | ? * and Mac: : /) with "_"
  // Windows illegal: < > : " / \ | ? *
  // Mac illegal: : /
  baseName = baseName.replace(/[<>:"/\\|?*]/g, '_');

  // If too long, shrink the title part end part to "..."
  if (baseName.length > maxLength) {
    // Keep date part and teacher part, truncate title in the middle
    const datePart = dateStr;
    const teacherPart = teacherFirstWord ? ` [${teacherFirstWord}]` : '';
    const dateAndTeacherLength = datePart.length + teacherPart.length + 1; // +1 for space

    if (dateAndTeacherLength + 3 >= maxLength) {
      // If date + teacher already too long, just truncate everything
      baseName = baseName.substring(0, maxLength - 3) + '...';
    } else {
      // Calculate available space for title
      const availableSpace = maxLength - dateAndTeacherLength - 3; // -3 for "..."
      const titlePart = title.substring(0, availableSpace);
      baseName = `${datePart} ${titlePart}...${teacherPart}`;
    }
  }

  return baseName;
}
