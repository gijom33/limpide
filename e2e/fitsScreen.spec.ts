import { expect, test } from '@playwright/test';

// Full-screen browser viewports on MacBooks (points): this Mac (1710×1107, less the ~37 pt notch band, with a
// margin), and the common 1440×900.
// How tall each Viewer must at least be: generous on this Mac; the 90 pt floor on the smaller 1440×900, where
// the toolbar wraps under the title.
for (const [width, height, minViewer] of [
  [1710, 1060, 150],
  [1440, 900, 90],
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
