import { describe, expect, it } from 'vitest';
import { DEFAULT_OVERLAYS, loadOverlays, OVERLAYS, saveOverlays, toggleOverlay } from './overlays';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => void (data[k] = v),
    data,
  };
}

describe('Viewer overlays', () => {
  it('offers Harmonic Markers, the Ideal Reference, the Response Curve, the Ghost and the Scope guides', () => {
    expect(OVERLAYS).toEqual(['harmonics', 'ideal', 'curve', 'ghost', 'guides']);
  });

  it('starts with everything on', () => {
    expect(Object.values(DEFAULT_OVERLAYS).every(Boolean)).toBe(true);
  });

  it('toggles one overlay without touching the others', () => {
    const next = toggleOverlay(DEFAULT_OVERLAYS, 'ghost');
    expect(next.ghost).toBe(false);
    expect(next.curve).toBe(true);
    expect(DEFAULT_OVERLAYS.ghost).toBe(true);
  });

  it('remembers the choice across visits', () => {
    const storage = memoryStorage();
    saveOverlays(storage, toggleOverlay(DEFAULT_OVERLAYS, 'ideal'));
    expect(loadOverlays(storage)).toEqual({ ...DEFAULT_OVERLAYS, ideal: false });
  });

  it('falls back to defaults for anything missing or garbled in storage', () => {
    expect(loadOverlays(memoryStorage())).toEqual(DEFAULT_OVERLAYS);
    expect(loadOverlays(memoryStorage({ 'synthview.overlays': '{not json' }))).toEqual(DEFAULT_OVERLAYS);
    expect(loadOverlays(memoryStorage({ 'synthview.overlays': '{"ghost":false,"bogus":1,"curve":"yes"}' }))).toEqual({
      ...DEFAULT_OVERLAYS,
      ghost: false,
    });
  });

  it('still works when storage itself is unavailable (private mode)', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(loadOverlays(broken)).toEqual(DEFAULT_OVERLAYS);
    expect(() => saveOverlays(broken, DEFAULT_OVERLAYS)).not.toThrow();
  });
});
