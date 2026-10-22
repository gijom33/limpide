import { expect, type Page } from '@playwright/test';

/** Opens the Display panel (Freeze, Snapshot, axes, overlays) if it is not open already. */
export async function openDisplay(page: Page) {
  const button = page.getByRole('button', { name: 'Display' });
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeVisible();
}
