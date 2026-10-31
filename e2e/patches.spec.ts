import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';

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
    localStorage.setItem('limpide.welcomed', '1'); // an empty Library, but not a first visit
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
  await expect(patchName(page)).toContainText('Machine Chatter'); // wraps around to the last
});

test('a Preset loaded shows its about line under the name, and a knob turned, or the Demo, takes it away (issue 109)', async ({ page }) => {
  const about = page.locator('.patch-about');
  await expect(about).toHaveCount(0); // not for the sound the page opens on
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await expect(about).toHaveText(/^One Harmonic and nothing else/);
  // Said once, with the name; clicks go through it to the controls beneath.
  await expect(page.locator('.patch-bar [role="status"]')).toHaveText(/^Pure Sine\. One Harmonic/);
  await expect(about).toHaveCSS('pointer-events', 'none');
  await nudge(page);
  await expect(about).toHaveCount(0);
  await expect(page.locator('.patch-bar [role="status"]')).toHaveText(/^Pure Sine\. One Harmonic/); // not said again

  // From the Patches panel too; another load in the Demo's hands takes it away.
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'FM Ladder', exact: true }).click();
  await expect(about).toHaveText(/^Two sines on the same Note/);
  await page.getByRole('button', { name: 'Demo' }).click();
  await expect(about).toHaveCount(0);
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
  await expect(menu).toBeHidden(); // picking a sound closes the panel, so it can be played at once

  await patchName(page).click();
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
  expect(link).toMatch(/#p=[A-Za-z0-9_-]+&n=Pure%20Sine$/); // its name travels with it (issue 53)

  const fresh = await browser.newPage();
  await fresh.goto(link);
  await expect(cutoff(fresh)).toHaveAttribute('aria-valuetext', value!);
  await expect(patchName(fresh)).toContainText('Pure Sine');
  await fresh.close();
});

test('the octave buttons write the Patch’s keyboard octave: a saved Patch and a Share link open where the player left it (issue 126)', async ({ page, browser }) => {
  test.slow(); // two fresh pages and a save: in WebKit on a busy machine, past the usual 30 s
  const menu = page.getByRole('dialog', { name: 'Patches' });
  const key = (on: Page, name: string) => on.getByRole('group', { name: 'Piano' }).getByRole('button', { name });
  const load = async (name: string) => {
    await patchName(page).click();
    await menu.getByRole('button', { name, exact: true }).click();
  };
  /** The Share link made now opens a fresh page with the keyboard on `first`. */
  const shareOpensOn = async (first: string) => {
    await patchName(page).click();
    await page.getByRole('button', { name: 'Copy share link' }).click();
    const link = await page.getByRole('textbox', { name: 'Share link' }).inputValue();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    const fresh = await browser.newPage();
    await fresh.goto(link);
    await expect(key(fresh, first)).toHaveCount(1);
    await expect(key(fresh, first === 'C2' ? 'C4' : 'C2')).toHaveCount(0);
    await fresh.close();
  };
  await load('Sub Bass');
  await expect(key(page, 'C2')).toHaveCount(1);
  await shareOpensOn('C2'); // nothing touched: the Bass's own octave
  const up = page.getByRole('button', { name: 'Octave up' });
  await up.click();
  await up.click();
  await expect(key(page, 'C4')).toHaveCount(1);
  await expect(patchName(page)).not.toHaveAttribute('data-changed', 'true'); // the octave alone is no change
  await shareOpensOn('C4');
  await patchName(page).click();
  await menu.getByRole('textbox', { name: 'Patch name' }).fill('My bass');
  await menu.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(patchName(page)).toContainText('My bass');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await load('Sub Bass'); // back on C2
  await expect(key(page, 'C2')).toHaveCount(1);
  await patchName(page).click();
  await menu.getByRole('button', { name: 'Load My bass' }).click();
  await expect(key(page, 'C4')).toHaveCount(1);
  await expect(key(page, 'C2')).toHaveCount(0);
});

test('a Patch exports as a file and imports back', async ({ page }) => {
  await page.getByRole('button', { name: 'Next Preset' }).click(); // Bass
  await patchName(page).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export file' }).click();
  const file = await (await download).path();
  expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ app: 'limpide', version: 1 });

  await page.getByRole('button', { name: 'Previous Preset' }).click(); // back to Init
  await patchName(page).click();
  await page.getByLabel('Import file').setInputFiles(file);
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', '20.00 kHz');
});

test('importing something that is not a Patch says why, and changes nothing', async ({ page }) => {
  await patchName(page).click();
  await page.getByLabel('Import file').setInputFiles({ name: 'tune.json', mimeType: 'application/json', buffer: Buffer.from('{"tempo":120}') });
  await expect(page.getByRole('dialog', { name: 'Patches' }).getByRole('status').filter({ hasText: /not a Limpide Patch/i })).toBeVisible();
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', '2.00 kHz');
});

test('the Preset arrows stay put whatever the name between them, and a long name is shortened, not spilled', async ({ page }) => {
  const next = page.getByRole('button', { name: 'Next Preset' });
  const at = async () => Math.round((await next.boundingBox())!.x);
  const home = await at();
  // Step through the Presets inside the page, in one round trip, so the test stays quick on a busy machine.
  const steps = await page.evaluate(async (count) => {
    const next = document.querySelector<HTMLElement>('button[aria-label="Next Preset"]')!;
    const name = () => document.querySelector<HTMLElement>('button[aria-label^="Patch:"]')!;
    const out: { label: string; x: number; cut: boolean }[] = [];
    for (let i = 0; i < count; i++) {
      next.click();
      await new Promise((r) => requestAnimationFrame(r));
      const text = name().querySelector('span')!;
      out.push({ label: name().getAttribute('aria-label')!, x: Math.round(next.getBoundingClientRect().x), cut: text.scrollWidth > text.clientWidth });
    }
    return out;
  }, 22);
  expect(new Set(steps.map((s) => s.label)).size).toBe(22); // a different Preset each time
  for (const { label, x, cut } of steps) {
    expect(x, label).toBe(home);
    expect(cut, label).toBe(false); // every factory name shows in full
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
    for (const group of ['Shapes', 'Intervals', 'Filter', 'Envelope', 'LFO', 'Bass', 'Leads', 'Keys & Organs', 'Pianos', 'Plucks & Mallets', 'Pads', 'Strings, Brass & Choir', 'Drums', 'Movement & Effects']) {
      await expect(menu.getByRole('group', { name: group }).getByRole('button').first(), group).toBeAttached();
    }
    await expect(menu.getByRole('group', { name: 'Bass' }).getByRole('button', { name: 'Sub Bass' })).toBeAttached();
    const box = (await menu.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(height); // never off the bottom of the window
    // The panel spans the header's width, so on a laptop screen every Preset is on screen with no scrollbar; below
    // 840 px tall the search and categories cost a short scroll (issue 69, decision 13).
    const header = (await page.locator('header').boundingBox())!;
    expect(Math.abs(box.x - header.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.x + box.width - (header.x + header.width))).toBeLessThanOrEqual(1);
    const scrolls = await menu.locator('.patch-results').evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    expect(scrolls).toBe(height < 840);
    // The last Preset can be reached (the list scrolls when the window is short) and loaded.
    const last = menu.getByRole('button', { name: 'Machine Chatter' });
    await last.scrollIntoViewIfNeeded();
    await last.click();
    await expect(patchName(page)).toContainText('Machine Chatter');
  });
}

test('the group names take a narrow column, the long ones on two lines', async ({ page }) => {
  await page.goto('/');
  await patchName(page).click();
  const menu = page.getByRole('dialog', { name: 'Patches' });
  // Each line of a group's name, as drawn.
  const lines = (group: string) =>
    menu.getByRole('group', { name: group }).locator('.patch-group-name').evaluate((h) => {
      const range = document.createRange();
      range.selectNodeContents(h);
      return [...range.getClientRects()].map((r) => ({ y: r.y + r.height / 2, right: r.right - h.getBoundingClientRect().left }));
    });
  const long = await lines('Movement & Effects');
  expect(new Set(long.map((l) => Math.round(l.y))).size).toBe(2); // two lines
  expect(Math.max(...long.map((l) => l.right))).toBeLessThanOrEqual(80);
  // The first line sits level with the row's first Preset.
  const [bass] = await lines('Bass');
  const first = (await menu.getByRole('group', { name: 'Bass' }).getByRole('button').first().boundingBox())!;
  expect(Math.abs(bass.y - (first.y + first.height / 2))).toBeLessThan(2);
});
