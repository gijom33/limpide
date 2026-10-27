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
  await expect(demoCard(page).locator('.demo-bar-caption')).toBeHidden();
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
  await expect(card.locator('.tutorial-words')).toBeHidden();
  await card.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(card.locator('.tutorial-progress')).toHaveText('Step 1 of 15');
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
    await expect(demoCard(page).locator('.demo-bar-caption')).toBeHidden();
  });
});
