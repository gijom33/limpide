import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const cutoff = (page: Page) => page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
const patchName = (page: Page) => page.getByRole('button', { name: /^Patch:/ });
const nudge = async (page: Page) => {
  await cutoff(page).focus();
  await page.keyboard.press('ArrowDown');
};

// Start from an empty Library: cleared once, before the app runs, so no autosave can write back in between.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('cleared')) return;
    localStorage.clear();
    sessionStorage.setItem('cleared', 'true');
  });
  await page.goto('/');
});

test('the Preset arrows step through the factory sounds', async ({ page }) => {
  await expect(patchName(page)).toContainText('Init');
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await expect(patchName(page)).toContainText('Pure Sine');
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', '20.00 kHz'); // its Patch is loaded
  await page.getByRole('button', { name: 'Previous Preset' }).click();
  await page.getByRole('button', { name: 'Previous Preset' }).click();
  await expect(patchName(page)).toContainText('Out of Tune'); // wraps around to the last
});

test('an edit marks the Patch as changed, and the sound comes back after a reload (autosave)', async ({ page }) => {
  await nudge(page);
  const value = await cutoff(page).getAttribute('aria-valuetext');
  await expect(patchName(page)).toHaveAttribute('data-changed', 'true');
  await page.waitForTimeout(500); // autosave settles
  await page.reload();
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', value!);
});

test('a Patch can be saved under a name, loaded back, and deleted', async ({ page }) => {
  await nudge(page);
  const value = await cutoff(page).getAttribute('aria-valuetext');
  await patchName(page).click();
  const menu = page.getByRole('dialog', { name: 'Patches' });
  await menu.getByRole('textbox', { name: 'Patch name' }).fill('My sound');
  await menu.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(patchName(page)).toContainText('My sound');
  await expect(patchName(page)).not.toHaveAttribute('data-changed', 'true');

  await page.getByRole('button', { name: 'Next Preset' }).click(); // somewhere else
  await patchName(page).click();
  await menu.getByRole('button', { name: 'Load My sound' }).click();
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', value!);
  await expect(menu).toBeVisible(); // picking in the panel keeps it open, to audition sounds

  await menu.getByRole('button', { name: 'Delete My sound' }).click();
  await menu.getByRole('button', { name: 'Confirm delete My sound' }).click();
  await expect(menu.getByRole('button', { name: 'Load My sound' })).toHaveCount(0);
});

test('a share link opens the same sound in a fresh page', async ({ page, browser }) => {
  await page.getByRole('button', { name: 'Next Preset' }).click(); // Pure Sine, wide open
  await nudge(page);
  const value = await cutoff(page).getAttribute('aria-valuetext');
  await patchName(page).click();
  await page.getByRole('button', { name: 'Copy share link' }).click();
  const link = await page.getByRole('textbox', { name: 'Share link' }).inputValue();
  expect(link).toMatch(/#p=[A-Za-z0-9_-]+$/);

  const fresh = await browser.newPage();
  await fresh.goto(link);
  await expect(cutoff(fresh)).toHaveAttribute('aria-valuetext', value!);
  await expect(patchName(fresh)).toContainText('Shared Patch');
  await fresh.close();
});

test('a Patch exports as a file and imports back', async ({ page }) => {
  await page.getByRole('button', { name: 'Next Preset' }).click(); // Bass
  await patchName(page).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export file' }).click();
  const file = await (await download).path();
  expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ app: 'synthview', version: 1 });

  await page.getByRole('button', { name: 'Previous Preset' }).click(); // back to Init
  await patchName(page).click();
  await page.getByLabel('Import file').setInputFiles(file);
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', '20.00 kHz');
});

test('importing something that is not a Patch says why, and changes nothing', async ({ page }) => {
  await patchName(page).click();
  await page.getByLabel('Import file').setInputFiles({ name: 'tune.json', mimeType: 'application/json', buffer: Buffer.from('{"tempo":120}') });
  await expect(page.getByRole('dialog', { name: 'Patches' }).getByRole('status')).toContainText(/not a SynthView Patch/i);
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', '2.00 kHz');
});

test('the Preset arrows stay put whatever the name between them, and a long name is shortened, not spilled', async ({ page }) => {
  const next = page.getByRole('button', { name: 'Next Preset' });
  const at = async () => Math.round((await next.boundingBox())!.x);
  const home = await at();
  for (let i = 0; i < 22; i++) {
    await next.click();
    const label = (await patchName(page).getAttribute('aria-label')) ?? '';
    expect(await at(), label).toBe(home);
    // Every factory name shows in full.
    const cut = await patchName(page).locator('span').first().evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(cut, label).toBe(false);
  }
  await nudge(page);
  await expect(patchName(page)).toHaveAttribute('data-changed', 'true'); // the changed dot appears…
  expect(await at()).toBe(home); // …and nothing moves
  await patchName(page).click();
  const menu = page.getByRole('dialog', { name: 'Patches' });
  await menu.getByRole('textbox', { name: 'Patch name' }).fill('A rather long name for my favourite bass');
  await menu.getByRole('button', { name: 'Save', exact: true }).click();
  await page.keyboard.press('Escape');
  expect(await at()).toBe(home);
  await expect(patchName(page)).toHaveAttribute('aria-label', 'Patch: A rather long name for my favourite bass'); // full name kept for screen readers
});

for (const [width, height] of [[1710, 1060], [1100, 800], [872, 700]]) {
  test(`the Presets are grouped under headings, and the menu fits the window at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await patchName(page).click();
    const menu = page.getByRole('dialog', { name: 'Patches' });
    for (const group of ['Shapes', 'Intervals', 'Filter', 'Envelope', 'LFO', 'Bass', 'Leads', 'Keys & Plucks', 'Pianos', 'Pads', 'Chords', 'Drums', 'Movement & Effects']) {
      await expect(menu.getByRole('group', { name: group }).getByRole('button').first(), group).toBeAttached();
    }
    await expect(menu.getByRole('group', { name: 'Bass' }).getByRole('button', { name: 'Sub Bass' })).toBeAttached();
    const box = (await menu.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(height); // never off the bottom of the window
    // The panel spans the header's width, so on a laptop screen every Preset is on screen with no scrollbar.
    const header = (await page.locator('header').boundingBox())!;
    expect(Math.abs(box.x - header.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.x + box.width - (header.x + header.width))).toBeLessThanOrEqual(1);
    const scrolls = await menu.locator('.patch-presets').evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    expect(scrolls).toBe(height < 800);
    // The last Preset can be reached (the list scrolls when the window is short) and loaded.
    const last = menu.getByRole('button', { name: 'Out of Tune' });
    await last.scrollIntoViewIfNeeded();
    await last.click();
    await expect(patchName(page)).toContainText('Out of Tune');
  });
}
