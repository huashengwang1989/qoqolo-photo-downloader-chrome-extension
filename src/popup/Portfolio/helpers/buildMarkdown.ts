import type { PortfolioItem } from '@/shared/types/portfolio';

/**
 * Build markdown representation of a portfolio item.
 * This is shared between copy-to-clipboard and export (README.md).
 */
export function buildMarkdownFromItem(item: PortfolioItem): string {
  const lines: string[] = [];

  lines.push(`# ${item.title || 'Untitled'}\n`);

  if (item.details?.teacher || item.details?.publishDate) {
    const metaParts: string[] = [];
    if (item.details.teacher) {
      metaParts.push(`**Teacher:** ${item.details.teacher}`);
    }
    if (item.details.publishDate) {
      metaParts.push(`**Date:** ${item.details.publishDate}`);
    }
    lines.push(metaParts.join(' · '));
  }

  lines.push('');
  lines.push(`**Link:** ${item.link}`);

  if (item.details?.content) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(item.details.content);
  }

  if (item.details?.learningArea?.length) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('**Learning Area**');
    for (const area of item.details.learningArea) {
      lines.push(`- ${area}`);
    }
  }

  if (item.details?.stickers?.length) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('**Stickers**');
    lines.push(item.details.stickers.join(', '));
  }

  if (item.details?.images?.length) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('**Images**');
    for (const image of item.details.images) {
      const alt = image.caption || 'Image';
      lines.push(`- ![${alt}](${image.url})`);
    }
  }

  return lines.join('\n');
}
