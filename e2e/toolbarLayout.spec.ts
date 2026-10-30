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
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
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

// Issue 47: every section has the same inner margin on every layout (the stages and LFO & Envelopes differed by 4 to
// 8 px on phones and at 861–960 px).
for (const [width, height] of [[375, 812], [430, 900], [690, 830], [900, 900], [1440, 900], [1920, 1080]]) {
  test(`every section's heading sits as far from its left edge (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const insets = await page.evaluate(() =>
      [...document.querySelectorAll('.chain > section')].map((section) => {
        const heading = section.querySelector('h2')!.getBoundingClientRect();
        return `${section.getAttribute('aria-label')} ${Math.round(heading.left - section.getBoundingClientRect().left)}`;
      }),
    );
    expect(new Set(insets.map((i) => i.split(' ').pop())).size, insets.join(', ')).toBe(1);
  });
}

// Issue 47: the Filter Envelope's Amount and four faders stay on one line at every width (Release wrapped alone at
// 1331–1434 px, 601–603 px and 345–369 px).
for (const [width, height] of [[345, 800], [360, 800], [601, 900], [861, 800], [1100, 800], [1331, 800], [1366, 768], [1400, 900], [1920, 1080]]) {
  test(`the Filter Envelope stays on one line (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const tops = await page.locator('section[aria-label="Filter"] .knobs-envelope .knob').evaluateAll((knobs) =>
      knobs.map((k) => k.getBoundingClientRect()).map((r) => ({ top: r.top, bottom: r.bottom })),
    );
    for (const k of tops) expect(k.top).toBeLessThan(tops[0].bottom);
  });
}

// Issue 82 (the owner's idea, 2026-10-28): in three across, the top row stacks what it can two high so the piano sits at
// the page's centre, wherever that leaves it its full size; the row grows no taller.
const pianoPlace = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const piano = document.querySelector('.piano')!.getBoundingClientRect();
    const header = document.querySelector('header')!.getBoundingClientRect();
    return { offset: Math.round((piano.left + piano.right) / 2 - (header.left + header.right) / 2), headerHeight: Math.round(header.height) };
  });
for (const width of [1200, 1280, 1366, 1440, 1600, 1800, 1900]) {
  test(`the piano sits at the page's centre, the top row no taller (${width}px, issue 82)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const { offset, headerHeight } = await pianoPlace(page);
    expect(Math.abs(offset)).toBeLessThanOrEqual(4);
    expect(headerHeight).toBeLessThanOrEqual(64);
  });
}
// Below 1100 px the Patch picker beside the logo (the owner, 2026-10-29) makes the left side wider than the icons on the
// right, and their words would take the piano's keys under 26 px: it keeps its size, up to 100 px right of the centre.
for (const width of [861, 880, 1000, 1100]) {
  test(`the piano keeps its size and comes nearer the centre where centring would shrink it (${width}px, issue 82)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const { offset, headerHeight } = await pianoPlace(page);
    expect(Math.abs(offset)).toBeLessThanOrEqual(100);
    expect(headerHeight).toBeLessThanOrEqual(64);
  });
}
