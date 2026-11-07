import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { describePatch } from '../src/patch/describe';
import { PRESETS } from '../src/patch/presets';
import { WORDS_EVERY } from '../src/ui/hooks/usePatchWords';
import { startEmptied, USUAL } from './startState';

const cutoff = (page: Page) => page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
const patchName = (page: Page) => page.getByRole('button', { name: /^Patch:/ });
const nudge = async (page: Page) => {
  await cutoff(page).focus();
  await page.keyboard.press('ArrowDown');
};

// Start from an empty Library: cleared once, before the app runs, so no autosave can write back in between.
test.beforeEach(async ({ page }) => {
  await startEmptied(page, USUAL); // an empty Library, but not a first visit
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

/** Picks a Preset in the Patches panel, which closes as it loads. */
const pick = async (page: Page, name: string) => {
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name, exact: true }).click();
};
const description = (page: Page) => page.locator('.patch-about');
const words = (page: Page) => description(page).locator('span[aria-hidden]');
const closeDescription = (page: Page) => page.getByRole('button', { name: 'Close the Preset’s description' });
const status = (page: Page) => page.locator('.patch-bar [role="status"]');

test('a Preset picked in the Patches panel shows its name and about line under the name, the arrows none (issues 109, 153)', async ({ page }) => {
  await expect(description(page)).toHaveCount(0); // not for the sound the page opens on
  // The arrows step through sounds to hear them: no box, and the name alone is said.
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await expect(patchName(page)).toContainText('Pure Sine');
  await expect(status(page)).toHaveText('Pure Sine');
  await expect(description(page)).toHaveCount(0);

  // A pick in the panel: the Preset's name leads, in bold, so the line reads as that sound's description.
  await pick(page, 'FM Ladder');
  await expect(words(page)).toHaveText(/^FM Ladder · Two sines on the same Note/);
  await expect(words(page).locator('b')).toHaveText('FM Ladder');
  // Said once, with the name; a knob turned takes it away, and it is not said again.
  await expect(status(page)).toHaveText(/^FM Ladder\. Two sines on the same Note/);
  await nudge(page);
  await expect(description(page)).toHaveCount(0);
  await expect(status(page)).toHaveText(/^FM Ladder\. Two sines/);

  // Another load in the Demo's hands takes it away too.
  await pick(page, 'FM Ladder');
  await expect(description(page)).toBeVisible();
  await page.getByRole('button', { name: 'Demo' }).click();
  await expect(description(page)).toHaveCount(0);
});

test('the Preset’s description closes by its × and by Escape, and a click on its words reaches the page beneath (issue 153)', async ({ page }) => {
  await pick(page, 'FM Ladder');
  // Only its × takes the pointer: the words let a click through to what lies beneath.
  const at = (await words(page).boundingBox())!;
  const onIt = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.patch-about'), [at.x + 8, at.y + at.height / 2]);
  expect(onIt, 'the words take no click').toBe(false);
  await expect(closeDescription(page)).toHaveCSS('pointer-events', 'auto');

  await closeDescription(page).click();
  await expect(description(page)).toHaveCount(0);
  await expect(patchName(page)).toBeFocused(); // the focus goes back to the name it hangs from
  await expect(status(page)).toHaveText(/^FM Ladder\. Two sines/); // not said again

  await pick(page, 'Kalimba');
  await expect(description(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(description(page)).toHaveCount(0);

  // While the Patches panel is open over it, or another panel, Escape closes that panel first.
  await pick(page, 'Kalimba');
  await patchName(page).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Patches' })).toBeHidden();
  await expect(description(page)).toBeVisible();
  const display = page.getByRole('button', { name: 'Display', exact: true });
  await display.click();
  await expect(display).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(display).toHaveAttribute('aria-expanded', 'false');
  await expect(description(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(description(page)).toHaveCount(0);
});

// Over the Sections' headings, as wide as the Oscillators and the Filter together (issue 153, decided by the owner):
// every Preset's line, in the box as drawn, and again in wider type, a stand-in for DejaVu Sans, a Linux font. Measured
// over every Preset's line (issue 250): the Mac's system font 1, Liberation Sans 0.99 (GitHub's, in Playwright's image,
// issue 247), DejaVu Sans 1.11, and the stand-in on the Mac's 1.09. GitHub's type is not the wider one, so the stand-in
// runs there too.
const SPACINGS = ['0', '0.04em'];
for (const [width, height, most] of [[375, 812, 5], [700, 830, 3], [1100, 800, 3], [1440, 900, 2], [2000, 1100, 2]] as const) {
  test(`at ${width} px every Preset’s description stays clear of the Osc tabs and the Filter’s Mode row, in ${most} lines at most (issue 153)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await pick(page, 'Init');
    await expect(description(page)).toBeVisible();
    const lines = PRESETS.map((p) => [p.name, p.about]);
    for (const spacing of SPACINGS) {
      const found = await description(page).evaluate(
        (box, [lines, spacing]) => {
          const words = box.querySelector('span[aria-hidden]') as HTMLElement;
          words.style.letterSpacing = spacing as string;
          const top = (el: Element | null | undefined) => el!.getBoundingClientRect().top;
          const section = (name: string) => document.querySelector(`section[aria-label="${name}"]`);
          const tabs = top(section('Oscillators')?.querySelector('[role=tablist]'));
          const mode = top(section('Filter')?.querySelector('.filter-modes'));
          const filterRight = section('Filter')!.getBoundingClientRect().right;
          const nameBottom = document.querySelector('.patch-name')!.getBoundingClientRect().bottom;
          const problems: string[] = [];
          let most = 0;
          for (const [name, about] of lines as [string, string][]) {
            const bold = document.createElement('b');
            bold.textContent = name;
            words.replaceChildren(bold, ` · ${about}`);
            const b = box.getBoundingClientRect();
            const count = new Set([...words.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
            most = Math.max(most, count);
            if (b.bottom > Math.min(tabs, mode)) problems.push(`${name}: reaches ${b.bottom > tabs ? 'the Osc tabs' : 'the Mode row'}`);
            if (b.right > filterRight + 0.5) problems.push(`${name}: wider than the Oscillators and the Filter`);
            if (b.top < nameBottom) problems.push(`${name}: over the Patch name`);
          }
          return { problems, most };
        },
        [lines, spacing] as const,
      );
      expect(found.problems, `letter-spacing ${spacing}`).toEqual([]);
      expect(found.most, `letter-spacing ${spacing}: the most lines`).toBeLessThanOrEqual(most);
    }
  });
}

/**
 * The Patch in plain words (issue 123): the line under the header from 861 px, the name's second line below. Found by
 * its class, as it is hidden from a screen reader (the name and the knobs are what it hears).
 */
const anyWords = (page: Page) => page.locator('.patch-words, .patch-name-words');
const plainWords = (page: Page) => anyWords(page).locator('visible=true');

test('once the sound changes, the line under the Patch name says it in plain words, and follows the knobs (issue 123)', async ({ page }) => {
  await expect(anyWords(page)).toHaveCount(0); // Init as loaded
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await expect(anyWords(page)).toHaveCount(0); // a Preset as loaded, by the arrows

  // A Preset picked in the panel shows its own about line, the plain words none, until a knob is turned.
  await pick(page, 'Init');
  await expect(description(page)).toBeVisible();
  await expect(anyWords(page)).toHaveCount(0);
  await nudge(page);
  await expect(description(page)).toHaveCount(0);
  await expect(plainWords(page)).toHaveText('a saw, softly filtered, sustained');
  // The Cutoff wide open: within a moment the line says so.
  await cutoff(page).press('End');
  await expect(plainWords(page)).toHaveText('a bright saw, sustained', { timeout: 1000 });

  // A saved Patch keeps its words; a Preset loaded takes them away.
  await patchName(page).click();
  const menu = page.getByRole('dialog', { name: 'Patches' });
  await menu.getByRole('textbox', { name: 'Patch name' }).fill('Open saw');
  await menu.getByRole('button', { name: 'Save', exact: true }).click();
  await patchName(page).click(); // closed
  await expect(patchName(page)).not.toHaveAttribute('data-changed', 'true');
  await expect(plainWords(page)).toHaveText('a bright saw, sustained');
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await expect(anyWords(page)).toHaveCount(0);
});

test('the octave buttons change no sound: a Preset keeps its about line, and no plain words come (issues 123, 126)', async ({ page }) => {
  const up = page.getByRole('button', { name: 'Octave up' });
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await up.click();
  await page.waitForTimeout(2 * WORDS_EVERY); // past the words' interval
  await expect(anyWords(page)).toHaveCount(0);
  await pick(page, 'Init');
  await up.click();
  await page.waitForTimeout(2 * WORDS_EVERY);
  await expect(description(page)).toBeVisible();
  await expect(anyWords(page)).toHaveCount(0);
  await nudge(page); // a change to the sound
  await expect(description(page)).toHaveCount(0);
  await expect(plainWords(page)).toBeVisible();
});

// Every Preset's phrase, as drawn and in wider type (the stand-in for DejaVu Sans), on one line in its place: clear of the Sections
// and within the Oscillators and the Filter from 861 px, inside the Patch name below; the header never moves.
for (const [width, height] of [[320, 640], [375, 812], [700, 830], [861, 800], [1100, 800], [1440, 900], [2000, 1100]] as const) {
  test(`at ${width} px the Patch’s plain words fit on one line or end in an ellipsis, and never move the header (issue 123)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    // Sizes, not places: on a phone the focus on the Cutoff scrolls the page, and the header slides up as it does.
    const sizes = () =>
      page.evaluate(() => ['header', '.patch-name'].map((s) => (({ width, height }) => ({ width, height }))(document.querySelector(s)!.getBoundingClientRect())));
    const before = await sizes();
    await nudge(page);
    await expect(plainWords(page)).toBeVisible();
    expect(await sizes()).toEqual(before);
    const phrases = PRESETS.map((p) => describePatch(p.patch));
    for (const spacing of SPACINGS) {
      const problems = await plainWords(page).evaluate(
        (line, [phrases, spacing]) => {
          line.style.letterSpacing = spacing as string;
          const rect = (el: Element | null) => el!.getBoundingClientRect();
          const section = (name: string) => document.querySelector(`section[aria-label="${name}"]`);
          const button = document.querySelector('.patch-name')!;
          const name = button.querySelector('span')!;
          const inButton = line.classList.contains('patch-name-words');
          const found: string[] = [];
          for (const phrase of [...(phrases as string[]), 'a phrase far longer than any Patch’s, to see it cut short at the end with an ellipsis']) {
            line.textContent = phrase;
            const b = rect(line);
            const tops = new Set([...line.getClientRects()].map((r) => Math.round(r.top)));
            if (tops.size > 1 || b.height > parseFloat(getComputedStyle(line).lineHeight) * 1.5) found.push(`${phrase}: more than one line`);
            if (line.scrollWidth > line.clientWidth + 1 && getComputedStyle(line).textOverflow !== 'ellipsis') found.push(`${phrase}: cut without an ellipsis`);
            if (inButton) {
              const box = rect(button);
              if (b.top < box.top || b.bottom > box.bottom + 0.5 || b.left < box.left || b.right > box.right + 0.5) found.push(`${phrase}: out of the Patch name`);
              if (rect(name).bottom > b.top + 0.5) found.push(`${phrase}: over the name`);
            } else {
              if (b.top < rect(document.querySelector('header')).bottom) found.push(`${phrase}: in the header`);
              if (b.bottom > rect(section('Oscillators')).top) found.push(`${phrase}: reaches the Sections`);
              if (b.right > rect(section('Filter')).right + 0.5) found.push(`${phrase}: wider than the Oscillators and the Filter`);
            }
          }
          return found;
        },
        [phrases, spacing] as const,
      );
      expect(problems, `letter-spacing ${spacing}`).toEqual([]);
    }
  });
}

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

test('the group names take a narrow column, each on one line, a long one in a shorter form (issue 156)', async ({ page }) => {
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
  expect(new Set(long.map((l) => Math.round(l.y))).size).toBe(1); // one line
  expect(Math.max(...long.map((l) => l.right))).toBeLessThanOrEqual(80);
  const name = menu.getByRole('group', { name: 'Movement & Effects' }).locator('.patch-group-name');
  await expect(name).toHaveText('Move & FX', { useInnerText: true });
  await expect(menu.getByRole('group', { name: 'Bass' }).locator('.patch-group-name')).toHaveText('Bass', { useInnerText: true }); // a short one whole
  // The name sits level with the row's first Preset.
  const [bass] = await lines('Bass');
  const first = (await menu.getByRole('group', { name: 'Bass' }).getByRole('button').first().boundingBox())!;
  expect(Math.abs(bass.y - (first.y + first.height / 2))).toBeLessThan(2);
});
