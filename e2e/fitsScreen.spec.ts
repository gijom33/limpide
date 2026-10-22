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
      const theme = box(document.querySelector('.theme-toggle')!);
      if (theme.top > title.bottom) found.push('theme button is not on the title line');
      return found;
    });
    expect(problems).toEqual([]);
  });
}
