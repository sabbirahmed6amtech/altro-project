/**
 * Generates a unique identifier suitable for file names and other unique keys.
 * Uses crypto.randomUUID() when available; falls back to a timestamp + random string.
 * @returns {string}
 */
export function generateUniqueId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
