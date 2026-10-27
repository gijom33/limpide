import type { KeyValueStorage } from '../app/storage';

const KEY = 'limpide.tutorialsFinished';

/** The Presets whose Tutorial has been played to the end in this browser. */
export function loadFinished(storage: KeyValueStorage): Set<string> {
  try {
    const saved: unknown = JSON.parse(storage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(saved) ? saved.filter((n): n is string => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveFinished(storage: KeyValueStorage, finished: ReadonlySet<string>): void {
  storage.setItem(KEY, JSON.stringify([...finished]));
}
