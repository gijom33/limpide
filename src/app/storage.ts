/** What the app keeps between visits, by key. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * The browser's storage, made never to throw. A browser may refuse it outright (a privacy setting, some in-app
 * browsers: even reading `localStorage` throws) or refuse a write (a full quota). Then nothing is kept, and the app
 * still works for this visit (issue 46: the page was blank).
 */
export function safeStorage(): KeyValueStorage {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    // Refused: everything below keeps nothing.
  }
  return {
    getItem(key) {
      try {
        return storage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        storage?.setItem(key, value);
      } catch {
        // Full or refused: kept for this visit only.
      }
    },
  };
}
