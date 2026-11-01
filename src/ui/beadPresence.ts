import type { DisplayValue } from '../app/displaySettings';

/** How long after the page opens, or the About closes (the welcome among it), Bead comes in by itself (issue 150). */
export const BEAD_ENTRANCE_SECONDS = 3;

/**
 * Bead's rules (issues 115, 150): where it is (away, up on the page, or leaving, melting away), its switch in Display,
 * and whether its own entrance is still to come this visit.
 */
export interface Bead {
  presence: 'away' | 'up' | 'leaving';
  switch: DisplayValue<'bead'>;
  entranceDue: boolean;
}

/**
 * What moves it: B, E, A, D played by hand (`notes`), Display's switch, its own entrance a few seconds in, and its
 * melting done (`gone`).
 */
export type BeadEvent = 'notes' | 'switch on' | 'switch off' | 'entrance' | 'gone';

/** A visit starts with Bead away, to come in by itself unless it was switched off. */
export const beadOnArrival = (stored: DisplayValue<'bead'>): Bead => ({ presence: 'away', switch: stored, entranceDue: true });

const sentAway = (bead: Bead): Bead => ({ presence: bead.presence === 'up' ? 'leaving' : bead.presence, switch: 'off', entranceDue: false });
const calledUp = (bead: Bead): Bead => ({ presence: bead.presence === 'away' ? 'up' : bead.presence, switch: 'on', entranceDue: false });

/**
 * Bead after an event. The Notes call it when it is away and send it away when it is up, the switch following, so a
 * reload keeps what they did; while it melts they do nothing. Once the person has had a say, by the Notes or the
 * switch, it no longer comes in by itself. Switched back on while it melts, it comes back up once melted.
 */
export function beadAfter(bead: Bead, event: BeadEvent): Bead {
  switch (event) {
    case 'notes':
      if (bead.presence === 'away') return calledUp(bead);
      return bead.presence === 'up' ? sentAway(bead) : bead;
    case 'switch on':
      return calledUp(bead);
    case 'switch off':
      return sentAway(bead);
    case 'entrance':
      return bead.entranceDue && bead.switch === 'on' ? calledUp(bead) : { ...bead, entranceDue: false };
    case 'gone':
      return bead.presence === 'leaving' ? { ...bead, presence: bead.switch === 'on' ? 'up' : 'away' } : bead;
  }
}
