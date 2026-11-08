import { expect, type Page, test } from '@playwright/test';
import { frames } from './helpers';
import { FIRST_VISIT } from './startState';

// A brand-new browser: not even the welcome the other tests start past.
test.use({ storageState: FIRST_VISIT });

const about = (page: Page) => page.getByRole('dialog', { name: 'Limpide' });
const demo = (page: Page) => page.getByRole('button', { name: 'Demo' });
const db = (page: Page) =>
  page.getByLabel('Amp Scope', { exact: true }).getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));

test('a first visit opens on the welcome; Play the Demo starts it, sound and all; a second visit opens on the synth', async ({ page }) => {
  await page.goto('/');
  await expect(about(page)).toBeVisible();
  // The ways in, at the bottom (the owner, 2026-10-27): the Demo, the Tour (issue 128); a × in the corner closes it (issue 209).
  await expect(about(page).locator('.about-actions').getByRole('button')).toHaveText(['Play the Demo', 'Take the Tour']);
  await about(page).getByRole('button', { name: 'Play the Demo' }).click();
  await expect(about(page)).toBeHidden();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  // No key was pressed: the button's click alone unlocked the audio.
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);

  await page.reload();
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await expect(about(page)).toBeHidden();
});

test('the welcome is remembered however it closes: its ×, Escape or a click outside', async ({ browser }) => {
  for (const close of ['×', 'Escape', 'outside'] as const) {
    const context = await browser.newContext({ storageState: FIRST_VISIT });
    const page = await context.newPage();
    await page.goto('/');
    await expect(about(page), close).toBeVisible();
    if (close === '×') await about(page).getByRole('button', { name: 'Close About' }).click();
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

// Issue 105 (the 1.16.0 review): on a 393 × 659 phone the credits pushed the three buttons below the fold, with no
// hint that the card scrolled. The published site adds a Privacy paragraph the tests' build leaves out: 393 × 540
// stands in for it.
test.describe('on a short phone', () => {
  test.use({ hasTouch: true });
  for (const height of [659, 540]) {
    test(`at 393 × ${height} the welcome's buttons and its × are on the first screen, the credits scrolling above them (issue 105)`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height });
      await page.goto('/');
      for (const name of ['Play the Demo', 'Take the Tour', 'Close About']) {
        await expect(about(page).getByRole('button', { name, exact: true }), name).toBeInViewport({ ratio: 1 });
      }
      const credits = about(page).locator('.about-credits');
      // What does not fit scrolls inside the credits, faded at the foot while more is below, and only there.
      const scrolls = await credits.evaluate((dl) => dl.scrollHeight > dl.clientHeight);
      if (scrolls) {
        await expect(credits).toHaveAttribute('data-more');
        expect(await credits.evaluate((dl) => getComputedStyle(dl).maskImage)).toContain('gradient');
        await credits.evaluate((dl) => dl.scrollTo({ top: dl.scrollHeight }));
        await expect(credits).not.toHaveAttribute('data-more');
      }
      expect(await about(page).evaluate((d) => d.scrollHeight <= d.clientHeight)).toBe(true);
    });
  }
});

// Issue 252: the focus the welcome gives the Demo button as it closes opens no tip there, over the Amp: only hover or
// the keyboard's own move (Tab) opens one, not a press, Enter or Escape.
test.describe('the welcome closed leaves no tip open on the Demo button (issue 252)', () => {
  const demoTip = (page: Page) => page.getByRole('tooltip').filter({ hasText: 'Turn a knob or flip a switch while it plays' });
  for (const close of ['Play the Demo', 'Enter on Play the Demo', 'Escape'] as const) {
    test(`closed by ${close}`, async ({ page }) => {
      await page.goto('/');
      await expect(about(page)).toBeVisible();
      if (close === 'Escape') await page.keyboard.press('Escape');
      else if (close === 'Enter on Play the Demo') {
        await about(page).getByRole('button', { name: 'Play the Demo', exact: true }).focus();
        await page.keyboard.press('Enter');
      } else await about(page).getByRole('button', { name: 'Play the Demo', exact: true }).click();
      await expect(about(page)).toBeHidden();
      await expect(demo(page)).toBeFocused();
      await frames(page); // a tip the focus opened would be open by then
      // None on the Demo button (WebKit may show a hover tip under the pointer where the welcome was).
      await expect(demoTip(page)).toHaveCount(0);
      // The keyboard's own move still shows it: Tab on, and Shift+Tab back.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(demo(page)).toBeFocused();
      await expect(demoTip(page)).toBeVisible();
    });
  }
});
