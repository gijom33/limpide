import { expect, test, type Page } from '@playwright/test';

// Pitch has no knob, so its modulation shows on the piano (issue 21): a marker at the pitch the newest Note
// sounds at, between keys when it is between them. It slides with Glide and wobbles with an LFO on Pitch.

const piano = (page: Page) => page.getByRole('group', { name: 'Piano' });
const marker = (page: Page) => piano(page).locator('.pitch-marker');
const centre = async (page: Page, key: string) => {
  const box = (await piano(page).getByRole('button', { name: key, exact: true }).boundingBox())!;
  return box.x + box.width / 2;
};
/** The marker's centre; NaN while it is hidden. */
const markerX = async (page: Page) => {
  const box = await marker(page).boundingBox();
  return box ? box.x + box.width / 2 : NaN;
};
const listening = (page: Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

async function turnUp(page: Page, region: string, name: string, steps: number) {
  const slider = page.getByRole('region', { name: region }).getByRole('slider', { name, exact: true });
  await slider.evaluate(async (el, n) => {
    for (let i = 0; i < n; i++) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0)); // a tick for React to render each step
    }
  }, steps);
}

test('no marker while nothing sounds; a played Note puts it on its key, and it goes once the Release fades', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await expect(marker(page)).toBeHidden();
  await page.keyboard.down('KeyD'); // E4
  await expect(marker(page)).toBeVisible();
  await expect.poll(() => markerX(page)).toBeCloseTo(await centre(page, 'E4'), 0);
  await page.keyboard.up('KeyD');
  await expect(marker(page)).toBeHidden({ timeout: 3000 });
});

test('with Glide, the marker slides between the keys from the old Note to the new one', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'Amp', 'Glide', 38); // about a second (2 % a step, on a log scale)
  const c4 = await centre(page, 'C4');
  const c5 = await centre(page, 'C5');
  await page.keyboard.down('KeyA');
  await expect.poll(() => markerX(page)).toBeCloseTo(c4, 0);
  await page.keyboard.down('KeyK'); // C5, while C4 is still held: one Voice slides
  await page.waitForTimeout(150);
  const sliding = await markerX(page);
  expect(sliding).toBeGreaterThan(c4 + 4);
  expect(sliding).toBeLessThan(c5 - 4);
  await expect.poll(() => markerX(page), { timeout: 5000 }).toBeCloseTo(c5, 0);
});

test('an LFO on Pitch wobbles the marker around the key', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await page.getByRole('radiogroup', { name: 'LFO Destination' }).getByRole('radio', { name: 'Pitch' }).click();
  await turnUp(page, 'LFO & Envelopes', 'Depth', 100);
  await page.keyboard.down('KeyD');
  await expect(marker(page)).toBeVisible();
  const xs = new Set<number>();
  for (let i = 0; i < 10; i++) {
    xs.add(Math.round(await markerX(page)));
    await page.waitForTimeout(60);
  }
  expect(xs.size).toBeGreaterThan(2);
});

test('with reduced motion asked for, the marker sits on the Note: no wobble', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await listening(page);
  await page.getByRole('radiogroup', { name: 'LFO Destination' }).getByRole('radio', { name: 'Pitch' }).click();
  await turnUp(page, 'LFO & Envelopes', 'Depth', 100);
  await page.keyboard.down('KeyD');
  await expect(marker(page)).toBeVisible();
  const e4 = await centre(page, 'E4');
  for (let i = 0; i < 6; i++) {
    expect(await markerX(page)).toBeCloseTo(e4, 0);
    await page.waitForTimeout(60);
  }
});
