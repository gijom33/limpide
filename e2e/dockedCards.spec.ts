import { expect, type Locator, type Page, test } from '@playwright/test';
import { TRACK } from '../src/demo/track';
import { steady } from './helpers';

// Issue 59, the owner's decisions (2026-10-27): the Demo's and a Tutorial's cards fold to their top row (the fold
// remembered for each kind of card, but for the Demo's, which opens folded three and four across: issue 230), and from
// the 2 × 2 layout up move by that row, inside the window; a double-click
// on it puts the card back. On a phone they only fold.

const demoCard = (page: Page) => page.getByRole('region', { name: 'Demo', exact: true });
const box = async (page: Page) => (await demoCard(page).boundingBox())!;

async function startDemo(page: Page) {
  await page.getByRole('button', { name: 'Demo' }).click();
  await expect(demoCard(page).getByRole('button', { name: 'Stop' })).toBeVisible();
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

test('in 2 × 2 the Demo card folds to its top row, and stays folded the next time (issue 230)', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  await startDemo(page);
  await expect(demoCard(page).locator('.demo-bar-caption')).toBeVisible();
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
  await startDemo(page);
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

test('where storage cannot be written (a private window), a fold lasts the session: the next Tutorial opens folded too (issue 246)', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const tutorial = async (name: string) => {
    await page.getByRole('button', { name: /^Patch: / }).click();
    await page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: new RegExp(`^Tutorial: ${name}`) }).click();
    const card = page.getByRole('region', { name: `Tutorial: ${name}` });
    await expect(card).toBeVisible();
    return card;
  };
  const bass = await tutorial('Bass');
  await bass.getByRole('button', { name: 'Fold the card' }).click();
  await expect(bass.getByRole('button', { name: 'Unfold the card' })).toBeVisible();
  const acid = await tutorial('Acid');
  await expect(acid.getByRole('button', { name: 'Unfold the card' })).toBeVisible();
});

test('the "you are playing now" card opens whole in the corner three across, whatever fold was made in 2 × 2 (issue 246)', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  await startDemo(page);
  await demoCard(page).getByRole('button', { name: 'Fold the card' }).click();
  await demoCard(page).getByRole('button', { name: 'Stop' }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await startDemo(page);
  await page.keyboard.press('a'); // a Note of the person's own stops the Demo
  const told = demoCard(page).getByRole('status').filter({ hasText: 'The Demo stopped: you are playing now.' });
  await expect(told).toBeVisible();
  await expect(told).not.toHaveCSS('clip-path', 'inset(50%)');
  await expect(demoCard(page)).not.toHaveAttribute('data-folded');
  await expect(demoCard(page).getByRole('button', { name: 'Play again' })).toBeVisible();
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

// Issue 230, decided by the owner: in three and four across the Demo's card opens folded, small, in the window's
// bottom right corner, so it hides as little as it can; ⌃ unfolds it to the whole card, grown up and to the left from
// the corner, ⌄ folds it back there.
const CORNERED = [
  ['three across', 1000, 737],
  ['three across', 1280, 800],
  ['three across', 1440, 900],
  ['four across', 1920, 1080],
] as const;

/** The focusable elements of the page under the card, by their names. */
function underCard(card: Locator) {
  return card.evaluate((c) => {
    const over = c.getBoundingClientRect();
    const focusable = 'button, input, select, a[href], [tabindex]:not([tabindex="-1"]), [role="slider"]';
    return [...document.querySelectorAll<HTMLElement>(focusable)]
      .filter((el) => !c.contains(el) && el.checkVisibility({ visibilityProperty: true }))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.left < over.right && r.right > over.left && r.top < over.bottom && r.bottom > over.top;
      })
      .map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? el.tagName);
  });
}

for (const [layout, width, height] of CORNERED) {
  test(`in ${layout} at ${width} × ${height}, the Demo's card opens small in the bottom right corner, over no control (issue 230)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await startDemo(page);
    const card = demoCard(page);
    await expect(card.getByRole('button', { name: 'Unfold the card' })).toBeVisible();
    await steady(page, card);
    const small = await box(page);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(Math.round(clientWidth - small.x - small.width), 'from the right edge').toBe(12);
    expect(Math.round(height - small.y - small.height), 'from the bottom edge').toBe(12);
    expect(small.width).toBeGreaterThan(300);
    expect(small.width).toBeLessThan(380);
    expect(small.height).toBeLessThanOrEqual(64);
    // Every part's name on its one line, whole: measured in the name's own font, against the room its row leaves it.
    const names = [...new Set(TRACK.parts.map((p) => p.preset))];
    const tooLong = await card.locator('.demo-bar-name').evaluate((n, all) => {
      const context = document.createElement('canvas').getContext('2d')!;
      context.font = getComputedStyle(n).font;
      return all.filter((name) => context.measureText(name).width > n.clientWidth);
    }, names);
    expect(tooLong).toEqual([]);
    // At 1000 × 737 the card lies over the Envelope Timeline's right end: a Viewer, not a control (the issue's own
    // measurement).
    const allowed = width === 1000 ? ['Envelope Timeline'] : [];
    expect((await underCard(card)).filter((n) => !allowed.includes(n))).toEqual([]);
    // The segments a thin line, not targets: the whole card has them.
    await expect(card.getByRole('button', { name: /^Play from part/ })).toHaveCount(0);
    await expect(card.getByRole('img', { name: 'Part 1 of 15' })).toBeVisible();
  });
}

test('in three across the small card unfolds to the whole card, inside the window, and folds back into the corner (issue 230)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await startDemo(page);
  await steady(page, demoCard(page));
  const small = await box(page);
  await demoCard(page).getByRole('button', { name: 'Unfold the card' }).click();
  await expect(demoCard(page).locator('.demo-bar-caption')).toBeVisible();
  await expect(demoCard(page).getByRole('button', { name: 'Play from part 2, Acid' })).toBeVisible();
  const whole = await box(page);
  expect(whole.width).toBeGreaterThan(600);
  expect(whole.height).toBeGreaterThan(small.height);
  // Grown up and to the left from the corner.
  expect(Math.round(whole.x + whole.width)).toBe(Math.round(small.x + small.width));
  expect(Math.round(whole.y + whole.height)).toBe(Math.round(small.y + small.height));
  expect(whole.x).toBeGreaterThanOrEqual(0);
  expect(whole.y).toBeGreaterThanOrEqual(0);
  await demoCard(page).getByRole('button', { name: 'Fold the card' }).click();
  await steady(page, demoCard(page));
  const back = await box(page);
  expect([back.x, back.y, back.width, back.height].map(Math.round)).toEqual([small.x, small.y, small.width, small.height].map(Math.round));
});

test(`a window resized from three across to 2 × 2 and back, the Demo playing, takes each layout's card (issue 230)`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await startDemo(page);
  await expect(demoCard(page).getByRole('button', { name: 'Unfold the card' })).toBeVisible();
  await page.setViewportSize({ width: 768, height: 1024 });
  // 2 × 2's own fold, whole as remembered, at the bottom's middle.
  await expect(demoCard(page).getByRole('button', { name: 'Fold the card' })).toBeVisible();
  await expect(demoCard(page).getByRole('button', { name: /^Play from part 1,/ })).toBeVisible();
  await expect
    .poll(async () => {
      const b = await box(page);
      return Math.round(b.x + b.width / 2);
    })
    .toBe(Math.round((await page.evaluate(() => document.documentElement.clientWidth)) / 2));
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(demoCard(page).getByRole('button', { name: 'Unfold the card' })).toBeVisible();
  await expect.poll(async () => Math.round((await box(page)).width)).toBe(340);
});

test('the Demo opens small in the corner each time in three across, whatever fold 2 × 2 remembers, and 2 × 2 keeps its own (issue 230)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await startDemo(page);
  await demoCard(page).getByRole('button', { name: 'Unfold the card' }).click();
  await demoCard(page).getByRole('button', { name: 'Fold the card' }).click();
  await demoCard(page).getByRole('button', { name: 'Unfold the card' }).click();
  await demoCard(page).getByRole('button', { name: 'Stop' }).click();
  await startDemo(page);
  await expect(demoCard(page).getByRole('button', { name: 'Unfold the card' })).toBeVisible();
  // The fold made in the corner is not the one 2 × 2 remembers: there the card opens whole, as it did.
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload();
  await startDemo(page);
  await expect(demoCard(page).getByRole('button', { name: 'Fold the card' })).toBeVisible();
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
    await page.getByRole('button', { name: 'About', exact: true }).click();
    await page.getByRole('dialog', { name: 'Limpide' }).getByRole('button', { name: 'Take the Tour' }).click();
    return page.getByRole('region', { name: 'Tour' });
  },
};

/** How far the page scrolls, once the layout has settled. */
async function scrollRange(page: Page) {
  await steady(page); // the page's scroll size settled
  return page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
}

/** Opens the card on a window of that size and checks that, scrolled to its end, the page shows its last section whole above the card. */
async function expectRoomFor(page: Page, size: { width: number; height: number }, open: (page: Page) => Promise<Locator>) {
  await page.setViewportSize(size);
  await page.goto('/');
  const card = await open(page);
  await expect(card).toBeVisible();
  await steady(page, card);
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect // the card's top and the last section's bottom read together, in the page
    .poll(() => card.evaluate((c) => document.querySelector('main')!.getBoundingClientRect().bottom <= c.getBoundingClientRect().top + 1), 'the last section clear above the card')
    .toBe(true);
}

const WIDE = [['three across', 1440, 900], ['four across', 1920, 1080]] as const;

for (const [layout, width, height] of WIDE) {
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

for (const [layout, width, height] of WIDE) {
  for (const name of ['Tutorial', 'Tour'] as const) {
    test(`in ${layout}, the page still keeps room for the ${name}'s card under its last section (issue 212)`, async ({ page }) => {
      await expectRoomFor(page, { width, height }, cards[name]);
    });
  }
}

for (const [layout, width, height] of [['375 px phone', 375, 812], ['2 × 2', 768, 1024]] as const) {
  for (const [name, open] of Object.entries(cards)) {
    test(`on a ${layout}, the page keeps room for the ${name}'s card under its last section (issue 212)`, async ({ page }) => {
      await expectRoomFor(page, { width, height }, open);
    });
  }
}
