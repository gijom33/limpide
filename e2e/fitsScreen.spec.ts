import { expect, test } from '@playwright/test';

// Full-screen browser viewports on MacBooks (points): this Mac (1710×1107, less the ~37 pt notch band, with a
// margin), and the common 1440×900.
// How tall each Viewer must at least be: generous on this Mac; the 78 pt floor on the smaller 1440×900, where
// the toolbar wraps under the title and Osc 2's knobs wrap.
for (const [width, height, minViewer] of [
  [1710, 1060, 150],
  [1440, 900, 78],
]) {
  test(`the whole app fits a ${width}×${height} screen without scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
    const { scrollHeight, timelineBottom, viewport } = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      timelineBottom: document.querySelector('.timeline')!.getBoundingClientRect().bottom,
      viewport: innerHeight,
    }));
    expect(scrollHeight).toBeLessThanOrEqual(viewport);
    expect(timelineBottom).toBeLessThanOrEqual(viewport);
  });

  test(`the Viewers stay usefully large at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLCanvasElement>('canvas.scope, canvas.spectrum')].map((c) => c.getBoundingClientRect().height),
    );
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(minViewer);
  });
}

for (const [width, height] of [
  [1710, 1060],
  [1440, 900],
  [1100, 800],
  [872, 920],
]) {
  test(`the three stages' Viewers are the same size and line up (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
    const boxes = await page.evaluate(() =>
      ['scope', 'spectrum'].map((kind) =>
        [...document.querySelectorAll<HTMLCanvasElement>(`canvas.${kind}`)].map((c) => {
          const r = c.getBoundingClientRect();
          return { kind, top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
        }),
      ),
    );
    for (const row of boxes) {
      const [first, ...rest] = row;
      for (const other of rest) {
        expect(Math.abs(other.height - first.height), `${first.kind} height`).toBeLessThanOrEqual(1);
        expect(Math.abs(other.width - first.width), `${first.kind} width`).toBeLessThanOrEqual(1);
        expect(Math.abs(other.top - first.top), `${first.kind} top`).toBeLessThanOrEqual(1);
      }
    }
  });
}

for (const [width, height] of [
  [872, 920],
  [960, 800],
  [1100, 800],
  [1300, 900],
  [1710, 1060],
]) {
  test(`nothing spills out of place at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
    const problems = await page.evaluate(() => {
      const found: string[] = [];
      const box = (el: Element) => el.getBoundingClientRect();
      for (const block of document.querySelectorAll('.block')) {
        const b = box(block);
        // The canvases themselves, not just their container: a collapsed container can sit inside while they spill.
        for (const part of block.querySelectorAll('.block-controls, .tap figcaption, canvas')) {
          const r = box(part);
          if (r.bottom > b.bottom + 1 || r.top < b.top - 1) found.push(`${block.getAttribute('aria-label')}: ${part.className} outside its block`);
        }
      }
      if (box(document.querySelector('.chain')!).bottom > box(document.querySelector('.timeline')!).top + 1) found.push('stages overlap the Timeline');
      const title = box(document.querySelector('h1')!);
      const display = box(document.querySelector('.display-menu')!);
      if (display.top > title.bottom) found.push('Display button is not on the title line');
      return found;
    });
    expect(problems).toEqual([]);
  });
}

for (const [width, height, maxControls, minViewer] of [
  [872, 920, 300, 78],
  [1100, 900, 240, 100],
]) {
  test(`narrow stages use compact controls, leaving room for the Viewers (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
    const m = await page.evaluate(() => ({
      controls: Math.max(...[...document.querySelectorAll('.block-controls')].map((c) => c.getBoundingClientRect().height)),
      viewer: Math.min(...[...document.querySelectorAll('canvas.scope, canvas.spectrum')].map((c) => c.getBoundingClientRect().height)),
      scroll: document.documentElement.scrollHeight,
    }));
    expect(m.controls).toBeLessThanOrEqual(maxControls);
    expect(m.viewer).toBeGreaterThanOrEqual(minViewer);
    expect(m.scroll).toBeLessThanOrEqual(height);
  });
}

for (const [width, height, size] of [
  [1710, 1060, 44],
  [1440, 900, 44],
  [1100, 900, 32],
  [872, 920, 32],
]) {
  test(`every knob on the page is the same size: ${size} pt at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.knob-dial')]
        .filter((d) => d.checkVisibility({ visibilityProperty: true }))
        .map((d) => Math.round(d.getBoundingClientRect().width)),
    );
    expect(new Set(sizes)).toEqual(new Set([size]));
  });
}

for (const [width, height, pitch] of [
  [1710, 1060, 72],
  [1440, 900, 72],
  [1300, 900, 72],
  [1100, 900, 58],
  [1000, 800, 58],
  [872, 920, 58],
]) {
  test(`every knob row has the same dial pitch: ${pitch} pt at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
    const pitches = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.knobs')].flatMap((row) => {
        const dials = [...row.querySelectorAll<HTMLElement>(':scope > .knob > .knob-dial, :scope > .tip-anchor > .knob > .knob-dial')]
          .filter((d) => d.checkVisibility({ visibilityProperty: true }))
          .map((d) => d.getBoundingClientRect());
        // Neighbours on the same line: centre to centre.
        return dials.slice(1).flatMap((d, i) =>
          Math.abs(d.top - dials[i].top) < 1 ? [Math.round(d.left + d.width / 2 - (dials[i].left + dials[i].width / 2))] : [],
        );
      }),
    );
    expect(pitches.length).toBeGreaterThan(5);
    expect(new Set(pitches)).toEqual(new Set([pitch]));
  });
}

test('the Filter Mode and Slope stay on one line each, never wrapping inside', async ({ page }) => {
  await page.setViewportSize({ width: 872, height: 920 });
  await page.goto('/');
  const rows = await page.evaluate(() =>
    ['[aria-label="Filter Mode"]', '[aria-label="Slope"]'].map((sel) => {
      const buttons = [...document.querySelectorAll<HTMLElement>(`${sel} [role="radio"]`)];
      const tops = buttons.map((b) => Math.round(b.getBoundingClientRect().top));
      // …and each label on one line: a button no taller than one line of its text plus padding.
      const wrapped = buttons.some((b) => b.scrollHeight > 30 || /\n/.test(b.innerText));
      return new Set(tops).size + (wrapped ? 1 : 0);
    }),
  );
  expect(rows).toEqual([1, 1]);
});
