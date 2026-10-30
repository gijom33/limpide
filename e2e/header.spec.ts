import { expect, type Page, test } from '@playwright/test';

// Issue 44: one header across the layouts. Its groups the same at every width (the Wordmark and the Patch; the keyboard;
// Hold, MIDI, Display, About; Demo, Tutorial, Song: the owner, 2026-10-29), each layout placing them in rows of its own,
// and Tab meeting them as they stand on screen (issue 104); the octave buttons stacked beside the piano, and from 601 px
// up the piano's 17 keys at a finger's width where there is room. In the sections 2 × 2 the header stays at the top and
// slides its first row away, as on a phone.

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
      return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
    };
    const button = (name: string) => box(document.querySelector(`header button[aria-label="${name}"]`)!);
    const white = [...document.querySelectorAll<HTMLElement>('.piano button:not([data-black])')].filter((k) => k.getBoundingClientRect().width > 0);
    return {
      demo: button('Demo'), tutorial: button('Tutorial'), song: button('Song'), hold: button('Hold'),
      midi: button('MIDI'), display: button('Display'), about: button('About'),
      up: button('Octave up'), down: button('Octave down'),
      piano: box(document.querySelector('.piano')!),
      whiteKeys: white.length,
      whiteKey: white[0].getBoundingClientRect().width,
    };
  });
}

for (const [size, [width, height]] of Object.entries(SIZES)) {
  test(`at ${width}×${height} (${size}) Demo, Tutorial, Song and Hold, MIDI, Display, About each read left to right, placed for the layout; the octave buttons stacked left of the piano`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const h = await header(page);
    expect(h.demo.right).toBeLessThanOrEqual(h.tutorial.left);
    expect(h.tutorial.right).toBeLessThanOrEqual(h.song.left);
    expect(h.hold.right).toBeLessThanOrEqual(h.midi.left);
    expect(h.midi.right).toBeLessThanOrEqual(h.display.left);
    expect(h.display.right).toBeLessThanOrEqual(h.about.left);
    expect(h.up.bottom).toBeLessThanOrEqual(h.down.top + 1);
    expect(h.up.right).toBeLessThanOrEqual(h.piano.left);
    if (size === 'laptop') {
      // Right of the keyboard, two rows: set-up over Demo, Tutorial and Song, so the Patch sits beside the logo (the owner,
      // 2026-10-29), Hold first on the right (the owner, 2026-10-27).
      expect(h.piano.right).toBeLessThanOrEqual(Math.min(h.hold.left, h.demo.left));
      expect(h.demo.top).toBeGreaterThanOrEqual(h.about.bottom);
    } else if (size === 'wide') {
      // One row right of the keyboard: Hold first, then the rest of set-up, then Demo, Tutorial and Song.
      expect(h.piano.right).toBeLessThanOrEqual(h.hold.left);
      expect(h.about.right).toBeLessThanOrEqual(h.demo.left);
      for (const b of [h.demo, h.about]) expect(b.top).toBeGreaterThanOrEqual(h.piano.top);
    } else {
      // The buttons on a row of their own, the keyboard under them.
      expect(h.piano.top).toBeGreaterThanOrEqual(h.demo.bottom);
      expect(h.demo.top).toBe(h.about.top);
    }
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

for (const [size, [width, height]] of Object.entries(SIZES).filter(([s]) => s !== 'phone')) {
  test(`the piano's 17 keys at a finger's width at ${width}×${height} (${size})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const h = await header(page);
    expect(h.whiteKeys).toBe(10);
    expect(h.whiteKey).toBeCloseTo(44, 0);
    expect(h.piano.height).toBe(64);
  });
}

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

  test('scrolling down slides the header up until only the keyboard shows; scrolling up brings it back', async ({ page }) => {
    await page.goto('/');
    const logo = page.getByRole('heading', { level: 1, name: 'Limpide' });
    const piano = page.getByRole('group', { name: 'Piano' });
    const tall = await page.locator('header').evaluate((h) => h.getBoundingClientRect().height);
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 120);
    // The page is short here: wait for the wheel's scroll to end, or the scroll back up can be lost in it.
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(360);
    await expect(logo).not.toBeInViewport();
    await expect(page.locator('header button[aria-label="Demo"]')).not.toBeInViewport();
    await expect.poll(() => piano.boundingBox().then((b) => Math.round(b!.y))).toBeLessThanOrEqual(8);
    expect(await page.locator('header').evaluate((h) => h.getBoundingClientRect().height)).toBe(tall);
    await page.mouse.wheel(0, -60);
    await expect(logo).toBeInViewport();
  });
});

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

  test('at 601 px a short name shows whole: Init, Kick (issue 105)', async ({ page }) => {
    await page.setViewportSize({ width: 601, height: 900 });
    await page.goto('/');
    const { cut } = await cutNames(page, ['Init', 'Kick', 'Bass', 'Acid']);
    expect(cut).toEqual([]);
  });

  for (const width of [861, 900, 1000, 1100, 1279]) {
    test(`at ${width} px a name is cut only where the header has no room left for it (issue 105)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const names = await presetNames(page);
      const { cut, room } = await cutNames(page, names);
      test.info().annotations.push({ type: 'cut', description: `${room} px: ${cut.map((c) => c.name).join(', ') || 'none'}` });
      for (const c of cut) expect(c.width, c.name).toBeGreaterThan(room);
      // Its column has nothing more to give: the name takes the column's spare room, up to the widest Preset's.
      const spare = await page.evaluate(() => {
        const column = document.querySelector('.header-left')!.getBoundingClientRect();
        return column.right - document.querySelector('header [aria-label="Next Preset"]')!.getBoundingClientRect().right;
      });
      if (cut.length) expect(spare).toBeLessThanOrEqual(1);
    });
  }
});
