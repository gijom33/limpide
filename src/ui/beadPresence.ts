import type { DisplayValue } from '../app/displaySettings';

/** How long after the page opens, or the About closes (the welcome among it), Bead comes in by itself (issue 150). */
export const BEAD_ENTRANCE_SECONDS = 3;

/**
 * Bead's rules (issues 115, 150): where it is (away, up on the page, or leaving, melting away), its switch in Display
 * (the lasting setting, remembered across visits), whether its own entrance is still to come this visit, and whether
 * the Notes sent it away for this visit.
 */
export interface Bead {
  presence: 'away' | 'up' | 'leaving';
  switch: DisplayValue<'bead'>;
  entranceDue: boolean;
  sentAway: boolean;
}

/**
 * What moves it: B, E, A, D played by hand (`notes`), Display's switch, its own entrance a few seconds in, and its
 * melting done (`gone`).
 */
export type BeadEvent = 'notes' | 'switch on' | 'switch off' | 'entrance' | 'gone';

/** A visit starts with Bead away, to come in by itself unless it was switched off. */
export const beadOnArrival = (stored: DisplayValue<'bead'>): Bead => ({ presence: 'away', switch: stored, entranceDue: true, sentAway: false });

const leaving = (bead: Bead) => (bead.presence === 'up' ? 'leaving' : bead.presence);
const coming = (bead: Bead) => (bead.presence === 'away' ? 'up' : bead.presence);

/**
 * Bead after an event (issue 150, decisions 7 to 9). Display's switch is the lasting setting: off sends Bead away, on
 * brings it up. The Notes are for this visit only, and leave the switch alone, so a reload goes back to what the switch
 * says: with it on, they send Bead away when it is up and call it back when it is away, and while it melts they do
 * nothing; with it off, they do nothing at all, and Bead never appears until the switch is turned on. Once the person
 * has had a say, by the Notes or the switch, it no longer comes in by itself. Switched back on while it melts, it comes
 * back up once melted.
 */
export function beadAfter(bead: Bead, event: BeadEvent): Bead {
  switch (event) {
    case 'notes':
      if (bead.switch === 'off') return bead;
      if (bead.presence === 'away') return { ...bead, presence: 'up', entranceDue: false, sentAway: false };
      return bead.presence === 'up' ? { ...bead, presence: 'leaving', entranceDue: false, sentAway: true } : bead;
    case 'switch on':
      return { presence: coming(bead), switch: 'on', entranceDue: false, sentAway: false };
    case 'switch off':
      return { presence: leaving(bead), switch: 'off', entranceDue: false, sentAway: false };
    case 'entrance':
      return bead.entranceDue && bead.switch === 'on' ? { ...bead, presence: coming(bead), entranceDue: false } : { ...bead, entranceDue: false };
    case 'gone':
      return bead.presence === 'leaving' ? { ...bead, presence: bead.switch === 'on' && !bead.sentAway ? 'up' : 'away' } : bead;
  }
}
