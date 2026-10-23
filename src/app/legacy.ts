/**
 * The app was called SynthView before it was Limpide. This is the one place that name survives, so that what it
 * saved under the old name is still found: browser storage, and Patch files it exported.
 */
export const FORMER_NAME = 'synthview';

export const STORAGE_SUFFIXES = ['patches', 'current', 'mappings', 'theme', 'overlays'] as const;

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Copies anything saved under the former name to the current one, once; later visits find it already there. */
export function migrateStorage(storage: KeyValueStorage, name = 'limpide'): void {
  try {
    for (const suffix of STORAGE_SUFFIXES) {
      const old = storage.getItem(`${FORMER_NAME}.${suffix}`);
      if (old !== null && storage.getItem(`${name}.${suffix}`) === null) storage.setItem(`${name}.${suffix}`, old);
    }
  } catch {
    // Storage unavailable (some private modes): nothing to migrate.
  }
}
