import type { RememberedValue } from '../app/rememberedSettings';

/** How long after the page opens, or the About closes (the welcome among it), Bead comes in by itself (issue 150). */
export const BEAD_ENTRANCE_SECONDS = 3;

/**
 * Bead's rules (issues 115, 150): where it is (away, up on the page, or leaving, melting away), its switch in Display
 * (the lasting setting, remembered across visits), whether its own entrance is still to come this visit, and whether
 * the Notes sent it away for this visit.
 */
export interface Bead {
  presence: 'away' | 'up' | 'leaving';
  switch: RememberedValue<'bead'>;
  entranceDue: boolean;
  sentAway: boolean;
  /** How often it came back up once melted this visit (switched on again as it left), so the page draws it afresh. */
  comebacks: number;
}

/**
 * What moves it: B, E, A, D played by hand (`notes`), Display's switch, its own entrance a few seconds in, and its
 * melting done (`gone`).
 */
export type BeadEvent = 'notes' | 'switch on' | 'switch off' | 'entrance' | 'gone';

/** A visit starts with Bead away, to come in by itself unless it was switched off. */
export const beadOnArrival = (stored: RememberedValue<'bead'>): Bead => ({
  presence: 'away',
  switch: stored,
  entranceDue: true,
  sentAway: false,
  comebacks: 0,
});

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
      if (bead.presence === 'leaving') return bead;
      return { ...bead, presence: bead.presence === 'up' ? 'leaving' : 'up', entranceDue: false, sentAway: bead.presence === 'up' };
    case 'switch on':
      return { ...bead, presence: coming(bead), switch: 'on', entranceDue: false, sentAway: false };
    case 'switch off':
      return { ...bead, presence: leaving(bead), switch: 'off', entranceDue: false, sentAway: false };
    case 'entrance':
      return bead.entranceDue && bead.switch === 'on' ? { ...bead, presence: coming(bead), entranceDue: false } : { ...bead, entranceDue: false };
    case 'gone':
      if (bead.presence !== 'leaving') return bead;
      return bead.switch === 'on' && !bead.sentAway ? { ...bead, presence: 'up', comebacks: bead.comebacks + 1 } : { ...bead, presence: 'away' };
  }
}
