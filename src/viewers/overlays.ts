/** Marks a learner can switch off when the Viewers get busy. */
export const OVERLAYS = ['harmonics', 'ideal', 'curve', 'ghost', 'guides'] as const;
export type Overlay = (typeof OVERLAYS)[number];
export type Overlays = Record<Overlay, boolean>;

export const DEFAULT_OVERLAYS: Overlays = { harmonics: true, ideal: true, curve: true, ghost: true, guides: true };

const KEY = 'synthview.overlays';

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function toggleOverlay(overlays: Overlays, overlay: Overlay): Overlays {
  return { ...overlays, [overlay]: !overlays[overlay] };
}

export function loadOverlays(storage: KeyValueStorage): Overlays {
  try {
    const saved: unknown = JSON.parse(storage.getItem(KEY) ?? '{}');
    const result = { ...DEFAULT_OVERLAYS };
    if (saved && typeof saved === 'object') {
      for (const o of OVERLAYS) {
        const v = (saved as Record<string, unknown>)[o];
        if (typeof v === 'boolean') result[o] = v;
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_OVERLAYS };
  }
}

export function saveOverlays(storage: KeyValueStorage, overlays: Overlays): void {
  try {
    storage.setItem(KEY, JSON.stringify(overlays));
  } catch {
    // Storage unavailable: the choice still applies for this visit.
  }
}
