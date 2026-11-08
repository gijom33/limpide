import { expect, type Page, test } from '@playwright/test';

const song = (page: Page) => page.getByRole('button', { name: 'Song' });
const demo = (page: Page) => page.getByRole('button', { name: 'Demo' });
const patchName = (page: Page) => page.getByRole('button', { name: /^Patch:/ });
const sounding = /^-?[0-5]?\d(\.\d+)?$/;

/** Every piano key lit over a while, by name. */
async function litKeys(page: Page, ms: number): Promise<string[]> {
  return page.evaluate(async (ms) => {
    const lit = new Set<string>();
    const end = Date.now() + ms;
    while (Date.now() < end) {
      document.querySelectorAll('[aria-label="Piano"] button[aria-pressed="true"]').forEach((k) => lit.add(k.getAttribute('aria-label')!));
      await new Promise((r) => setTimeout(r, 25));
    }
    return [...lit];
  }, ms);
}

test('the Song plays on the loaded Patch, only on the keys the piano shows, and moves with the octave', async ({ page }) => {
  await page.goto('/');
  const name = await patchName(page).textContent();
  await song(page).click();
  await expect(song(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', sounding);
  const low = await litKeys(page, 3000);
  expect(low.length).toBeGreaterThan(2);
  expect(low.every((k) => /^[A-G]#?4$|^C5$/.test(k))).toBe(true); // C4 to C5
  await page.getByRole('button', { name: 'Octave up' }).click();
  await page.waitForTimeout(500); // a Note that started before the change ends where it started
  const high = await litKeys(page, 3000);
  expect(high.length).toBeGreaterThan(2);
  expect(high.every((k) => /^[A-G]#?5$|^C6$/.test(k))).toBe(true); // C5 to C6
  expect(await patchName(page).textContent()).toBe(name); // the Patch is never changed
});

test('turning knobs, flipping switches and loading Presets keep the Song playing; a Note stops it', async ({ page }) => {
  await page.goto('/');
  await song(page).click();
  const cutoff = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
  await cutoff.focus();
  await page.keyboard.press('ArrowDown');
  await page.getByRole('radiogroup', { name: 'Voices' }).getByRole('radio', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await expect(song(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', sounding);
  await page.keyboard.down('a');
  await expect(song(page)).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.up('a');
});

test('the Demo and the Song take turns: starting one stops the other', async ({ page }) => {
  await page.goto('/');
  await song(page).click();
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(song(page)).toHaveAttribute('aria-pressed', 'false');
  await song(page).click();
  await expect(song(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await song(page).click();
  await expect(song(page)).toHaveAttribute('aria-pressed', 'false');
});

// Issue 260 (review 1, finding 1): once started, the Song said nothing, though flipping the Presets over it is the most
// fun a newcomer finds. While it plays, a line under the sound's name invites it, on one line at every width (issue
// 156's rule), until the person changes the sound.
const invite = (page: Page) => page.locator('.song-invite');

/** Whether the line's words sit on one line, inside its box and the window. */
const oneLine = (page: Page) =>
  invite(page).evaluate((el) => {
    const box = el.getBoundingClientRect();
    const tops = new Set<number>();
    let inside = box.right <= innerWidth + 0.5 && box.left >= -0.5;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (!r.width) continue;
        tops.add(Math.round(r.top));
        if (r.right > box.right + 0.5) inside = false;
      }
    }
    return tops.size === 1 && inside;
  });

for (const [width, height] of [[320, 568], [375, 812], [390, 844], [768, 1024], [1440, 900]] as const) {
  test(`at ${width} px, while the Song plays a line invites flipping the Presets with › or turning a knob, on one line (issue 260)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(invite(page)).toHaveCount(0);
    await song(page).click();
    await expect(invite(page)).toBeVisible();
    await expect(invite(page)).toContainText('›');
    await expect(invite(page)).toContainText('knob');
    expect(await oneLine(page)).toBe(true);
    await page.getByRole('button', { name: 'Next Preset' }).click();
    await expect(invite(page)).toHaveCount(0); // followed: it has done its work
    await expect(song(page)).toHaveAttribute('aria-pressed', 'true');
  });
}

test('the Song’s line goes once a knob is turned, or the Song stops (issue 260)', async ({ page }) => {
  await page.goto('/');
  await song(page).click();
  await expect(invite(page)).toBeVisible();
  const cutoff = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
  await cutoff.focus();
  await page.keyboard.press('ArrowDown');
  await expect(invite(page)).toHaveCount(0);
  await song(page).click();
  await song(page).click();
  await expect(invite(page)).toBeVisible(); // started again, it invites again
  await song(page).click();
  await expect(invite(page)).toHaveCount(0);
});
