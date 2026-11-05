import { expect, type Page } from '@playwright/test';

/** Opens the Display panel (Freeze, Snapshot, axes, overlays) if it is not open already. */
export async function openDisplay(page: Page) {
  const button = page.getByRole('button', { name: 'Display' });
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeVisible();
}

/**
 * A slider by its visible label: its accessible name ends with it ("Attack" is "Filter Attack" or "Amp Attack", issue
 * 51), so look it up inside its section or LFO.
 */
export const sliderName = (label: string) => new RegExp(`(^| )${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

/**
 * Keeps the page's AudioContext within reach as `window.audioContext`, so a test can stop the sound as a browser does
 * (an iPhone, back from another app). Call before the page loads.
 */
export const reachAudio = (page: Page) =>
  page.addInitScript(() => {
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        (window as unknown as { audioContext: AudioContext }).audioContext = this;
      }
    };
  });

/** Stops the page's sound as the browser does when it takes it away (needs `reachAudio`). */
export const stopSound = (page: Page) =>
  page.evaluate(() => (window as unknown as { audioContext: AudioContext }).audioContext.suspend());


/**
 * Unfolds the Demo's card, which opens small and folded in three and four across (issue 230), so its parts' segments
 * are there to press; on a phone and in 2 × 2 it opens whole already.
 */
export async function wholeDemoCard(page: Page) {
  const card = page.getByRole('region', { name: 'Demo', exact: true });
  await expect(card.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
  const unfold = card.getByRole('button', { name: 'Unfold the card' });
  if (await unfold.isVisible()) await unfold.click();
  await expect(card.getByRole('button', { name: 'Fold the card' })).toBeVisible();
}
