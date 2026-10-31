import { expect, type Page, test } from '@playwright/test';

// Issue 69: a search box and a row of categories narrow the Patch panel.
const patchName = (page: Page) => page.getByRole('button', { name: /^Patch:/ });
const panel = (page: Page) => page.getByRole('dialog', { name: 'Patches' });
const search = (page: Page) => panel(page).getByRole('searchbox', { name: 'Search', exact: true });
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
    // Four by their names; Glass Keys only by its description. Ring Bell's Tutorial too, in its row and as the cap
    // beside the Preset (issue 109).
    await expect(row(page, 'Tutorials').getByRole('button')).toHaveText(['Ring Bell']);
    await expect(row(page, 'Name').getByRole('button').filter({ hasText: /\S/ })).toHaveText(['Twelfth Bell', 'Ring Bell', 'Breathing Bell', 'FM Bell']);
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

    // From elsewhere in the panel too (the 1.14.0 review): the categories, here.
    await patchName(page).click();
    await search(page).fill('acid');
    await category(page, 'All').focus();
    await page.keyboard.press('Escape');
    await expect(search(page)).toHaveValue('');
    await expect(panel(page)).toBeVisible();
  });

  test('Enter with nothing typed loads nothing, nor does a search of punctuation alone list every Preset', async ({ page }) => {
    // The 1.14.0 review: Enter on the empty box loaded Init over the sound; "?" left one row of all 91.
    await patchName(page).click();
    const before = await patchName(page).textContent();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeVisible();
    await expect(patchName(page)).toHaveText(before!);
    await search(page).fill('?');
    await expect(row(page, 'Bass')).toBeVisible();
    await expect(row(page, 'Name')).toBeHidden();
  });

  test('a search kept from before is selected on opening again, so typing starts a new one', async ({ page }) => {
    await patchName(page).click();
    await page.keyboard.type('bell');
    await page.keyboard.press('Escape'); // clears
    await page.keyboard.type('acid');
    await patchName(page).click(); // closes, the search kept
    await patchName(page).click();
    await page.keyboard.type('pad');
    await expect(search(page)).toHaveValue('pad');
  });

  test('a category shows its Presets alone; a search looks inside it, and offers All when nothing is found', async ({ page }) => {
    await patchName(page).click();
    await expect(category(page, 'All')).toHaveAttribute('aria-checked', 'true');
    await category(page, 'Bass').click();
    await expect(row(page, 'Bass').getByRole('button', { name: 'Acid', exact: true })).toBeVisible();
    await expect(row(page, 'Leads')).toBeHidden();
    await expect(row(page, 'Tutorials')).toBeHidden();
    await expect(panel(page).getByText('None saved yet.')).toBeVisible(); // none saved, under any category (issue 72)
    await expect(panel(page).getByRole('textbox', { name: 'Patch name' })).toBeVisible(); // but Save stays

    await search(page).fill('vibrato');
    await expect(panel(page).getByText('Nothing matches “vibrato” in Bass.')).toBeVisible();
    await panel(page).getByRole('button', { name: 'Search All' }).click();
    await expect(category(page, 'All')).toHaveAttribute('aria-checked', 'true');
    await expect(search(page)).toBeFocused(); // not lost with the button (the 1.14.0 review)
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

  test('the number found is said once typing pauses, and nothing once the search is cleared (issue 72)', async ({ page }) => {
    await patchName(page).click();
    const count = panel(page).getByRole('status').filter({ hasText: /found/ });
    await page.keyboard.type('bell');
    await expect(count).toHaveText('6 found'); // Twelfth Bell, Ring Bell, Breathing Bell and FM Bell by name, Glass Keys by description, Ring Bell's Tutorial
    await search(page).fill('zzz');
    await expect(count).toHaveText('Nothing found');
    await panel(page).getByRole('button', { name: 'Clear the search' }).click();
    await expect(count).toHaveCount(0);
  });

  test('under a Preset group, My Patches says where the saved Patches are (issue 72)', async ({ page }) => {
    await patchName(page).click();
    await panel(page).getByRole('textbox', { name: 'Patch name' }).fill('My bass');
    await panel(page).getByRole('button', { name: 'Save', exact: true }).click();
    await category(page, 'Bass').click();
    await expect(panel(page).getByText('Your saved Patches are under All and My Patches.')).toBeVisible();
    await expect(panel(page).getByRole('button', { name: 'Load My bass' })).toBeHidden();
    await category(page, 'Tutorials').click();
    await expect(panel(page).getByText('Your saved Patches are under All and My Patches.')).toBeVisible();
    await category(page, 'All').click();
    await expect(panel(page).getByRole('button', { name: 'Load My bass' })).toBeVisible();
    await expect(panel(page).getByText('Your saved Patches are under All and My Patches.')).toBeHidden();
  });

  test('the categories are one row scrolling sideways up to 860 px wide, and wrap beside the search box above (issue 72)', async ({ page }) => {
    const layout = () =>
      panel(page)
        .getByRole('radiogroup', { name: 'Category' })
        .evaluate((el) => {
          const pill = el.firstElementChild!.getBoundingClientRect();
          const box = document.querySelector('.patch-panel input[type="search"]')!.getBoundingClientRect();
          return { height: el.getBoundingClientRect().height, pill: pill.height, scrolls: el.scrollWidth > el.clientWidth, below: el.getBoundingClientRect().top >= box.bottom };
        });
    await page.setViewportSize({ width: 700, height: 900 });
    await patchName(page).click();
    const narrow = await layout();
    expect(narrow.height).toBeCloseTo(narrow.pill, 0);
    expect(narrow.scrolls).toBe(true);
    expect(narrow.below).toBe(true);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 900 });
    await patchName(page).click();
    const wide = await layout();
    expect(wide.below).toBe(false);
    expect(wide.scrolls).toBe(false);
    expect(wide.height).toBeGreaterThan(wide.pill * 1.5); // wrapping
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
