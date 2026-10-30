import { expect, test } from '@playwright/test';
import { midiPanel, openMidi, withFakeController } from './fakeMidi';

// Issue 47: the layout's loose ends.

for (const [width, height] of [[1440, 900], [2560, 1300], [690, 830], [601, 900], [1920, 1080]] as const) {
  test(`the MIDI panel opens under its own button, inside the window, at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const button = page.getByRole('button', { name: 'MIDI', exact: true });
    await button.click();
    const panel = (await page.getByRole('dialog', { name: 'MIDI' }).boundingBox())!;
    const own = (await button.boundingBox())!;
    expect(Math.abs(panel.x + panel.width - (own.x + own.width))).toBeLessThanOrEqual(1);
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.y).toBeGreaterThan(own.y + own.height);
  });
}

// Issue 105 (the 1.16.0 review): from 601 px the panel was as wide as its button, one word a line, its buttons cut.
for (const [width, height] of [[601, 900], [690, 830], [1440, 900], [1920, 1080]] as const) {
  test(`at ${width}×${height} the MIDI panel's content fits inside it, every word whole (issue 105)`, async ({ page }) => {
    await withFakeController(page);
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await openMidi(page);
    await expect(midiPanel(page).getByRole('radio', { name: '2 semitones', exact: true })).toBeVisible();
    const fit = await midiPanel(page).evaluate((panel) => {
      const box = panel.getBoundingClientRect();
      const outside = [...panel.querySelectorAll('*')]
        .filter((e) => e.getClientRects().length && !e.closest('.midi-mappings'))
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.left < box.left - 0.5 || r.right > box.right + 0.5;
        })
        .map((e) => e.textContent?.slice(0, 24));
      return { outside, width: Math.round(box.width), left: box.left, right: box.right, clipped: panel.scrollWidth > panel.clientWidth };
    });
    expect(fit.outside).toEqual([]);
    expect(fit.clipped).toBe(false);
    expect(fit.width).toBeGreaterThanOrEqual(300); // its sentences on lines of words, not a word a line
    expect(fit.left).toBeGreaterThanOrEqual(0);
    expect(fit.right).toBeLessThanOrEqual(width);
    for (const name of ['MIDI Learn', 'Quick Setup']) {
      const button = midiPanel(page).getByRole('button', { name, exact: true });
      expect(await button.evaluate((b) => b.scrollWidth <= b.clientWidth), name).toBe(true);
    }
  });
}

test('the Timeline’s legend stays inside its section at 870 px', async ({ page }) => {
  await page.setViewportSize({ width: 870, height: 900 });
  await page.goto('/');
  const section = (await page.getByRole('region', { name: 'LFO & Envelopes' }).boundingBox())!;
  const key = (await page.locator('.timeline-key').boundingBox())!;
  expect(key.x + key.width).toBeLessThanOrEqual(section.x + section.width);
});

test('the Patch name stays put when its changed dot appears', async ({ page }) => {
  await page.goto('/');
  const name = page.locator('.patch-name > span').first();
  const before = (await name.boundingBox())!.x;
  const cutoff = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
  await cutoff.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.patch-changed')).toBeVisible();
  expect((await name.boundingBox())!.x).toBeCloseTo(before, 0);
});

test('Tab meets the octave buttons as they stand: up, then down', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Safari tabs to buttons only when its settings ask it to');
  await page.goto('/');
  await page.getByRole('button', { name: 'Octave up' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Octave down' })).toBeFocused();
});

test('a mouse drag across the instrument selects nothing (the owner, 2026-10-27)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  // From the Amp's heading, across the sections and the Viewers, down into LFO & Envelopes.
  const from = (await page.getByRole('region', { name: 'Amp' }).getByRole('heading').first().boundingBox())!;
  await page.mouse.move(from.x - 4, from.y + 4);
  await page.mouse.down();
  await page.mouse.move(200, 880, { steps: 12 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
});

// The 1.12.1 review: the tooltips' anchors (issue 59) took the Scope's gap and gave each key entry a blank swatch.
test('the Scope and Spectrum keep their gap on a phone, and the Timeline key no blank before its entries', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/');
  const gap = await page.evaluate(() => {
    const scope = document.querySelector('[aria-label="Oscillator Scope"]')!.getBoundingClientRect();
    const spectrum = document.querySelector('[aria-label="Oscillator Spectrum"]')!.getBoundingClientRect();
    return Math.round(spectrum.top - scope.bottom);
  });
  expect(gap).toBe(8);
  const offsets = await page.evaluate(() =>
    [...document.querySelectorAll('.timeline-key [data-mark]')].map((mark) => Math.round(mark.getBoundingClientRect().left - mark.parentElement!.getBoundingClientRect().left)),
  );
  expect(offsets).toEqual([0]); // Init: the Amp Envelope alone, nothing else moving (issue 63)
});
