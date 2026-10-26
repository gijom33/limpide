import { expect, test, type Page } from '@playwright/test';

// Issue 38: between a phone and a laptop, the four sections 2 × 2: Oscillators and Filter on top, Amp and
// LFO & Envelopes under them. A foldable opened flat (about 690 × 830, either way round) and a small tablet sit here;
// one stage a screen wide left the Oscillators alone on it.

const sections = ['Oscillators', 'Filter', 'Amp', 'LFO & Envelopes'];

async function boxes(page: Page) {
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  return page.evaluate((names) => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
    };
    return {
      // The sections, not the strip's tabs named after them.
      sections: names.map((name) => box(document.querySelector(`section[aria-label="${name}"]`)!)),
      scopes: [...document.querySelectorAll('canvas.scope')].map(box),
      spectra: [...document.querySelectorAll('canvas.spectrum')].map(box),
      sideways: document.documentElement.scrollWidth > innerWidth,
    };
  }, sections);
}

for (const [width, height] of [
  [601, 900],
  [690, 830],
  [768, 1024],
  [830, 690],
  [860, 700],
]) {
  test(`the sections sit 2 × 2 at ${width}×${height}, the Viewers of a row lined up`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const { sections: [osc, filter, amp, lfo], scopes, spectra, sideways } = await boxes(page);
    expect(sideways, 'no sideways scroll').toBe(false);
    // Two columns of the same width, two rows.
    expect(filter.top).toBe(osc.top);
    expect(filter.left).toBeGreaterThan(osc.right);
    expect(lfo.top).toBe(amp.top);
    expect(amp.left).toBe(osc.left);
    expect(lfo.left).toBe(filter.left);
    expect(amp.top).toBeGreaterThan(osc.top + osc.height - 1);
    expect(Math.abs(filter.width - osc.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(lfo.width - amp.width)).toBeLessThanOrEqual(1);
    // The Oscillators' and the Filter's Viewers line up; the Amp's are the same size.
    for (const row of [scopes, spectra]) {
      const [o, f, a] = row;
      expect(f.top).toBe(o.top);
      for (const other of [f, a]) {
        expect(Math.abs(other.width - o.width)).toBeLessThanOrEqual(1);
        expect(Math.abs(other.height - o.height)).toBeLessThanOrEqual(1);
      }
    }
  });
}

test('a phone keeps one section under another, with the strip; a laptop window keeps three stages across', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto('/');
  let { sections: [osc, filter] } = await boxes(page);
  expect(filter.top).toBeGreaterThan(osc.top + osc.height - 1);
  await page.setViewportSize({ width: 861, height: 900 });
  ({ sections: [osc, filter] } = await boxes(page));
  const amp = (await boxes(page)).sections[2];
  expect(filter.top).toBe(osc.top);
  expect(amp.top).toBe(osc.top);
});
