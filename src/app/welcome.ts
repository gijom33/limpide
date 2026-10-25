import type { Library } from '../patch/library';

const WELCOMED = 'limpide.welcomed';

/** Which welcome About opens with: the Demo, or the sound someone shared. */
export type Welcome = 'demo' | 'shared';

/**
 * The welcome a visit opens with, if any. Only a brand-new browser gets one: no Last session, no saved Patches, and
 * no welcome closed before. Opened from a Share link, it is about the shared sound.
 */
export function welcomeFor(shared: boolean, storage: Pick<Storage, 'getItem'>, library: Library): Welcome | null {
  let welcomed = false;
  try {
    welcomed = storage.getItem(WELCOMED) !== null;
  } catch {
    // Storage refused: nothing was remembered, so this is a first visit.
  }
  if (welcomed || library.loadCurrent() !== undefined || library.list().length > 0) return null;
  return shared ? 'shared' : 'demo';
}

/** The welcome has closed, however it closed: it is not shown again. */
export function rememberWelcome(storage: Pick<Storage, 'setItem'>) {
  try {
    storage.setItem(WELCOMED, '1');
  } catch {
    // Storage refused: the next visit will be welcomed again.
  }
}
