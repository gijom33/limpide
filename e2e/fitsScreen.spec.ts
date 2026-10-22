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
