/**
 * Extract date from timestamp string
 */
export function extractDate(timestamp: string): string {
  const dateMatch = timestamp.match(/^(\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : '';
}

