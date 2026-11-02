import { expect, type Page, test } from '@playwright/test';
import { type AuditOptions, auditPage } from './audit';

// Issue 44: one header across the layouts, its controls the same at every width (the Wordmark and the Patch; the
// keyboard; Hold, the tempo, MIDI, Display, About; Demo, Tutorial, Song), and Tab meeting them as they stand on screen
// (issue 104); the octave buttons stacked beside the piano. Up to 860 px three rows, the buttons on one, the piano's 17
// keys at a finger's width, and the rows above the keyboard slide away on scrolling (issue 152). From 861 px one line:
// the buttons right of the keyboard in columns of two (arrangement C), the piano growing into the room they leave
// (issue 154).

const SIZES = {
  phone: [390, 844],
  foldable: [690, 830],
  laptop: [1440, 900],
  wide: [1920, 1080],
} as const;

async function header(page: Page) {
  // WebKit can run this before React has drawn the header: wait for its keys.
  await page.locator('.piano button').first().waitFor();
  return page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const button = (name: string) => box(document.querySelector(`header button[aria-label="${name}"]`)!);
    const white = [...document.querySelectorAll<HTMLElement>('.piano button:not([data-black])')].filter((k) => k.getBoundingClientRect().width > 0);
    const shown = (el: Element | null) => !!el && (el as HTMLElement).offsetWidth > 0;
    return {
      demo: button('Demo'), tutorial: button('Tutorial'), song: button('Song'), hold: button('Hold'),
      midi: button('MIDI'), display: button('Display'), about: button('About'),
      up: button('Octave up'), down: button('Octave down'),
      bpm: box(document.querySelector('header [role="spinbutton"][aria-label="Tempo"], header button[aria-label="Tempo"]')!),
      tap: document.querySelector('header [aria-label="Tap"]') ? button('Tap') : null,
      header: box(document.querySelector('header')!),
      piano: box(document.querySelector('.piano')!),
      words: ['Hold', 'MIDI', 'Display', 'About', 'Demo', 'Tutorial', 'Song'].filter((name) =>
        shown(document.querySelector(`header button[aria-label="${name}"] :is(.tool-word, .demo-word)`)),
      ),
      unit: shown(document.querySelector('header .tempo-unit')),
      whiteKeys: white.length,
      whiteKey: white[0].getBoundingClientRect().width,
    };
  });
}

for (const [size, [width, height]] of Object.entries(SIZES)) {
  test(`at ${width}×${height} (${size}) the header's buttons placed for the layout (up to 860 px Demo, Tutorial, Song and Hold, MIDI, Display, About each read left to right; wider, Hold against the piano, then the tempo); the octave buttons stacked left of the piano`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const h = await header(page);
    expect(h.up.bottom).toBeLessThanOrEqual(h.down.top + 1);
    expect(h.up.right).toBeLessThanOrEqual(h.piano.left);
    if (size === 'laptop' || size === 'wide') {
      // Right of the keyboard, arrangement C (issue 154): Hold against the piano, then the columns, checked below.
      expect(h.piano.right).toBeLessThanOrEqual(h.hold.left);
      expect(h.hold.right).toBeLessThanOrEqual(h.bpm.left);
    } else {
      // The buttons on a row of their own, each group left to right, the keyboard under them.
      expect(h.demo.right).toBeLessThanOrEqual(h.tutorial.left);
      expect(h.tutorial.right).toBeLessThanOrEqual(h.song.left);
      expect(h.hold.right).toBeLessThanOrEqual(h.midi.left);
      expect(h.midi.right).toBeLessThanOrEqual(h.display.left);
      expect(h.display.right).toBeLessThanOrEqual(h.about.left);
      expect(h.piano.top).toBeGreaterThanOrEqual(h.demo.bottom);
      expect(h.demo.top).toBe(h.about.top);
    }
  });
}

// Issue 154, arrangement C (decided by the owner): from 861 px, Hold one tall button against the piano, then columns of
// two read outward from the keys, top before bottom: BPM over Tap, Demo over Song, Tutorial over About, MIDI over
// Display; 4 px between the columns of one use, 14 px between uses; in a column both buttons as wide; one shape at
// every width, the words kept while there is room (the newcomer's four from 1100 px, every one from 1280 px).
const C_WIDTHS = [
  [861, []],
  [1100, ['About', 'Demo', 'Tutorial', 'Song']],
  [1440, ['Hold', 'MIDI', 'Display', 'About', 'Demo', 'Tutorial', 'Song']],
  [1920, ['Hold', 'MIDI', 'Display', 'About', 'Demo', 'Tutorial', 'Song']],
] as const;
for (const [width, words] of C_WIDTHS) {
  test(`at ${width} px the buttons right of the keyboard stand in columns of two, Hold one tall button against the piano (issue 154)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const h = await header(page);
    const tap = h.tap!;
    expect(h.piano.right).toBeLessThanOrEqual(h.hold.left);
    // Hold as tall as both rows.
    expect(Math.abs(h.hold.top - h.bpm.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(h.hold.bottom - tap.bottom)).toBeLessThanOrEqual(1);
    // Each column one thing, its two buttons one over the other and as wide, the tops on one line.
    for (const [top, bottom] of [[h.bpm, tap], [h.demo, h.song], [h.tutorial, h.about], [h.midi, h.display]]) {
      expect(Math.abs(top.left - bottom.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(top.width - bottom.width)).toBeLessThanOrEqual(1);
      expect(bottom.top).toBeGreaterThanOrEqual(top.bottom);
      expect(Math.abs(top.top - h.bpm.top)).toBeLessThanOrEqual(1);
    }
    // 4 px within a use, 14 between uses.
    const gaps = [h.bpm.left - h.hold.right, h.demo.left - h.bpm.right, h.tutorial.left - h.demo.right, h.midi.left - h.tutorial.right];
    for (const [i, gap] of [4, 14, 4, 14].entries()) expect(Math.abs(gaps[i] - gap), `gap ${i + 1}: ${gaps.join(', ')}`).toBeLessThanOrEqual(1);
    expect(h.midi.right).toBeLessThanOrEqual(h.header.right);
    expect(h.header.height).toBeLessThanOrEqual(64);
    expect([...h.words].sort()).toEqual([...words].sort());
    expect(h.unit).toBe(width >= 1280);
    // Each word step leaves the piano its 10 white keys at about 42 px (a little under in Linux's wider fonts).
    if (width === 1100) expect(h.whiteKey).toBeGreaterThanOrEqual(40);
    if (width === 861) expect(h.whiteKey).toBeGreaterThanOrEqual(30);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const [size, [width, height]] of Object.entries(SIZES)) {
  test(`at ${width}×${height} (${size}) Tab meets the header's controls as they stand on screen: each one right of the last, or on a row below it (issue 104)`, async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari tabs to buttons only when its settings ask it to');
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.locator('.piano button').first().waitFor();
    const stops: { name: string; left: number; right: number; top: number; bottom: number }[] = [];
    await page.keyboard.press('Tab');
    for (;;) {
      const stop = await page.evaluate(() => {
        const el = document.activeElement!;
        if (!el.closest('header')) return null;
        const r = el.getBoundingClientRect();
        return { name: el.getAttribute('aria-label') ?? el.textContent ?? '', left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      if (!stop) break;
      stops.push(stop);
      await page.keyboard.press('Tab');
    }
    const names = stops.map((s) => s.name);
    for (const name of ['Octave up', 'Octave down', 'Hold', 'MIDI', 'Display', 'About', 'Demo', 'Tutorial', 'Song']) expect(names).toContain(name);
    for (let i = 1; i < stops.length; i++) {
      const [a, b] = [stops[i - 1], stops[i]];
      expect(b.left >= a.right - 1 || b.top >= a.bottom - 1, `${a.name} → ${b.name}: ${names.join(', ')}`).toBe(true);
    }
  });
}

test(`the piano's 17 keys at a finger's width in the sections 2 × 2`, async ({ page }) => {
  await page.setViewportSize({ width: 690, height: 830 });
  await page.goto('/');
  const h = await header(page);
  expect(h.whiteKeys).toBe(10);
  expect(h.whiteKey).toBeCloseTo(44, 0);
  expect(h.piano.height).toBe(64);
});

// Issue 154 (decision 6): from 861 px the piano grows by whole keys, to the right, into the room the buttons leave it:
// its white keys at most 44 px, and never under 42 once it has more than the letter keys' 10.
for (const [size, [width, height]] of Object.entries(SIZES).filter(([s]) => s === 'laptop' || s === 'wide')) {
  test(`at ${width}×${height} (${size}) the piano has more keys than the letter keys' 17, each a finger's width (issue 154)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const h = await header(page);
    expect(h.whiteKeys).toBeGreaterThan(size === 'wide' ? 20 : 12);
    expect(h.whiteKey).toBeGreaterThanOrEqual(42);
    expect(h.whiteKey).toBeLessThanOrEqual(44);
    expect(h.piano.height).toBe(64);
    // What is left over, under one key, opens between the Patch and the keyboard: the keyboard meets Hold 12 px away.
    expect(h.hold.left - h.piano.right).toBeLessThanOrEqual(12);
  });
}

test('at the top octave the piano stops at G9 and still meets Hold, its keys as wide (issue 154)', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const before = await header(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Octave up' }).click(); // C7, the highest
  await expect(page.getByRole('group', { name: 'Piano' }).getByRole('button').last()).toHaveAccessibleName('G9');
  const h = await header(page);
  expect(h.whiteKeys).toBeLessThan(before.whiteKeys);
  expect(h.whiteKey).toBeCloseTo(before.whiteKey, 1);
  expect(h.hold.left - h.piano.right).toBeLessThanOrEqual(12);
});

test('on the narrowest laptop windows the piano takes what the header leaves, its keys still 26 px or more', async ({ page }) => {
  for (const [width, min] of [[861, 26], [1000, 30]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const h = await header(page);
    expect(h.whiteKeys).toBe(10);
    expect(h.whiteKey).toBeGreaterThanOrEqual(min);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

// Issue 157: never narrower than the narrowest phone (320 px). From there up the playing and set-up buttons sit side
// by side on their row, each a finger tall and at least 32 px wide (the phone's waiver accepts 28), and no two controls
// lie over each other; in a narrower window the page keeps its 320 px layout and scrolls sideways.
for (const width of [280, 320, 340, 375]) {
  test(`at ${width} px the playing and set-up buttons sit side by side and nothing lies over anything, the page ${width < 320 ? 'laid out at 320 px, scrolling sideways' : 'as wide as the window'} (issue 157)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/');
    await page.locator('.piano button').first().waitFor();
    const names = ['Demo', 'Tutorial', 'Song', 'Hold', 'Tempo', 'MIDI', 'Display', 'About'];
    const row = page.locator('header');
    const boxes = await Promise.all(names.map(async (name) => (await row.getByRole('button', { name, exact: true }).boundingBox())!));
    for (let i = 0; i < names.length; i++) {
      expect(boxes[i].height, names[i]).toBeGreaterThanOrEqual(44);
      expect(boxes[i].width, names[i]).toBeGreaterThanOrEqual(32);
      expect(boxes[i].y, names[i]).toBeCloseTo(boxes[0].y, 0);
      if (i) expect(boxes[i].x, `${names[i - 1]} → ${names[i]}`).toBeGreaterThanOrEqual(boxes[i - 1].x + boxes[i - 1].width);
    }
    expect(boxes[7].x + boxes[7].width).toBeLessThanOrEqual(Math.max(width, 320));
    const overlapOnly: AuditOptions = { rules: ['overlap'], minTarget: 0, waivers: [] };
    const { unexpected } = await page.evaluate(auditPage, overlapOnly);
    expect(unexpected).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(Math.max(width, 320));
    if (width < 320) {
      await page.evaluate(() => scrollTo(320, 0));
      expect(await page.evaluate(() => scrollX)).toBe(320 - width);
    }
  });
}

test.describe('the sections 2 × 2', () => {
  test.use({ viewport: { width: 690, height: 830 } });

  test('the playing and set-up buttons are a finger tall, icon over word', async ({ page }) => {
    await page.goto('/');
    for (const name of ['Demo', 'Tutorial', 'Song', 'Hold', 'MIDI', 'Display', 'About']) {
      const button = page.locator(`header button[aria-label="${name}"]`);
      expect((await button.boundingBox())!.height, name).toBeGreaterThanOrEqual(44);
      await expect(button.getByText(name, { exact: true }), name).toBeVisible();
    }
  });
});

// Issue 152: from 601 to 860 px the phone's three rows: the logo and the Patch, its name as wide as the row allows
// (wider than the two-row header's, which gave it 110 px at 601, 165 at 700 and 240 at 860); the playing buttons on
// the left and set-up on the right; the keyboard with its 17 keys. Scrolling down slides the top two rows away, as on
// a phone.
for (const [width, narrowest] of [[601, 110], [700, 165], [860, 240]] as const) {
  test(`at ${width} px the header has three rows, the Patch name the width of its row, and nothing lies over anything (issue 152)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 830 });
    await page.goto('/');
    await page.locator('.piano button').first().waitFor();
    const h = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const names = ['Demo', 'Tutorial', 'Song', 'Hold', 'Tempo', 'MIDI', 'Display', 'About'];
      return {
        header: box('header'), logo: box('header h1'), name: box('.patch-name'), next: box('header [aria-label="Next Preset"]'),
        buttons: names.map((name) => ({ name, ...box(`header [aria-label="${name}"]`).toJSON() })),
        piano: box('.piano'), padding: parseFloat(getComputedStyle(document.querySelector('header')!).paddingRight),
        keys: [...document.querySelectorAll('.piano button:not([data-black])')].filter((k) => k.getBoundingClientRect().width > 0).length,
      };
    });
    const demo = h.buttons.find((b) => b.name === 'Demo')!;
    const about = h.buttons.find((b) => b.name === 'About')!;
    // Row one: the logo and the Patch, the name reaching the row's end.
    for (const b of h.buttons) expect(b.top, b.name).toBeGreaterThanOrEqual(Math.max(h.logo.bottom, h.name.bottom));
    expect(h.name.width).toBeGreaterThan(narrowest);
    expect(h.next.right).toBeCloseTo(h.header.right - h.padding, 0);
    // Row two: every button on one line, Demo at the row's left, About at its right, each a finger tall.
    for (const b of h.buttons) {
      expect(b.top, b.name).toBeCloseTo(demo.top, 0);
      expect(b.height, b.name).toBeGreaterThanOrEqual(44);
    }
    expect(demo.left).toBeCloseTo(h.logo.left, 0);
    expect(about.right).toBeCloseTo(h.next.right, 0);
    // Row three: the keyboard, its 17 keys (10 of them white).
    expect(h.piano.top).toBeGreaterThanOrEqual(demo.bottom);
    expect(h.keys).toBe(10);
    const overlapOnly: AuditOptions = { rules: ['overlap'], minTarget: 0, waivers: [] };
    const { unexpected } = await page.evaluate(auditPage, overlapOnly);
    expect(unexpected).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });

  test(`at ${width} px scrolling down slides the header's top two rows away until only the keyboard shows; scrolling up brings them back (issue 152)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 830 });
    await page.goto('/');
    const logo = page.getByRole('heading', { level: 1, name: 'Limpide' });
    const piano = page.getByRole('group', { name: 'Piano' });
    const header = page.locator('header');
    const tall = await header.evaluate((h) => h.getBoundingClientRect().height);
    const oscillators = page.getByRole('region', { name: 'Oscillators', exact: true });
    const oscTop = await oscillators.evaluate((s) => s.getBoundingClientRect().top + scrollY);
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 120);
    // The page is short here: wait for the wheel's scroll to end, or the scroll back up can be lost in it.
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(360);
    await expect(logo).not.toBeInViewport();
    for (const name of ['Demo', 'About']) await expect(header.getByRole('button', { name, exact: true })).not.toBeInViewport();
    await expect.poll(() => piano.boundingBox().then((b) => Math.round(b!.y))).toBeLessThanOrEqual(8);
    // Nothing below moves: the header keeps its height, the Sections their place on the page.
    expect(await header.evaluate((h) => h.getBoundingClientRect().height)).toBe(tall);
    expect(await oscillators.evaluate((s) => s.getBoundingClientRect().top + scrollY)).toBe(oscTop);
    await page.mouse.wheel(0, -60);
    await expect(logo).toBeInViewport();
    await expect(header.getByRole('button', { name: 'Demo', exact: true })).toBeInViewport();
  });
}

// Issue 105 (the 1.16.0 review): at 601 px the Patch name had a 17 px text box, every Preset read "I…"; at 861 to
// 1100 px longer names were cut where the header had room for more.
test.describe('the Patch name', () => {
  /** The Presets' names, once each, from the Patches panel. */
  const presetNames = async (page: Page) => {
    await page.getByRole('button', { name: /^Patch: / }).click();
    const names = [...new Set(await page.locator('.patch-presets .patch-item').allTextContents())];
    await page.keyboard.press('Escape');
    return names;
  };
  /** Each name shown in the Patch button in turn: those it cuts, with their width and the text box's. */
  const cutNames = (page: Page, names: string[]) =>
    page.evaluate((names) => {
      const text = document.querySelector('.patch-name > span')!;
      const shown = text.textContent;
      const cut = names.flatMap((name) => {
        text.textContent = name;
        return text.scrollWidth > text.clientWidth ? [{ name, width: text.scrollWidth }] : [];
      });
      text.textContent = 'W'.repeat(60);
      const room = text.clientWidth;
      text.textContent = shown;
      return { cut, room };
    }, names);

  // With a row of its own beside the logo, the Patch name shows every Preset's whole from 601 px (issues 105 and 152).
  for (const width of [601, 860]) {
    test(`at ${width} px every Preset's name shows whole (issues 105 and 152)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const { cut } = await cutNames(page, await presetNames(page));
      expect(cut).toEqual([]);
    });
  }

  for (const width of [861, 900, 1000, 1100, 1279]) {
    test(`at ${width} px a name is cut only where its box has no room left for it (issue 105)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const names = await presetNames(page);
      const { cut, room } = await cutNames(page, names);
      test.info().annotations.push({ type: 'cut', description: `${room} px: ${cut.map((c) => c.name).join(', ') || 'none'}` });
      for (const c of cut) expect(c.width, c.name).toBeGreaterThan(room);
      // Since issue 154 the name keeps its fixed width there: the room the header has left goes to the piano's keys.
    });
  }
});
