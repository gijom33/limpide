import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

/** For each toolbar group: does it start a row, and is its divider (left border) visible? */
const dividers = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const groups = [...document.querySelectorAll<HTMLElement>('.tool-group')];
    const clip = groups[0].parentElement!.getBoundingClientRect();
    return groups.map((g) => {
      const r = g.getBoundingClientRect();
      const border = parseFloat(getComputedStyle(g).borderLeftWidth);
      const startsRow = !groups.some((o) => o !== g && Math.abs(o.getBoundingClientRect().top - r.top) < 2 && o.getBoundingClientRect().left < r.left);
      // The border is drawn in the group's first pixel column; visible only if that column is inside the clip.
      const visible = border > 0 && r.left >= clip.left;
      return { name: g.querySelector('.tool-group-title')!.textContent, startsRow, visible };
    });
  });

for (const width of [1400, 1000, 800]) {
  test(`dividers only appear between groups on the same row (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await openDisplay(page);
    for (const d of await dividers(page)) {
      expect(d.visible, `${d.name} ${d.startsRow ? 'starts a row' : 'follows a group'}`).toBe(!d.startsRow);
    }
  });
}

for (const width of [1400, 1100, 900, 872, 800, 420]) {
  test(`every control stays inside its stage block (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const escapes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.block')].flatMap((block) => {
        const b = block.getBoundingClientRect();
        const inner = { left: b.left + 8, right: b.right - 8 }; // inside the padding, not touching the border
        return [...block.querySelectorAll<HTMLElement>('.knob, button, [role="radio"], [role="tab"]')]
          .map((k) => ({ k, r: k.getBoundingClientRect() }))
          .filter(({ k, r }) => r.width > 0 && k.checkVisibility({ visibilityProperty: true })) // hidden tab: not on screen
          .filter(({ r }) => r.left < inner.left || r.right > inner.right)
          .map(({ k }) => `${block.getAttribute('aria-label')}: ${k.querySelector('.knob-label')?.textContent ?? k.getAttribute('aria-label') ?? k.textContent}`);
      }),
    );
    expect(escapes).toEqual([]);
  });
}

test('wide screens get a wider page and wider Viewers, not empty margins', async ({ page }) => {
  const measure = async (width: number) => {
    await page.setViewportSize({ width, height: 1200 });
    await page.goto('/');
    // Measure only once the Viewers are drawing: under load, layout may not have settled straight after load.
    await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
    return page.evaluate(() => ({
      main: document.querySelector('main')!.getBoundingClientRect().width,
      scope: document.querySelector<HTMLCanvasElement>('canvas.scope')!.getBoundingClientRect(),
    }));
  };
  const laptop = await measure(1400);
  const wide = await measure(2400);
  expect(wide.main).toBeGreaterThanOrEqual(1900);
  expect(wide.scope.width).toBeGreaterThan(laptop.scope.width);
  // On a large screen the Viewers share the window's height (fits without scrolling); they never collapse.
  expect(wide.scope.height).toBeGreaterThanOrEqual(90);
});

for (const width of [1400, 872]) {
  test(`controls inside a stage never overlap each other (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const overlaps = await page.evaluate(() => {
      const found: string[] = [];
      for (const block of document.querySelectorAll<HTMLElement>('.block')) {
        const parts = [...block.querySelectorAll<HTMLElement>('h2, h3, .waveforms, .knob, .tap')]
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ el, r }) => r.width > 0 && el.checkVisibility({ visibilityProperty: true })); // hidden tab: not on screen
        for (let i = 0; i < parts.length; i++)
          for (let j = i + 1; j < parts.length; j++) {
            const [a, b] = [parts[i], parts[j]];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const overlap = a.r.left < b.r.right - 1 && b.r.left < a.r.right - 1 && a.r.top < b.r.bottom - 1 && b.r.top < a.r.bottom - 1;
            if (overlap) found.push(`${block.getAttribute('aria-label')}: ${a.el.className || a.el.tagName} × ${b.el.className || b.el.tagName}`);
          }
      }
      return found;
    });
    expect(overlaps).toEqual([]);
  });
}
