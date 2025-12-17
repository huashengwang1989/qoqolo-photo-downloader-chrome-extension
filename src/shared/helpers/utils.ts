export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely send a message via chrome.runtime.sendMessage
 * Handles cases where runtime might not be available or context is invalid
 */
export function safeSendMessage(message: unknown): void {
  try {
    // Check if chrome.runtime exists and has a valid id
    if (
      typeof chrome !== 'undefined' &&
      chrome.runtime &&
      chrome.runtime.id &&
      typeof chrome.runtime.sendMessage === 'function'
    ) {
      chrome.runtime.sendMessage(message).catch(() => {
        // No listeners, that's okay
      });
    }
  } catch (error) {
    // Runtime might not be available or context is invalid, that's okay
    console.debug('[utils] Failed to send message (runtime unavailable):', error);
  }
}
