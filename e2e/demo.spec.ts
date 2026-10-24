import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

const demo = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Demo' });
const patchName = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^Patch:/ });

test('the Demo tours one Preset per group, in order, making sound, and stops when a key is pressed', async ({ page }) => {
  test.setTimeout(60000);
  test.slow(); // waits for a phrase to end and the next Preset to load
  await page.goto('/');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(patchName(page)).toContainText('Init'); // the Start group's Preset, first
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /^-?[0-5]?\d(\.\d+)?$/, { timeout: 8000 }); // sound
  await expect(page.getByRole('group', { name: 'Piano' }).locator('[aria-pressed="true"]').first()).toBeVisible({ timeout: 8000 }); // the Notes show on the piano
  await expect(patchName(page)).toContainText('PWM Morph', { timeout: 15000 }); // Shapes, next
  await page.keyboard.press('a');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.up('a');
  const name = await patchName(page).textContent();
  await page.waitForTimeout(1500);
  expect(await patchName(page).textContent()).toBe(name); // the tour has stopped moving
});

test('the Demo never touches the Display settings, and a knob touch stops it', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('button', { name: 'Guides' }).click(); // a setting that is not the default
  await page.keyboard.press('Escape');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' }).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await openDisplay(page);
  await expect(page.getByRole('button', { name: 'Guides' })).toHaveAttribute('aria-pressed', 'true'); // untouched
  await expect(page.getByRole('radiogroup', { name: 'Viewers follow' }).getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
});

test.describe('on a touch screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test.skip(({ browserName }) => browserName !== 'chromium', 'drives real touches through the Chrome DevTools Protocol');

  /** A real finger: down, a few moves, up. Scrolls the page when the finger moves over a part that does not take touches itself. */
  async function swipe(page: import('@playwright/test').Page, x: number, fromY: number, toY: number) {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y: number) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', fromY);
    for (let i = 1; i <= 10; i++) await touch('touchMove', fromY + ((toY - fromY) * i) / 10);
    await touch('touchEnd', toY);
  }

  test('scrolling the page keeps the Demo playing; a tap stops it', async ({ page }) => {
    await page.goto('/');
    await demo(page).tap();
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
    const heading = (await page.getByRole('region', { name: 'Oscillators' }).getByRole('heading').first().boundingBox())!;
    await swipe(page, heading.x + 5, heading.y + 300, heading.y + 50);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100); // the page did scroll
    await page.waitForTimeout(300);
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' }).tap(); // a knob takes the touch at once
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
    await demo(page).tap();
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('region', { name: 'Oscillators' }).getByRole('heading').first().tap(); // a tap anywhere else, once lifted
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  });
});
