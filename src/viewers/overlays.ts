/** Marks a learner can switch off when the Viewers get busy, and the Maths Layer (issue 14). */
export const OVERLAYS = ['harmonics', 'ideal', 'curve', 'guides', 'maths'] as const;
export type Overlay = (typeof OVERLAYS)[number];
export type Overlays = Record<Overlay, boolean>;

/** What a first visit shows: the Harmonic Markers, the Ideal Reference (the owner, 2026-10-28) and the Response
 *  Curve. The Scope guides and the Maths Layer are there to be asked for, so the Viewers start uncluttered. */
export const DEFAULT_OVERLAYS: Overlays = { harmonics: true, ideal: true, curve: true, guides: false, maths: false };

export function toggleOverlay(overlays: Overlays, overlay: Overlay): Overlays {
  return { ...overlays, [overlay]: !overlays[overlay] };
}
