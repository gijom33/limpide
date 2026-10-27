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
