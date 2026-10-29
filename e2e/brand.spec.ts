import { expect, test } from '@playwright/test';

test('the header shows the Limpide logo and wordmark, and the tab and home screen have its icon', async ({ page }) => {
  await page.goto('/');
  const title = page.getByRole('heading', { level: 1, name: 'Limpide' });
  await expect(title).toBeVisible();
  await expect(title.locator('svg.logo')).toBeVisible();

  // An SVG, then an ICO last for Safari's tabs (issue 65); a larger PNG for a phone's home screen.
  const icons = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll((links) =>
    links.map((l) => ({ rel: l.getAttribute('rel'), href: (l as HTMLLinkElement).href })),
  );
  const types: string[] = [];
  for (const { href } of icons) {
    const response = await page.request.get(href);
    expect(response.ok(), href).toBe(true);
    types.push(response.headers()['content-type']);
  }
  expect(types.some((t) => t.includes('svg'))).toBe(true);
  expect(types.some((t) => t.includes('png'))).toBe(true);
  expect(icons.some((i) => i.rel === 'apple-touch-icon')).toBe(true);
  expect(icons.filter((i) => i.rel === 'icon').at(-1)!.href).toMatch(/\.ico$/);
});

for (const width of [861, 872, 884, 900, 920, 1000, 1100, 1440, 1710, 1920]) {
  test(`the Limpide name is on screen, over the Patch picker in three across and on the header line wider, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const title = page.getByRole('heading', { level: 1, name: 'Limpide' });
    await expect(title).toBeVisible();
    const { text, header, display, patch } = await page.evaluate(() => ({
      text: document.querySelector('.wordmark-text')!.getBoundingClientRect(),
      header: document.querySelector('header')!.getBoundingClientRect(),
      display: document.querySelector('.display-menu')!.getBoundingClientRect(),
      patch: document.querySelector('.header-identity > :last-child')!.getBoundingClientRect(),
    }));
    expect(text.width).toBeGreaterThan(60); // drawn at full size, not clipped away
    expect(text.right).toBeLessThanOrEqual(header.right);
    expect(display.right).toBeLessThanOrEqual(header.right + 1); // the Display button stays inside the window
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 1920) {
      // Three across: the name over the Patch picker, so the piano can sit at the centre (issue 82, the owner, 2026-10-29).
      expect(text.bottom).toBeLessThanOrEqual(patch.top + 1);
      expect(text.top).toBeGreaterThanOrEqual(header.top - 1);
    } else expect(Math.abs(text.top + text.height / 2 - (display.top + display.height / 2))).toBeLessThanOrEqual(8); // one line
  });
}

// The mark and the name run through the signal chain: the three stages, then the modulation blue that moves them.
test('the logo and the favicon run green, orange, purple, then the modulation blue; the name is plain text', async ({ page }) => {
  await page.goto('/');
  const order = ['rgb(8, 173, 114)', 'rgb(227, 107, 2)', 'rgb(160, 82, 254)', 'rgb(91, 140, 255)'];
  const stops = await page.locator('h1 svg.logo stop').evaluateAll((all) => all.map((s) => getComputedStyle(s).stopColor));
  expect(stops).toEqual(order);
  // The name in the text colour, header and About alike: the mark alone carries the colours.
  const text = await page.evaluate(() => getComputedStyle(document.body).color);
  for (const name of await page.locator('.wordmark-text').all()) {
    expect(await name.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).backgroundImage])).toEqual([text, 'none']);
  }
  const favicon = await (await page.request.get('/favicon.svg')).text();
  expect(favicon.match(/stop-color="(#[0-9a-f]{6})"/g)!.map((m) => m.slice(12, 19))).toEqual(['#08ad72', '#e36b02', '#a052fe', '#5b8cff']);
});

test('no "Press a key" message over the Viewers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await expect(page.getByText(/press a key/i)).toHaveCount(0);
});
