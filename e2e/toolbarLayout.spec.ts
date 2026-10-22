import { expect, test } from '@playwright/test';

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
    for (const d of await dividers(page)) {
      expect(d.visible, `${d.name} ${d.startsRow ? 'starts a row' : 'follows a group'}`).toBe(!d.startsRow);
    }
  });
}

for (const width of [1400, 1100, 900, 872, 800, 420]) {
  test(`every knob stays inside its stage block (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const escapes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.block')].flatMap((block) => {
        const b = block.getBoundingClientRect();
        const inner = { left: b.left + 8, right: b.right - 8 }; // inside the padding, not touching the border
        return [...block.querySelectorAll<HTMLElement>('.knob')]
          .map((k) => ({ k, r: k.getBoundingClientRect() }))
          .filter(({ r }) => r.left < inner.left || r.right > inner.right)
          .map(({ k }) => `${block.getAttribute('aria-label')}: ${k.querySelector('.knob-label')?.textContent}`);
      }),
    );
    expect(escapes).toEqual([]);
  });
}
