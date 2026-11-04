/**
 * What is drawn over the page, which Bead never stands under (issue 164): the docked cards (the Demo's, a Tutorial's, the
 * Tour's), the tips, the open panels and menus, the Preset's description and the Patch's plain words (issue 123). It
 * stays drawn under them, so it never covers their words or buttons. One list for Bead and its browser tests (issue 224).
 */
export const DOCKED = '.docked:not([hidden])';
export const PANELS = `${DOCKED}, .patch-about, .patch-words, .patch-panel, .destination-menu, .tutorial-menu-panel, .tempo-panel, .display-panel, .midi-panel, .learn-bar, .quick-setup`;
export const COVERS = `${PANELS}, .tooltip:not([hidden])`;
/**
 * The page's text, which it never stands over (issue 181): every label, readout and heading, as the boxes of its lines,
 * but what is drawn over it anyway (the cards, tips and panels) and what only a screen reader reads.
 */
export const NOT_TEXT = `.mascot, .visually-hidden, ${COVERS}`;
