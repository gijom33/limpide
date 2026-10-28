import { expect, type Page, test } from '@playwright/test';

// Issue 69: a search box and a row of categories narrow the Patch panel.
const patchName = (page: Page) => page.getByRole('button', { name: /^Patch:/ });
const panel = (page: Page) => page.getByRole('dialog', { name: 'Patches' });
const search = (page: Page) => panel(page).getByRole('searchbox', { name: 'Search Presets' });
const category = (page: Page, name: string) => panel(page).getByRole('radiogroup', { name: 'Category' }).getByRole('radio', { name, exact: true });
const row = (page: Page, name: string) => panel(page).getByRole('group', { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('on a computer', () => {
  test('the search box has the focus on opening; names come first, then descriptions, and Enter loads the first', async ({ page }) => {
    await patchName(page).click();
    await expect(search(page)).toBeFocused();
    await page.keyboard.type('bell');
    // Two by their names; Glass Keys only by its description.
    await expect(row(page, 'Name').getByRole('button')).toHaveText(['Twelfth Bell', 'Bell Chords']);
    await expect(row(page, 'Description').getByRole('button')).toHaveText(['Glass Keys']);
    await expect(row(page, 'Bass')).toBeHidden(); // the groups give way to the two rows
    const [name, description] = await Promise.all([row(page, 'Name').boundingBox(), row(page, 'Description').boundingBox()]);
    expect(name!.y).toBeLessThan(description!.y);

    await page.keyboard.press('Enter');
    await expect(patchName(page)).toContainText('Twelfth Bell');
    await expect(panel(page)).toBeHidden();
    await expect(patchName(page)).toBeFocused();

    // Kept on opening again, to audition the next; the × clears it.
    await patchName(page).click();
    await expect(search(page)).toHaveValue('bell');
    await panel(page).getByRole('button', { name: 'Clear the search' }).click();
    await expect(search(page)).toHaveValue('');
    await expect(row(page, 'Bass')).toBeVisible();
  });

  test('Escape clears the search first, then closes the panel', async ({ page }) => {
    await patchName(page).click();
    await search(page).fill('acid');
    await page.keyboard.press('Escape');
    await expect(search(page)).toHaveValue('');
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(patchName(page)).toBeFocused();
  });

  test('a category shows its Presets alone; a search looks inside it, and offers All when nothing is found', async ({ page }) => {
    await patchName(page).click();
    await expect(category(page, 'All')).toHaveAttribute('aria-checked', 'true');
    await category(page, 'Bass').click();
    await expect(row(page, 'Bass').getByRole('button', { name: 'Acid', exact: true })).toBeVisible();
    await expect(row(page, 'Leads')).toBeHidden();
    await expect(row(page, 'Tutorials')).toBeHidden();
    await expect(panel(page).getByText('None saved yet.')).toBeHidden(); // My Patches is a category of its own
    await expect(panel(page).getByRole('textbox', { name: 'Patch name' })).toBeVisible(); // but Save stays

    await search(page).fill('vibrato');
    await expect(panel(page).getByText('Nothing matches “vibrato” in Bass.')).toBeVisible();
    await panel(page).getByRole('button', { name: 'Search All' }).click();
    await expect(category(page, 'All')).toHaveAttribute('aria-checked', 'true');
    await expect(row(page, 'Name').getByRole('button', { name: 'Slow Vibrato' })).toBeVisible();

    // The Tutorials: their row alone, narrowed by name.
    await search(page).fill('');
    await category(page, 'Tutorials').click();
    await expect(row(page, 'Tutorials').getByRole('button', { name: 'Tutorial: Acid' })).toBeVisible();
    await expect(row(page, 'Bass')).toBeHidden();
  });

  test('the category is kept on opening again, and the arrows still step through every Preset', async ({ page }) => {
    await patchName(page).click();
    await category(page, 'Bass').click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Next Preset' }).click();
    await expect(patchName(page)).toContainText('Pure Sine'); // not the first Bass
    await patchName(page).click();
    await expect(category(page, 'Bass')).toHaveAttribute('aria-checked', 'true');
  });

  test('My Patches is a category, and the search narrows it by name', async ({ page }) => {
    await patchName(page).click();
    await panel(page).getByRole('textbox', { name: 'Patch name' }).fill('My bass');
    await panel(page).getByRole('button', { name: 'Save', exact: true }).click();
    await category(page, 'My Patches').click();
    await expect(panel(page).getByRole('button', { name: 'Load My bass' })).toBeVisible();
    await expect(row(page, 'Start')).toBeHidden();
    await search(page).fill('bass');
    await expect(panel(page).getByRole('button', { name: 'Load My bass' })).toBeVisible();
    await search(page).fill('lead');
    await expect(panel(page).getByRole('button', { name: 'Load My bass' })).toBeHidden();
  });

  test('Tab goes from the search to the category chosen, and the arrows change it', async ({ page }) => {
    await patchName(page).click();
    await page.keyboard.press('Tab');
    await expect(category(page, 'All')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(category(page, 'Tutorials')).toBeFocused();
    await expect(category(page, 'Tutorials')).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
  test.skip(({ browserName }) => browserName !== 'chromium', 'isMobile is Chromium-only');

  test('the search waits for a tap, and the categories scroll sideways in one row', async ({ page }) => {
    await patchName(page).click();
    await expect(search(page)).not.toBeFocused(); // no keyboard over the list
    const categories = panel(page).getByRole('radiogroup', { name: 'Category' });
    const sizes = await categories.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth, tops: new Set([...el.children].map((c) => c.getBoundingClientRect().top)).size }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    expect(sizes.tops).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);

    await category(page, 'Drums').tap();
    await expect(row(page, 'Drums').getByRole('button', { name: 'Kick' })).toBeVisible();
    await search(page).tap();
    await page.keyboard.type('hat');
    await expect(row(page, 'Name').getByRole('button')).toHaveText(['Hi-hat', 'Open Hat']);
  });
});
