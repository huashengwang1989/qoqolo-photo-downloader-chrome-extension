/**
 * Add query parameters to a URL
 * @param url - Original URL
 * @param params - Parameters to add/update
 * @returns New URL with updated query parameters
 */
export function addQueryParams(url: string, params: Record<string, string>): string {
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });
  return urlObj.toString();
}
