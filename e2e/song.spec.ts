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
