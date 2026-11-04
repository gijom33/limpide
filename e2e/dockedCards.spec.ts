import { expect, type Page, test } from '@playwright/test';

// Issue 59, the owner's decisions (2026-10-27): the Demo's and a Tutorial's cards fold to their top row (the fold
// remembered for each kind of card), and from the 2 × 2 layout up move by that row, inside the window; a double-click
// on it puts the card back. On a phone they only fold.

const demoCard = (page: Page) => page.getByRole('region', { name: 'Demo', exact: true });
const box = async (page: Page) => (await demoCard(page).boundingBox())!;

async function startDemo(page: Page) {
  await page.getByRole('button', { name: 'Demo' }).click();
  await expect(demoCard(page).locator('.demo-bar-caption')).toBeVisible();
}

/** Drags the card by its name, in the top row, by (dx, dy). */
async function dragBy(page: Page, dx: number, dy: number) {
  const handle = (await demoCard(page).locator('.demo-bar-name').boundingBox())!;
  await page.mouse.move(handle.x + 4, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 4 + dx, handle.y + handle.height / 2 + dy, { steps: 8 });
  await page.mouse.up();
}

test('on a laptop the Demo card moves by its top row, stays in the window, and a double-click puts it back; the Demo plays on', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await startDemo(page);
  const home = await box(page);
  await dragBy(page, -300, -400);
  const moved = await box(page);
  expect(Math.round(moved.x - home.x)).toBe(-300);
  expect(Math.round(moved.y - home.y)).toBe(-400);
  await dragBy(page, -2000, -2000); // far past the corner: it stops at the edge
  const cornered = await box(page);
  expect(Math.round(cornered.x)).toBe(0);
  expect(Math.round(cornered.y)).toBe(0);
  await dragBy(page, 4000, 0); // far past the right edge: it stops at the page's, short of any scroll bar
  const right = await box(page);
  expect(Math.round(right.x + right.width)).toBe(await page.evaluate(() => document.documentElement.clientWidth));
  await expect(page.getByRole('button', { name: 'Demo' })).toHaveAttribute('aria-pressed', 'true'); // not a takeover
  await demoCard(page).locator('.demo-bar-name').dblclick();
  const back = await box(page);
  expect([Math.round(back.x), Math.round(back.y)]).toEqual([Math.round(home.x), Math.round(home.y)]);
});

test('the Demo card folds to its top row, and stays folded the next time', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await startDemo(page);
  const open = await box(page);
  await demoCard(page).getByRole('button', { name: 'Fold the card' }).click();
  // Out of sight, but still read out as it changes (aria-live), not taken out of the page (issue 67).
  const caption = demoCard(page).locator('.demo-bar-caption');
  await expect(caption).toHaveCSS('clip-path', 'inset(50%)');
  await expect(caption).not.toHaveCSS('display', 'none');
  await expect(caption).toHaveAttribute('aria-live', 'polite');
  await expect(demoCard(page).getByRole('button', { name: 'Stop' })).toBeVisible();
  expect((await box(page)).height).toBeLessThan(open.height);
  await page.reload();
  await startDemo(page).catch(() => {}); // folded: the caption stays hidden
  await expect(demoCard(page).getByRole('button', { name: 'Unfold the card' })).toHaveAttribute('aria-expanded', 'false');
  await demoCard(page).getByRole('button', { name: 'Unfold the card' }).click();
  await expect(demoCard(page).locator('.demo-bar-caption')).toBeVisible();
});

test('a folded Tutorial card keeps its way forward in the top row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Patch: / }).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: /^Tutorial: Bass/ }).click();
  const card = page.getByRole('region', { name: /^Tutorial: / });
  await card.getByRole('button', { name: 'Fold the card' }).click();
  await expect(card.locator('.card-words')).toHaveCSS('clip-path', 'inset(50%)'); // out of sight, still read out
  await card.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(card.locator('.card-progress')).toHaveText('Step 1 of 15');
  await expect(card.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('the Demo card stays on the bottom edge, and folds', async ({ page }) => {
    await page.goto('/');
    await startDemo(page);
    const home = await box(page);
    await dragBy(page, 0, -300);
    expect(Math.round((await box(page)).y)).toBe(Math.round(home.y));
    await demoCard(page).getByRole('button', { name: 'Fold the card' }).click();
    await expect(demoCard(page).locator('.demo-bar-caption')).toHaveCSS('clip-path', 'inset(50%)'); // out of sight, still read out
  });
});

// Issue 212, decided by the owner: three and four across are meant to show everything, so there the Demo's card lies
// over the page's bottom edge and never adds to the scroll. The Tour's and a Tutorial's cards point at Viewers and
// controls, some at the page's bottom, so they keep room there, as on a phone and in 2 × 2, which scroll anyway.
const cards = {
  Demo: async (page: Page) => {
    await startDemo(page);
    return demoCard(page);
  },
  Tutorial: async (page: Page) => {
    await page.getByRole('button', { name: /^Patch: / }).click();
    await page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: /^Tutorial: Bass/ }).click();
    return page.getByRole('region', { name: /^Tutorial: / });
  },
  Tour: async (page: Page) => {
    await page.getByRole('button', { name: 'About' }).click();
    await page.getByRole('dialog', { name: 'Limpide' }).getByRole('button', { name: 'Take the Tour' }).click();
    return page.getByRole('region', { name: 'Tour' });
  },
};

/** How far the page scrolls, once the layout has settled. */
async function scrollRange(page: Page) {
  await page.waitForTimeout(300);
  return page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
}

/** Scrolled to its end, the page shows its last section whole above the card. */
async function expectRoomFor(page: Page, card: ReturnType<Page['locator']>) {
  await page.waitForTimeout(300);
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect
    .poll(async () => {
      const top = (await card.boundingBox())!.y;
      return page.evaluate((cardTop) => document.querySelector('main')!.getBoundingClientRect().bottom <= cardTop + 1, top);
    }, 'the last section clear above the card')
    .toBe(true);
}

for (const [layout, width, height] of [['three across', 1440, 900], ['four across', 1920, 1080]] as const) {
  test(`in ${layout} on a window the page fits, the Demo's card leaves the page unscrollable (issue 212)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    expect(await scrollRange(page), 'before the card').toBeLessThanOrEqual(0);
    await expect(await cards.Demo(page)).toBeVisible();
    expect(await scrollRange(page)).toBeLessThanOrEqual(0);
  });
}

test(`in three across on a window a little shorter than the page, the Demo's card adds nothing to the scroll (issue 212)`, async ({ page }) => {
  // The page fills its window down to the height its sections need, about 845 px at 1440 px wide.
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto('/');
  const without = await scrollRange(page);
  expect(without, 'the page scrolls a little').toBeGreaterThan(0);
  expect(without, 'the page scrolls a little').toBeLessThan(200);
  await expect(await cards.Demo(page)).toBeVisible();
  expect(await scrollRange(page)).toBe(without);
});

for (const [layout, width, height] of [['three across', 1440, 900], ['four across', 1920, 1080]] as const) {
  for (const name of ['Tutorial', 'Tour'] as const) {
    test(`in ${layout}, the page still keeps room for the ${name}'s card under its last section (issue 212)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const card = await cards[name](page);
      await expect(card).toBeVisible();
      await expectRoomFor(page, card);
    });
  }
}

for (const [layout, width, height] of [['375 px phone', 375, 812], ['2 × 2', 768, 1024]] as const) {
  for (const [name, open] of Object.entries(cards)) {
    test(`on a ${layout}, the page keeps room for the ${name}'s card under its last section (issue 212)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const card = await open(page);
      await expect(card).toBeVisible();
      await expectRoomFor(page, card);
    });
  }
}
