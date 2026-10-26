import { expect, test, type Page } from '@playwright/test';

// Issue 43: from 1920 px wide, the four sections side by side, LFO & Envelopes a fourth column beside the stages;
// the height its row took goes to the Viewers. A stage is never wider than three across gave it at 1920 px: the page
// grows to 2560 px, then keeps margins.

const sections = ['Oscillators', 'Filter', 'Amp', 'LFO & Envelopes'];

async function measure(page: Page) {
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  return page.evaluate((names) => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
    };
    return {
      sections: names.map((name) => box(document.querySelector(`section[aria-label="${name}"]`)!)),
      scopes: [...document.querySelectorAll('canvas.scope')].map(box),
      main: box(document.querySelector('main')!),
      scrolls: document.documentElement.scrollHeight > innerHeight,
    };
  }, sections);
}

for (const [width, height] of [
  [1920, 1080],
  [2560, 1440],
  [3440, 1440],
]) {
  test(`the four sections sit side by side at ${width}×${height}, the instrument on one screen`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const { sections: s, scopes, main, scrolls } = await measure(page);
    expect(scrolls, 'no scrolling').toBe(false);
    for (let i = 1; i < 4; i++) {
      expect(s[i].top, sections[i]).toBe(s[0].top);
      expect(s[i].bottom, sections[i]).toBe(s[0].bottom);
      expect(s[i].left, sections[i]).toBeGreaterThan(s[i - 1].right);
      expect(Math.abs(s[i].width - s[0].width), sections[i]).toBeLessThanOrEqual(1);
    }
    // The three stages' Viewers line up, at least as wide as three across gives them on a 1440 px laptop.
    for (const scope of scopes) {
      expect(scope.top).toBe(scopes[0].top);
      expect(scope.width).toBeGreaterThanOrEqual(420);
    }
    // No wider than the page's 2560 px, centred.
    expect(main.width).toBeLessThanOrEqual(2560);
    expect(Math.abs(main.left - (width - main.right))).toBeLessThanOrEqual(1);
  });
}

test('the Viewers take the height the LFO & Envelopes row took below them', async ({ page }) => {
  await page.setViewportSize({ width: 1919, height: 1080 });
  await page.goto('/');
  const three = await measure(page);
  expect(three.sections[3].top, 'below the stages, at 1919 px').toBeGreaterThan(three.sections[0].bottom);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const four = await measure(page);
  expect(four.scopes[0].height).toBeGreaterThan(three.scopes[0].height + 100);
});

test('the column keeps its size after the window was narrower: the canvases never grow their rows', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto('/');
  const heights = async () => {
    await page.waitForTimeout(300);
    return page.evaluate(() =>
      ['.timeline-plot canvas', 'canvas.scope', 'section[aria-label="LFO & Envelopes"]'].map((s) => Math.round(document.querySelector(s)!.getBoundingClientRect().height)),
    );
  };
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  const fresh = await heights();
  await page.setViewportSize({ width: 1440, height: 900 });
  await heights();
  await page.setViewportSize({ width: 2560, height: 1440 });
  expect(await heights()).toEqual(fresh);
});
