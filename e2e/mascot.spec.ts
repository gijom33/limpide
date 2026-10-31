import { expect, type Page, test } from '@playwright/test';
import { openDisplay } from './helpers';

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

/** What the drop overlaps, standing: the controls and values, and with `viewers` the Viewers too. */
const covered = (page: Page, viewers: boolean) =>
  mascot(page).evaluate((el, withViewers) => {
    const m = el.querySelector('.mascot-drop')!.getBoundingClientRect();
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
    await expect.poll(async () => Math.abs((await footing(page, section)).below) <= 1).toBe(true); // landed and standing
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
  await expect.poll(async () => Math.abs((await footing(page)).below) <= 1).toBe(true);
  // It came into view up from behind the Amp, or (one time in three) down from the top of the window.
  const came = await watched(page);
  expect(Math.max(...came) > 15 || Math.min(...came) < -60, `${Math.min(...came)} to ${Math.max(...came)}`).toBe(true);
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

test('once met, Display has a Bead switch: off, it melts and the Notes do nothing, remembered; on brings it up', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await openDisplay(page);
  await expect(page.getByRole('radiogroup', { name: 'Bead', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(1);
  await openDisplay(page);
  const bead = page.getByRole('radiogroup', { name: 'Bead', exact: true });
  await expect(bead.getByRole('radio', { name: 'Bead on' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.bead-icon')).toHaveAttribute('data-state', 'on');
  await bead.getByRole('radio', { name: 'Bead off' }).click();
  await expect(page.locator('.bead-icon')).toHaveAttribute('data-state', 'melting');
  await expect(mascot(page)).toHaveCount(0);
  await page.keyboard.press('Escape');
  await play(page, 'jdhs');
  await page.waitForTimeout(500);
  await expect(mascot(page)).toHaveCount(0);
  await page.reload();
  await listening(page);
  await play(page, 'jdhs');
  await page.waitForTimeout(500);
  await expect(mascot(page)).toHaveCount(0);
  await openDisplay(page);
  await expect(page.locator('.bead-icon')).toHaveAttribute('data-state', 'gone');
  await bead.getByRole('radio', { name: 'Bead on' }).click();
  await expect(mascot(page)).toHaveCount(1);
  await expect(page.locator('.bead-icon')).toHaveAttribute('data-state', 'popping');
});

test('a pointer over it tickles it; a click sends tiny drops every way', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await play(page, 'jdhs');
  await expect.poll(async () => Math.abs((await footing(page)).below) <= 1).toBe(true);
  // Its middle, on its own pixels.
  const middle = async () => {
    const box = (await page.locator('.mascot-drop').boundingBox())!;
    return { x: box.x + 9, y: box.y + box.height - 8 };
  };
  const at = await middle();
  const tilts: number[] = [];
  for (let i = 0; i < 12; i++) {
    await page.mouse.move(at.x + (i % 2), at.y);
    tilts.push(await page.locator('.mascot-drop').evaluate((el) => Number(el.style.transform.match(/rotate\(([-\d.]+)deg/)![1])));
    await page.waitForTimeout(40);
  }
  expect(Math.max(...tilts) - Math.min(...tilts)).toBeGreaterThan(4); // squirming
  const now = await middle();
  await page.mouse.click(now.x, now.y);
  await expect.poll(() => page.locator('.mascot-spray rect:not([style*="none"])').count()).toBeGreaterThan(4);
});

test('clicked again and again, it runs off', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await play(page, 'jdhs');
  await expect.poll(async () => Math.abs((await footing(page)).below) <= 1).toBe(true);
  const where = async () => {
    const box = (await page.locator('.mascot-drop').boundingBox())!;
    return { x: box.x + 9, y: box.y + box.height - 8 };
  };
  const start = await where();
  for (let i = 0; i < 7; i++) {
    const at = await where();
    if (Math.abs(at.x - start.x) > 30) break;
    await page.mouse.click(at.x, at.y);
    await page.waitForTimeout(120);
  }
  await expect.poll(async () => Math.abs((await where()).x - start.x), { timeout: 4000 }).toBeGreaterThan(40);
});

// Issue 127: what the controls, five words spelled with Notes, the pointer, the theme, the date and the Demo make of
// it. Its element says what it is doing (data-doing, data-tail, data-hat, data-act, data-moving), for these tests.

test('while it is out, words spelled with Notes cue its tricks; B, E, A, D still sends it away', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await play(page, 'sdhs'); // D, E, A, D before it is out: nothing
  await expect(mascot(page)).toHaveCount(0);
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(1);
  await play(page, 'sdhs');
  await expect(mascot(page)).toHaveAttribute('data-doing', 'playDead');
  await page.waitForTimeout(3500);
  await play(page, 'fhsd'); // F, A, D, E
  await expect(mascot(page)).toHaveAttribute('data-doing', 'ghost');
  await page.waitForTimeout(3000);
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(0);
});

test('a Waveform chosen: its tail takes that wave a moment, then is the logo again', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveAttribute('data-tail', 'logo');
  await page.getByRole('radio', { name: 'Square', exact: true }).first().click();
  await expect(mascot(page)).toHaveAttribute('data-tail', 'square');
  await expect(mascot(page)).toHaveAttribute('data-tail', 'logo', { timeout: 5000 });
});

test('dragged and let go, it is thrown, and lands on an edge', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await play(page, 'jdhs');
  await expect.poll(async () => Math.abs((await footing(page)).below) <= 1).toBe(true);
  const box = (await page.locator('.mascot-drop').boundingBox())!;
  const at = { x: box.x + 9, y: box.y + box.height - 8 };
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(at.x - i * 25, at.y - i * 12);
  await expect(mascot(page)).toHaveAttribute('data-moving', 'held');
  await page.mouse.up();
  await expect(mascot(page)).toHaveAttribute('data-moving', 'thrown');
  await expect(mascot(page)).toHaveAttribute('data-moving', 'standing', { timeout: 5000 });
  // Somewhere along to the left, on a section's top edge.
  const landed = await page.locator('.mascot-drop').evaluate((el) => {
    const drop = el.getBoundingClientRect();
    const tops = [...document.querySelectorAll('section[aria-label]')].map((s) => s.getBoundingClientRect().top);
    return { left: drop.left, onEdge: tops.some((top) => Math.abs(drop.bottom - top) <= 2) };
  });
  expect(landed.left).toBeLessThan(box.x - 50);
  expect(landed.onEdge).toBe(true);
});

test('on 31 October it wears a ghost sheet', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-31T12:00:00'));
  await page.goto('/');
  await listening(page);
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveAttribute('data-hat', 'ghost');
});

test('the theme switched: it shades its eyes once Display is closed', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await play(page, 'jdhs');
  await openDisplay(page);
  await page.getByRole('radio', { name: 'Light', exact: true }).click();
  await page.waitForTimeout(300);
  await expect(mascot(page)).not.toHaveAttribute('data-doing', 'shades');
  await page.getByRole('button', { name: 'Display' }).click();
  await expect(mascot(page)).toHaveAttribute('data-doing', 'shades');
});

test('through the Demo it conducts, then plays air guitar, then surfs an LFO shape, only an LFO that is on', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await play(page, 'jdhs');
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await expect(mascot(page)).toHaveAttribute('data-act', 'conduct');
  await page.getByRole('button', { name: /^Play from part 2,/ }).click();
  await expect(mascot(page)).toHaveAttribute('data-act', 'airGuitar');
  await page.getByRole('button', { name: /^Play from part 3,/ }).click();
  // By the mouse, which leaves the Demo playing (a key would take over from it).
  const depth = async (lfo: number) => {
    const box = (await page.getByRole('slider', { name: `LFO ${lfo} Depth`, exact: true }).boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  // Both LFOs off (a double-click puts each Depth back to its 0): no surfing; it conducts instead.
  for (const lfo of [1, 2]) {
    const at = await depth(lfo);
    await page.mouse.dblclick(at.x, at.y);
  }
  await expect(mascot(page)).toHaveAttribute('data-act', 'conduct');
  // LFO 1 on, its Depth dragged up: down onto its plot, riding along it.
  const at = await depth(1);
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.move(at.x, at.y - 120, { steps: 8 });
  await page.mouse.up();
  await expect(mascot(page)).toHaveAttribute('data-act', 'surf');
  await expect
    .poll(
      () =>
        page.locator('.mascot-drop').evaluate((el) => {
          const drop = el.getBoundingClientRect();
          const plot = document.querySelector('.lfo-plot[data-lfo="1"]')!.getBoundingClientRect();
          return drop.left >= plot.left - 1 && drop.right <= plot.right + 1 && drop.bottom > plot.top && drop.bottom < plot.bottom;
        }),
      { timeout: 5000 },
    )
    .toBe(true);
});
