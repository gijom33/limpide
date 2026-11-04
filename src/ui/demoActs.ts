import type { Act } from './mascotMotion';

/** The Demo's acts, in turn (issue 127): conducting, the air guitar on its tail, surfing an LFO's plot. */
const ACTS: readonly Act[] = ['conduct', 'airGuitar', 'surf'];

/**
 * Bead's act through each Demo part (issues 127 and 204): each new part takes the next act after the last part's, in
 * the order conducting, the air guitar, surfing; a Demo begun starts conducting. Surfing goes only where an LFO plot is
 * clear and its LFO on (`surfable`): a part on surfing's turn conducts until one is, and one that never surfed counts as
 * conducting, so the next part plays the air guitar (the owner, 2026-11-03). `act` is asked each frame, with the part
 * playing (null out of the Demo).
 */
export function createDemoActs() {
  let part: number | null = null;
  let turn: Act | null = null;
  let surfed = false;
  return {
    act(playing: number | null, surfable: boolean): Act | null {
      if (playing === null) {
        part = turn = null;
        return null;
      }
      if (playing !== part) {
        const last = turn === 'surf' && !surfed ? 'conduct' : turn;
        turn = last === null ? ACTS[0] : ACTS[(ACTS.indexOf(last) + 1) % ACTS.length];
        part = playing;
        surfed = false;
      }
      if (turn !== 'surf') return turn;
      if (surfable) surfed = true;
      return surfable ? 'surf' : 'conduct';
    },
  };
}
