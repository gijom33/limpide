import { describe, expect, it } from 'vitest';
import { DEFAULT_OVERLAYS, OVERLAYS, toggleOverlay } from './overlays';

describe('Viewer overlays', () => {
  it('offers Harmonic Markers, the Ideal Reference, the Response Curve and the Scope guides', () => {
    expect(OVERLAYS).toEqual(['harmonics', 'ideal', 'curve', 'guides', 'geek']);
  });

  it('starts with the Harmonic Markers, the Ideal Reference and the Response Curve on, the guides off', () => {
    expect(DEFAULT_OVERLAYS).toEqual({ harmonics: true, ideal: true, curve: true, guides: false, geek: false });
  });

  it('toggles one overlay without touching the others', () => {
    const next = toggleOverlay(DEFAULT_OVERLAYS, 'curve');
    expect(next.curve).toBe(false);
    expect(next.harmonics).toBe(true);
    expect(DEFAULT_OVERLAYS.curve).toBe(true);
  });
});
