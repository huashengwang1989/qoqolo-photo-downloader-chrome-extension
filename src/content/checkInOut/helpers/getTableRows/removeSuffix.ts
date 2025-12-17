/**
 * Remove suffix from string if it exists
 */
export function removeSuffix(originalString: string, suffix: string): string {
  if (suffix && originalString.endsWith(suffix)) {
    return originalString.slice(0, -suffix.length);
  }
  return originalString;
}

