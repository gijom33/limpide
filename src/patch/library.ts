import type { Patch } from './patch';
import { sanitizePatch } from './serialize';

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PATCHES = 'synthview.patches';
const CURRENT = 'synthview.current';

/**
 * Named Patches and the autosaved current one, kept in browser storage. Everything read back is sanitised (so
 * Patches from other versions load); garbled or unavailable storage behaves as empty and never throws.
 */
export function createLibrary(storage: KeyValueStorage) {
  const read = (key: string): unknown => {
    try {
      const text = storage.getItem(key);
      return text === null ? undefined : JSON.parse(text);
    } catch {
      return undefined;
    }
  };
  const write = (key: string, value: unknown) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable: the Patch still applies for this visit.
    }
  };
  const all = (): Record<string, unknown> => {
    const stored = read(PATCHES);
    return stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  };

  return {
    list(): { name: string; patch: Patch }[] {
      return Object.entries(all())
        .map(([name, patch]) => ({ name, patch: sanitizePatch(patch) }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    },
    get(name: string): Patch | undefined {
      const patch = all()[name];
      return patch === undefined ? undefined : sanitizePatch(patch);
    },
    save(name: string, patch: Patch) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('A Patch needs a name.');
      write(PATCHES, { ...all(), [trimmed]: patch });
    },
    remove(name: string) {
      const rest = all();
      delete rest[name];
      write(PATCHES, rest);
    },
    saveCurrent(patch: Patch) {
      write(CURRENT, patch);
    },
    loadCurrent(): Patch | undefined {
      const patch = read(CURRENT);
      return patch === undefined ? undefined : sanitizePatch(patch);
    },
  };
}

export type Library = ReturnType<typeof createLibrary>;
