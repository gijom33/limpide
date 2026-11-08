import { expect, type Page, test } from '@playwright/test';
import { sliderName } from './helpers';

const lfo = (page: Page, n: 1 | 2 = 1) => page.getByRole('region', { name: 'LFO & Envelopes' }).getByRole('group', { name: `LFO ${n}`, exact: true });
const plot = (page: Page, n: 1 | 2 = 1) => page.getByRole('img', { name: new RegExp(`^LFO ${n}:`) });

/** Presses Page Up `steps` times on an LFO's knob: 10 % a press on its Depth, double on its Rate (issue 160). */
async function turnUp(page: Page, name: string, steps: number, n: 1 | 2 = 1) {
  await lfo(page, n).getByRole('slider', { name: sliderName(name) }).evaluate(async (el, count) => {
    for (let i = 0; i < count; i++) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0)); // a tick for React to render each step
    }
  }, steps);
}
/** How far the plotted line swings, top to bottom, in the plot's units. */
const swing = (page: Page, n: 1 | 2 = 1) =>
  plot(page, n).locator('.lfo-plot-line').evaluate((el) => {
    const ys = [...el.getAttribute('d')!.matchAll(/[ML]\S+ (\S+)/g)].map((m) => Number(m[1]));
    return Math.max(...ys) - Math.min(...ys);
  });

test('two LFOs sit in the LFO & Envelopes section, each with shape buttons, a destination and a plot of it moving', async ({ page }) => {
  await page.goto('/');
  for (const n of [1, 2] as const) {
    const shapes = lfo(page, n).getByRole('radiogroup', { name: `LFO ${n} Waveform` });
    await expect(shapes.getByRole('radio', { name: 'Sine' })).toHaveAttribute('aria-checked', 'true');
    expect(await shapes.getByRole('radio').evaluateAll((radios) => radios.map((r) => r.getAttribute('aria-label')))).toEqual(['Sine', 'Triangle', 'Square', 'Saw', 'Saw Down']);
    await expect(lfo(page, n).getByRole('button', { name: /Destination:/ })).toBeVisible();
    await expect(lfo(page, n).getByRole('img', { name: `LFO ${n}` })).toBeVisible(); // the plot shows; it picks nothing
  }
  await lfo(page, 2).getByRole('radiogroup', { name: 'LFO 2 Waveform' }).getByRole('radio', { name: 'Square' }).click();
  await expect(lfo(page, 2).getByRole('radio', { name: 'Square' })).toHaveAttribute('aria-checked', 'true');
  await expect(lfo(page, 1).getByRole('radio', { name: 'Sine' })).toHaveAttribute('aria-checked', 'true'); // LFO 1 untouched
});

test('each LFO is two rows: shape and destination above, Depth, Rate and its plot below', async ({ page }) => {
  await page.goto('/');
  for (const n of [1, 2] as const) {
    const top = async (name: RegExp | string) => (await lfo(page, n).getByRole(typeof name === 'string' ? 'slider' : 'button', { name }).first().boundingBox())!;
    const shapes = (await lfo(page, n).getByRole('radiogroup').boundingBox())!;
    const destination = await top(/Destination:/);
    const rate = await top('Rate');
    const depth = await top('Depth');
    const plotBox = (await plot(page, n).boundingBox())!;
    expect(Math.abs(shapes.y + shapes.height / 2 - (destination.y + destination.height / 2)), 'shape and destination on one row').toBeLessThan(4);
    expect(rate.y, 'the knobs below').toBeGreaterThan(shapes.y + shapes.height);
    expect(depth.x, 'Depth before Rate (the owner, 2026-10-28)').toBeLessThan(rate.x);
    expect(plotBox.y, 'the plot beside the knobs').toBeGreaterThan(shapes.y + shapes.height);
  }
});

test('an LFO’s Rate and plot wake up once its Depth is turned up', async ({ page }) => {
  await page.goto('/');
  for (const n of [1, 2] as const) {
    const rate = lfo(page, n).locator('.knob', { has: page.getByRole('slider', { name: 'Rate' }) });
    await expect(rate).toHaveAttribute('data-inactive', 'true');
    await expect(plot(page, n)).toHaveAttribute('data-inactive', 'true');
    await expect(plot(page, n).locator('svg')).toHaveCSS('opacity', '0.3');
    await lfo(page, n).getByRole('slider', { name: 'Depth' }).focus();
    await page.keyboard.press('ArrowUp');
    await expect(rate).not.toHaveAttribute('data-inactive');
    await expect(plot(page, n)).not.toHaveAttribute('data-inactive');
    await expect(plot(page, n).locator('svg')).toHaveCSS('opacity', '1');
  }
});

test('the LFO explains itself', async ({ page }) => {
  await page.goto('/');
  await lfo(page).getByRole('button', { name: /Destination:/ }).hover();
  await expect(page.getByRole('tooltip')).toContainText(/vibrato/i);
});

test('the LFO plot draws the LFO moving, from the Modulation model', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/); // listening
  await turnUp(page, 'Depth', 10);
  await page.keyboard.down('KeyA'); // sound starts with the first key, and with it the clock the LFO runs on
  const line = plot(page).locator('.lfo-plot-line');
  await expect(line).toHaveAttribute('d', /\d/);
  const before = await line.getAttribute('d');
  await expect.poll(() => line.getAttribute('d')).not.toBe(before);
  await page.keyboard.up('KeyA');
});

// The plot is one second long: 1 Hz is one period, 20 Hz twenty. (Two cycles of a 20 Hz LFO would scroll a third
// of a cycle per frame and read as noise, the wagon-wheel effect.)
test('the LFO plot shows one second: as many periods as the Rate in Hz', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await turnUp(page, 'Depth', 10);
  await page.keyboard.down('KeyA');
  // Peaks of the drawn line: points higher than both neighbours (y grows downwards).
  const peaks = () =>
    plot(page).locator('.lfo-plot-line').evaluate((el) => {
      const ys = [...el.getAttribute('d')!.matchAll(/[ML]\S+ (\S+)/g)].map((m) => Number(m[1]));
      return ys.filter((v, i) => i > 0 && i < ys.length - 1 && v < ys[i - 1] && v <= ys[i + 1]).length;
    });
  await expect.poll(peaks).toBe(2); // the default 2 Hz: two periods
  await turnUp(page, 'Rate', 10);
  await expect(lfo(page).getByRole('slider', { name: 'Rate' })).toHaveAttribute('aria-valuetext', '20 Hz');
  await expect.poll(peaks).toBe(20);
  await page.keyboard.up('KeyA');
});

test('the LFO plot shows the Depth as well as the Rate: flat at 0, half as tall at half Depth as at full', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await page.keyboard.down('KeyA');
  await expect(plot(page).locator('.lfo-plot-line')).toHaveAttribute('d', /\d/);
  expect(await swing(page)).toBe(0);
  await turnUp(page, 'Depth', 5); // 50 %
  await expect.poll(() => swing(page)).toBeGreaterThan(0);
  await page.waitForTimeout(1100); // a whole second at that Depth
  const half = await swing(page);
  await turnUp(page, 'Depth', 5); // 100 %
  await page.waitForTimeout(1100); // a time: a whole second at that Depth
  const full = await swing(page);
  expect(half / full).toBeCloseTo(0.5, 1);
  await page.keyboard.up('KeyA');
});

test('each LFO’s plot draws that LFO: LFO 2 turned up swings, LFO 1 left at 0 stays flat', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await page.keyboard.down('KeyA');
  await turnUp(page, 'Depth', 10, 2);
  await expect.poll(() => swing(page, 2)).toBeGreaterThan(10);
  expect(await swing(page, 1)).toBe(0);
  await page.keyboard.up('KeyA');
});

test('on a phone the LFOs carry no name beside them, so shape and destination share one row', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  for (const n of [1, 2]) {
    const lfo = page.getByRole('group', { name: `LFO ${n}`, exact: true });
    await expect(lfo.getByRole('heading', { name: `LFO ${n}` })).toBeHidden();
    const shapes = (await lfo.getByRole('radiogroup', { name: `LFO ${n} Waveform` }).boundingBox())!;
    const destination = (await lfo.locator('.destination-picker').boundingBox())!;
    expect(Math.abs(destination.y + destination.height / 2 - (shapes.y + shapes.height / 2)), `LFO ${n}`).toBeLessThan(2);
  }
});

test('each LFO has a Retrigger switch, off by default, kept in the Patch across a reload', async ({ page }) => {
  await page.goto('/');
  const one = page.getByRole('button', { name: 'LFO 1 Retrigger' });
  const two = page.getByRole('button', { name: 'LFO 2 Retrigger' });
  await expect(one).toHaveAttribute('aria-pressed', 'false');
  await expect(two).toHaveAttribute('aria-pressed', 'false');
  await two.click();
  await expect(two).toHaveAttribute('aria-pressed', 'true');
  await expect(one).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('limpide.current') ?? '')).toContain('"lfo2Retrigger":"note"');
  await page.reload();
  await expect(page.getByRole('button', { name: 'LFO 2 Retrigger' })).toHaveAttribute('aria-pressed', 'true');
});

test('a synced Rate reads its note value alone, and turning it or switching Sync moves nothing beside it (issue 176)', async ({ page }) => {
  await page.goto('/');
  const rate = lfo(page).getByRole('slider', { name: 'LFO 1 Rate' });
  const readout = lfo(page).locator('.knob', { has: page.getByRole('slider', { name: 'LFO 1 Rate' }) }).locator('.knob-value > :first-child');
  const sync = lfo(page).getByRole('button', { name: 'LFO 1 Sync' });
  const neighbours = [
    lfo(page).getByRole('slider', { name: 'LFO 1 Depth' }),
    lfo(page).getByRole('button', { name: 'LFO 1 Retrigger' }),
    sync,
    plot(page),
    lfo(page, 2).getByRole('slider', { name: 'LFO 2 Depth' }),
    lfo(page, 2).getByRole('slider', { name: 'LFO 2 Rate' }),
  ];
  // Where each sits in the section, so a click that scrolls the page moves none of them.
  const section = page.getByRole('region', { name: 'LFO & Envelopes' });
  const places = async () => {
    const origin = (await section.boundingBox())!;
    const width = (await readout.locator('..').boundingBox())!.width; // the readout's own, kept as the knob's may not be
    return [`readout ${Math.round(width)}`, ...(await Promise.all(neighbours.map(async (n) => {
      const { x, y } = (await n.boundingBox())!;
      return `${Math.round(x - origin.x)},${Math.round(y - origin.y)}`;
    })))];
  };
  const before = await places();
  await sync.click();
  await expect(readout).toHaveText('1/4');
  expect(await places(), 'Sync on').toEqual(before);
  await rate.focus();
  await page.keyboard.press('Home');
  await expect(readout).toHaveText('4 bars D');
  const seen = new Set<string>();
  for (let i = 0; i < 24; i++) {
    const text = (await readout.textContent())!;
    expect(text, 'the note value alone').not.toMatch(/Hz/);
    seen.add(text);
    expect(await places(), text).toEqual(before);
    await page.keyboard.press('ArrowUp');
  }
  expect(seen.size, 'every note value').toBe(24);
  await sync.click();
  await expect(readout).toHaveText(/Hz$/);
  expect(await places(), 'Sync off').toEqual(before);
  await rate.focus();
  for (const key of ['Home', 'End']) {
    await page.keyboard.press(key);
    expect(await places(), `Hz at ${key}`).toEqual(before);
  }
});
