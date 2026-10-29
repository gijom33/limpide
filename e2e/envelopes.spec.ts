import { expect, test } from '@playwright/test';

const db = (page: import('@playwright/test').Page) =>
  page.getByLabel('Amp Scope', { exact: true }).getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));
const ready = (page: import('@playwright/test').Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

test('Hold keeps the Note sounding after the key is released, until Hold is switched off', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const hold = page.getByRole('button', { name: 'Hold' });
  await hold.click();
  await expect(hold).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.down('KeyA');
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await page.keyboard.up('KeyA');
  await page.waitForTimeout(1200); // well past the 400 ms Release
  expect(await db(page)).toBeGreaterThan(-40);

  await hold.click();
  await expect.poll(() => db(page)).toBeLessThan(-80);
});

test('the Envelope Timeline draws the Envelopes as they happen', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const timeline = page.getByLabel('Envelope Timeline', { exact: true }); // the plot's canvas
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(400);
  const inked = await timeline.evaluate((c: HTMLCanvasElement) => {
    const { data } = c.getContext('2d')!.getImageData(Math.floor(c.width * 0.9), 0, Math.floor(c.width * 0.1), c.height);
    return data.filter((v, i) => i % 4 === 3 && v > 0).length;
  });
  expect(inked).toBeGreaterThan(100);
  await page.keyboard.up('KeyA');
});

test('the Filter Envelope knobs wake up once Envelope Amount is turned away from zero', async ({ page }) => {
  await page.goto('/');
  const decay = page.getByRole('region', { name: 'Filter' }).locator('.knob', { has: page.getByRole('slider', { name: 'Decay' }) });
  await expect(decay).toHaveAttribute('data-inactive', 'true');
  const amount = page.getByRole('slider', { name: 'Amount' });
  await amount.focus();
  await page.keyboard.press('ArrowUp');
  await expect(amount).toHaveAttribute('aria-valuetext', '+0.2 oct');
  await expect(decay).not.toHaveAttribute('data-inactive');
});

test('the Envelope Timeline shows the Filter Envelope once its Amount is set, with its own key, rising and settling as the Note plays', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const panel = page.getByRole('region', { name: 'LFO & Envelopes' });
  const key = panel.locator('[data-mark="filterEnvelope"]');
  await expect(key).toBeHidden(); // Init's Amount is zero: the Envelope moves nothing (the owner, 2026-10-28)
  await page.getByRole('slider', { name: 'Filter Envelope Amount' }).press('ArrowUp');
  await expect(key).toHaveText('Filter Env'); // short on screen, whole for a screen reader
  await expect(key).toHaveAccessibleName('Filter Envelope');
  await expect(key).toBeVisible();
  const canvas = panel.locator('canvas');
  const level = () => canvas.getAttribute('data-filter-envelope').then(Number);
  await expect.poll(level).toBe(0); // no Note yet
  await page.getByRole('button', { name: 'Hold' }).click();
  await page.keyboard.down('KeyA');
  // Init's Filter Envelope settles at its Sustain, 30 %.
  await expect.poll(level, { timeout: 5000 }).toBeCloseTo(0.3, 1);
  await page.keyboard.up('KeyA');
});

test('an LFO on Volume leaves the Timeline’s Amp Envelope still (issue 53, reversed by the owner 2026-10-28)', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const lfo = page.getByRole('group', { name: 'LFO 1', exact: true });
  await lfo.getByRole('button', { name: /Destination:/ }).click();
  await lfo.getByRole('menuitemradio', { name: 'Volume' }).click();
  await lfo.getByRole('slider', { name: 'LFO 1 Depth' }).press('End');
  const level = () => page.getByRole('region', { name: 'LFO & Envelopes' }).locator('canvas').getAttribute('data-amp-level').then(Number);
  await page.getByRole('button', { name: 'Hold' }).click();
  await page.keyboard.down('KeyA');
  await expect.poll(level, { timeout: 5000 }).toBeCloseTo(0.7, 2); // Init's Amp Sustain
  const seen: number[] = [];
  for (let i = 0; i < 12; i++) {
    seen.push(await level());
    await page.waitForTimeout(60);
  }
  await page.keyboard.up('KeyA');
  // At full Depth the LFO (2 Hz) dips the sound to silence and back, twice a second; the Envelope drawn stays at its
  // Sustain.
  expect(Math.max(...seen) - Math.min(...seen), JSON.stringify(seen)).toBeLessThan(0.02);
});


test('a moved knob’s line alone, without a line for its own setting, its LFO 1 line still dashed (the owner, 2026-10-29)', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const lfo = page.getByRole('group', { name: 'LFO 1', exact: true });
  await lfo.getByRole('button', { name: /Destination:/ }).click();
  await lfo.getByRole('menuitemradio', { name: 'Volume' }).click();
  await lfo.getByRole('slider', { name: 'LFO 1 Depth' }).press('End');
  const canvas = page.getByLabel('Envelope Timeline', { exact: true });
  await expect(canvas).toHaveAttribute('data-shows', /volume/);
  // Each stroke of a few frames: its pen's alpha and dash pattern.
  const strokes = await canvas.evaluate(async (c: HTMLCanvasElement) => {
    const g = c.getContext('2d')!;
    const seen: { alpha: number; dash: number[] }[] = [];
    const stroke = g.stroke.bind(g);
    g.stroke = (...args: []) => {
      seen.push({ alpha: g.globalAlpha, dash: g.getLineDash() });
      stroke(...args);
    };
    await new Promise((done) => setTimeout(done, 300));
    return seen;
  });
  // Issue 71's faint line for the knob's own setting is gone: every stroke is drawn at full strength.
  expect(strokes.length).toBeGreaterThan(0);
  expect(strokes.filter((s) => s.alpha < 1)).toEqual([]);
  expect(strokes.some((s) => s.alpha === 1 && s.dash.join() === '5,3')).toBe(true);
});

// Issue 80 (the owner's bug, 2026-10-28): the Amp's Envelope row places its name as the Filter's does, beside its
// controls on phones and full-size windows, above them on compact ones, with faders as wide.
for (const [width, height] of [[360, 800], [390, 844], [760, 1000], [1100, 800], [1331, 800], [1440, 900], [1920, 1080]]) {
  test(`the Amp's Envelope row is laid out as the Filter's (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const layout = (stage: string) =>
      page.locator(`section[aria-label="${stage}"] .sub-block:has(.knobs-envelope)`).evaluate((row) => {
        const name = row.querySelector('h3')!.getBoundingClientRect();
        const first = row.querySelector('.knobs-envelope .knob')!.getBoundingClientRect();
        const fader = row.querySelector('.knobs-envelope .knob[data-kind="fader"]')!.getBoundingClientRect();
        return { beside: name.right <= first.left && name.bottom > first.top, faderWidth: Math.round(fader.width) };
      });
    expect(await layout('Amp')).toEqual(await layout('Filter'));
  });
}
