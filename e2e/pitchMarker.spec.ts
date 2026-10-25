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

test('no marker unless something moves the pitch; with Glide on, a Note puts it on its key until its Release fades', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await expect(marker(page)).toBeHidden();
  await page.keyboard.down('KeyD'); // E4, with nothing moving its pitch
  await page.waitForTimeout(300);
  await expect(marker(page)).toBeHidden();
  await page.keyboard.up('KeyD');
  await turnUp(page, 'Amp', 'Glide', 38);
  await page.keyboard.down('KeyD');
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
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(300);
  await expect(marker(page)).toBeHidden(); // aimed at Pitch, but at Depth 0
  await turnUp(page, 'LFO & Envelopes', 'Depth', 100);
  await expect(marker(page)).toBeVisible();
  const xs: number[] = [];
  for (let i = 0; i < 20; i++) {
    xs.push(await markerX(page));
    await page.waitForTimeout(40);
  }
  expect(new Set(xs.map(Math.round)).size).toBeGreaterThan(2);
  // At full Depth (a semitone each way) it swings across a black key's width, centred on the key.
  const black = (await piano(page).getByRole('button', { name: 'D#4', exact: true }).boundingBox())!.width;
  expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(black + 1);
  expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(black / 2);
  const e4 = await centre(page, 'E4');
  for (const x of xs) expect(Math.abs(x - e4)).toBeLessThanOrEqual(black / 2 + 1);
});

test('the marker sits low on the key, where a finger presses it: higher on a black key, ringed to stand out on each', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'Amp', 'Glide', 38);
  /** The ring's lightness, 0 (black) to 255 (white). */
  const ring = () => marker(page).evaluate((el) => Number(getComputedStyle(el).borderTopColor.match(/\d+/)![0]));
  const markerY = async () => {
    const box = (await marker(page).boundingBox())!;
    return box.y + box.height / 2;
  };
  const heights: Record<string, number> = {};
  for (const [code, key] of [['KeyA', 'C4'], ['KeyE', 'D#4']] as const) {
    await page.keyboard.down(code);
    await expect(marker(page)).toBeVisible();
    const box = (await piano(page).getByRole('button', { name: key, exact: true }).boundingBox())!;
    await expect.poll(() => markerX(page), { message: key }).toBeCloseTo(await centre(page, key), 0); // the Glide over
    const y = await markerY();
    heights[key] = y;
    expect(y, key).toBeGreaterThan(box.y + box.height / 2); // the lower half of the key
    expect(y, key).toBeLessThan(box.y + box.height);
    if (key === 'C4') {
      expect(await ring(), 'a dark ring on a white key').toBeLessThan(80);
      // Clear of the key's name: the dot ends above the name's letters.
      const name = (await piano(page).getByRole('button', { name: key, exact: true }).locator('span').boundingBox())!;
      const dot = (await marker(page).boundingBox())!;
      expect(dot.y + dot.height, 'clear of the name').toBeLessThanOrEqual(name.y + 2);
    }
    else expect(await ring(), 'a light ring on a black key').toBeGreaterThan(180);
    await page.keyboard.up(code);
    await expect(marker(page)).toBeHidden({ timeout: 3000 });
  }
  expect(heights['D#4'], 'higher on a black key').toBeLessThan(heights.C4 - 2);
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
