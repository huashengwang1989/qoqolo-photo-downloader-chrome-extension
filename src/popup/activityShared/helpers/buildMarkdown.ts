import type { Item } from '@/shared/types/item';

/**
 * Build markdown representation of an activity item.
 * This is shared between copy-to-clipboard and export (README.md).
 */
export function buildMarkdownFromItem(item: Item): string {
  const lines: string[] = [];

  lines.push(`## ${item.title || 'Untitled'}`);

  lines.push(''); // line break

  // --- Objectives ---

  // CommonTown App does not provide objectives.
  // It is to match the README.md format that is used for the Photo Album (another repo)
  lines.push('### Objectives');
  lines.push(''); // line break

  lines.push('N.A.');
  lines.push(''); // line break

  // --- Description ---

  lines.push('### Description');
  lines.push(''); // line break

  lines.push(item.details?.content || 'N.A.');
  lines.push(''); // line break

  // --- Developments ---

  lines.push('### Developments');
  lines.push(''); // line break

  if (item.details?.learningArea?.length) {
    for (const area of item.details.learningArea) {
      lines.push(`- ${area}`);
    }
  } else {
    lines.push('N.A.');
  }
  lines.push(''); // line break

  // --- Meta ---

  lines.push('### Meta');
  lines.push(''); // line break

  if (item.details?.teacher) {
    lines.push(`Teacher: ${item.details.teacher}`);
    lines.push(''); // line break
  }

  const publishDate = item.details?.publishDate || 'N.A.';
  const publishDatetime = item.details?.publishDatetime || publishDate;

  // CommonTown App does not record activity date like LittleLives.
  // System may only use the publish date for both activity and publish dates.
  // User may manually update it thereafter, for those that they know the activity date.

  lines.push(`Activity Timestamp: ${publishDatetime}`);
  lines.push(`Publish Timestamp: ${publishDate}`);
  lines.push(''); // line break

  // --- Stickers ---

  lines.push('### Stickers');
  lines.push(''); // line break

  if (item.details?.stickers?.length) {
    for (const sticker of item.details.stickers) {
      lines.push(`- ${sticker}`);
    }
  } else {
    lines.push('N.A.');
  }
  lines.push(''); // line break

  // --- Captions ---

  lines.push('### Captions');
  lines.push(''); // line break

  if (item.details?.images?.length) {
    for (const image of item.details.images) {
      const alt = image.caption || '';
      lines.push(`![${alt}](${image.exportFilename})`);
      lines.push(''); // line break
    }
  } else {
    lines.push('N.A.');
    lines.push(''); // line break
  }

  return lines.join('\n');
}
