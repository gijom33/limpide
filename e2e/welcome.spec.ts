import { expect, type Page, test } from '@playwright/test';

// A brand-new browser: nothing stored, not even the welcome the other tests start past.
test.use({ storageState: { cookies: [], origins: [] } });

const about = (page: Page) => page.getByRole('dialog', { name: 'Limpide' });
const demo = (page: Page) => page.getByRole('button', { name: 'Demo' });
const db = (page: Page) =>
  page.getByLabel('Amp Scope', { exact: true }).getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));

test('a first visit opens on the welcome; Play the Demo starts it, sound and all; a second visit opens on the synth', async ({ page }) => {
  await page.goto('/');
  await expect(about(page)).toBeVisible();
  await expect(about(page).getByRole('button', { name: 'Explore' })).toBeVisible();
  await about(page).getByRole('button', { name: 'Play the Demo' }).click();
  await expect(about(page)).toBeHidden();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  // No key was pressed: the button's click alone unlocked the audio.
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);

  await page.reload();
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await expect(about(page)).toBeHidden();
});

test('the welcome is remembered however it closes: Explore, Escape or a click outside', async ({ browser }) => {
  for (const close of ['Explore', 'Escape', 'outside'] as const) {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(about(page), close).toBeVisible();
    if (close === 'Explore') await about(page).getByRole('button', { name: 'Explore' }).click();
    else if (close === 'Escape') await page.keyboard.press('Escape');
    else await page.mouse.click(5, 5);
    await expect(about(page), close).toBeHidden();
    await expect(demo(page), close).toHaveAttribute('aria-pressed', 'false'); // exploring plays nothing
    await page.reload();
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    await expect(about(page), close).toBeHidden();
    await context.close();
  }
});

test('opened from a Share link, the welcome says a sound was shared and plays the Demo’s riff on it', async ({ page }) => {
  const cutoff = page.getByRole('slider', { name: 'Cutoff', exact: true });
  await page.goto(`/#p=${Buffer.from(JSON.stringify({ cutoff: 600, waveform: 'square' })).toString('base64url')}`);
  await expect(about(page)).toContainText('Someone shared a sound with you');
  const shared = await cutoff.getAttribute('aria-valuetext');
  await about(page).getByRole('button', { name: 'Play the shared sound' }).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await expect(page.getByRole('group', { name: 'Piano' }).locator('[aria-pressed="true"]').first()).toBeVisible({ timeout: 8000 });
  // The shared sound, untouched: no Preset loaded, no knob turned.
  await expect(page.getByRole('button', { name: /^Patch/ })).toContainText('Shared Patch');
  await expect(cutoff).toHaveAttribute('aria-valuetext', shared!);
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false', { timeout: 15000 }); // one riff, then it stops
  await expect(page.getByRole('button', { name: /^Patch/ })).toContainText('Shared Patch');
});
