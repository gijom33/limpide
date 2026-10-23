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
  it('offers Harmonic Markers, the Ideal Reference, the Response Curve and the Scope guides', () => {
    expect(OVERLAYS).toEqual(['harmonics', 'ideal', 'curve', 'guides']);
  });

  it('starts with the Harmonic Markers and the Response Curve on, the Ideal Reference and the guides off', () => {
    expect(DEFAULT_OVERLAYS).toEqual({ harmonics: true, ideal: false, curve: true, guides: false });
  });

  it('toggles one overlay without touching the others', () => {
    const next = toggleOverlay(DEFAULT_OVERLAYS, 'curve');
    expect(next.curve).toBe(false);
    expect(next.harmonics).toBe(true);
    expect(DEFAULT_OVERLAYS.curve).toBe(true);
  });

  it('remembers the choice across visits', () => {
    const storage = memoryStorage();
    saveOverlays(storage, toggleOverlay(DEFAULT_OVERLAYS, 'guides'));
    expect(loadOverlays(storage)).toEqual({ ...DEFAULT_OVERLAYS, guides: true });
  });

  it('falls back to defaults for anything missing or garbled in storage', () => {
    expect(loadOverlays(memoryStorage())).toEqual(DEFAULT_OVERLAYS);
    expect(loadOverlays(memoryStorage({ 'synthview.overlays': '{not json' }))).toEqual(DEFAULT_OVERLAYS);
    // "ghost" was an overlay once: a choice saved for it is simply ignored now.
    expect(loadOverlays(memoryStorage({ 'synthview.overlays': '{"guides":true,"ghost":false,"bogus":1,"curve":"yes"}' }))).toEqual({
      ...DEFAULT_OVERLAYS,
      guides: true,
    });
  });

  it('still works when storage itself is unavailable (private mode)', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(loadOverlays(broken)).toEqual(DEFAULT_OVERLAYS);
    expect(() => saveOverlays(broken, DEFAULT_OVERLAYS)).not.toThrow();
  });
});
