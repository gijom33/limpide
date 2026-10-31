import { expect, type Page, test } from '@playwright/test';

// The mascot (issue 115): B, E, A, D played by hand, as in a bead of water, calls it up from behind the top right
// section, and again sends it away, melting. In three and four across it lives on that section's top edge, along the
// stretch that covers least above it: nothing, where the header has room. On a phone and in 2 × 2 it keeps in view as
// the page scrolls: on a right-column section's top edge, or hanging under the header.

const mascot = (page: Page) => page.locator('.mascot');
const listening = (page: Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

/** Plays Notes on the computer keyboard: J is B4, D E4, H A4, S D4 (B, E, A, D); A C4, F F4. */
async function play(page: Page, keys: string) {
  for (const key of keys) await page.keyboard.press(key);
}

/** Where its box stands against a section's top edge and sides, and how far the drop still is below that edge. */
const footing = (page: Page, section = 'Amp') =>
  mascot(page).evaluate((el: HTMLElement, name) => {
    const amp = document.querySelector(`section[aria-label="${name}"]`)!.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const drop = el.firstElementChild!.getBoundingClientRect();
    return { bottom: Math.round(box.bottom - amp.top), inside: box.left >= amp.left && box.right <= amp.right, below: Math.round(drop.bottom - amp.top) };
  }, section);

/** From now, each frame: how far the drop's foot is below the Amp's top edge (negative above it), while it is shown. */
const watchDrop = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { belows: number[] };
    w.belows = [];
    const sample = () => {
      const drop = document.querySelector('.mascot-drop');
      const amp = document.querySelector('section[aria-label="Amp"]');
      if (drop && amp) w.belows.push(drop.getBoundingClientRect().bottom - amp.getBoundingClientRect().top);
      if (w.belows.length < 300) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
const watched = (page: Page) => page.evaluate(() => (window as unknown as { belows: number[] }).belows);

/** What its box overlaps: the controls and values, and with `viewers` the Viewers too. */
const covered = (page: Page, viewers: boolean) =>
  mascot(page).evaluate((el, withViewers) => {
    const m = el.getBoundingClientRect();
    const controls = document.querySelectorAll<HTMLElement>(`button, [role=slider], [role=tab], [role=radio], input, .knob-value, .fader${withViewers ? ', canvas' : ''}`);
    return [...controls]
      .filter((c) => c.checkVisibility({ visibilityProperty: true }))
      .filter((c) => {
        const r = c.getBoundingClientRect();
        return r.width > 0 && r.left < m.right && r.right > m.left && r.top < m.bottom && r.bottom > m.top;
      })
      .map((c) => c.getAttribute('aria-label') ?? c.className);
  }, viewers);

test('B, E, A, D brings it and again sends it away; B, E, D, A does nothing', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await play(page, 'jdsh');
  await expect(mascot(page)).toHaveCount(0);
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(1);
  await expect(mascot(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(mascot(page)).toHaveCSS('pointer-events', 'none');
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(0);
});

test('it comes in any octave, from the piano too, and the Demo never calls it', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  const key = (name: string) => page.getByRole('group', { name: 'Piano' }).getByRole('button', { name, exact: true });
  for (const name of ['B4', 'E5', 'A4', 'D5']) {
    const box = (await key(name).boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8);
  }
  await expect(mascot(page)).toHaveCount(1);
  await play(page, 'jdhs'); // sent away
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await page.waitForTimeout(3000);
  await expect(mascot(page)).toHaveCount(0);
});

for (const [size, viewport, section] of [
  ['three across', { width: 1440, height: 900 }, 'Amp'],
  ['four across', { width: 1920, height: 1080 }, 'LFO & Envelopes'],
] as const) {
  test(`${size}: it stands on the top right section, ${section}, covering nothing`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await listening(page);
    await play(page, 'jdhs');
    await expect.poll(async () => (await footing(page, section)).below <= 0).toBe(true);
    // Strolling, held awake by a Note, it stays on the edge, within the section, covering nothing.
    await page.keyboard.down('f');
    for (let i = 0; i < 6; i++) {
      const { bottom, inside } = await footing(page, section);
      expect({ bottom, inside }).toEqual({ bottom: 0, inside: true });
      expect(await covered(page, true)).toEqual([]);
      await page.waitForTimeout(500);
    }
    await page.keyboard.up('f');
  });
}

/** Where the drop is in the window: on a right-column section's top edge, hanging under the header, or in between. */
const seen = (page: Page) =>
  page.evaluate(() => {
    const drop = document.querySelector('.mascot-drop')!.getBoundingClientRect();
    const ceiling = Math.max(0, ...['header', '.section-strip'].map((q) => document.querySelector(q)?.getBoundingClientRect().bottom ?? 0));
    const right = Math.max(...[...document.querySelectorAll('section.block, section[aria-label="LFO & Envelopes"]')].map((s) => s.getBoundingClientRect().right));
    const edge = [...document.querySelectorAll<HTMLElement>('section[aria-label]')].find((s) => {
      const r = s.getBoundingClientRect();
      return Math.abs(r.right - right) < 4 && Math.abs(r.top - drop.bottom) < 2.5; // a stroll bobs it a pixel
    });
    return {
      // Swinging from its tip under the header, its box reaches a little past the line.
      inView: drop.top >= ceiling - 6 && drop.bottom <= innerHeight + 1,
      on: edge ? edge.getAttribute('aria-label') : Math.abs(drop.top - ceiling) < 4 ? 'header' : null,
    };
  });

/** Scrolls through the page, down then up, noting where the drop is each time it has settled, and that it is in view. */
async function scrollThrough(page: Page, step: number) {
  const places: (string | null)[] = [];
  const at = async (y: number) => {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(1200); // it falls or flies there, lands and recovers
    const where = await seen(page);
    expect(where.inView, `scrolled to ${y}`).toBe(true);
    places.push(where.on);
  };
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= height; y += step) await at(y);
  for (let y = height; y >= 0; y -= step) await at(y);
  return places;
}

for (const [size, viewport, column] of [
  ['phone', { width: 375, height: 812 }, ['Oscillators', 'Filter', 'Amp', 'LFO & Envelopes']],
  ['2 × 2, a shorter window', { width: 690, height: 640 }, ['Filter', 'LFO & Envelopes']],
] as const) {
  test(`${size}: it keeps in view as the page scrolls, falling to lower edges, in the right column`, async ({ page }) => {
    test.slow();
    await page.setViewportSize(viewport);
    await page.goto('/');
    await listening(page);
    await play(page, 'jdhs');
    const places = await scrollThrough(page, 250);
    const edges = places.filter((p) => p !== 'header' && p !== null);
    expect(edges.every((p) => (column as readonly string[]).includes(p!)), places.join(', ')).toBe(true);
    // It moved with the page: more than one place, a later section on the way down.
    expect(new Set(places).size, places.join(', ')).toBeGreaterThan(1);
    const order = (p: string | null) => (column as readonly (string | null)[]).indexOf(p);
    expect(Math.max(...places.slice(0, places.length / 2).map(order)), places.join(', ')).toBeGreaterThan(0);
  });
}

test('in a short phone window, with no edge in view, it hangs under the header', async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 375, height: 560 });
  await page.goto('/');
  await listening(page);
  await play(page, 'jdhs');
  const places = await scrollThrough(page, 120);
  expect(places, places.join(', ')).toContain('header');
});

test('it comes up from behind the Amp, and leaves jumping, then melting; with reduced motion it comes and goes at once', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await watchDrop(page);
  await play(page, 'jdhs');
  await expect.poll(async () => (await footing(page)).below <= 0).toBe(true);
  expect(Math.max(...(await watched(page)))).toBeGreaterThan(15); // it came up from behind the Amp
  await watchDrop(page);
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(0);
  expect(Math.min(...(await watched(page)))).toBeLessThan(-8); // it jumped before it melted
  await play(page, 'jdhs'); // after it melts, it can come again
  await expect(mascot(page)).toHaveCount(1);
  await play(page, 'jdhs');
  await play(page, 'jdhs'); // while it melts, nothing calls it back
  await expect(mascot(page)).toHaveCount(0);
  await page.waitForTimeout(500);
  await expect(mascot(page)).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(1);
  expect((await footing(page)).below).toBeLessThanOrEqual(0);
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(0, { timeout: 500 });
});

test('it adds under a millisecond to each frame the Viewers draw (their own runs vary by half that)', async ({ page }) => {
  // Every frame callback's run time, summed: the Viewers' render loop is one of them (ADR-0002).
  await page.addInitScript(() => {
    const w = window as unknown as { frameWork: number; frames: number };
    w.frameWork = 0;
    w.frames = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      raf((time) => {
        const start = performance.now();
        callback(time);
        w.frameWork += performance.now() - start;
        w.frames++;
      });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  const perFrame = async () => {
    await page.keyboard.down('f'); // F4 held, so the Viewers draw a sound
    await page.evaluate(() => Object.assign(window, { frameWork: 0, frames: 0 }));
    await page.waitForTimeout(2000);
    await page.keyboard.up('f');
    return page.evaluate(() => (window as unknown as { frameWork: number }).frameWork / (window as unknown as { frames: number }).frames);
  };
  const without = Math.min(await perFrame(), await perFrame());
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(1);
  const shown = Math.min(await perFrame(), await perFrame());
  expect(shown - without).toBeLessThan(1);
});
