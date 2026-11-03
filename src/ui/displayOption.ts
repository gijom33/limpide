import type { Overlay } from '../viewers/overlays';

/** The Display button, which stands for an option in its panel while the panel is shut (issues 151, 158 and 210). */
export const DISPLAY_BUTTON = 'button[aria-label="Display"]';

/** A Display option's toggle on the page, by the overlay it shows. */
export const overlaySelector = (overlay: Overlay) => `[data-overlay="${overlay}"]`;

/** A Display option as the page shows it now: itself, or the Display button standing for it while its panel is shut. */
export const optionOrDisplay = (element: Element | null) => (element?.checkVisibility() ? element : document.querySelector(DISPLAY_BUTTON));
