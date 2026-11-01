import { expect, type Page, test } from '@playwright/test';
import { openDisplay } from './helpers';
import { holding, WELCOMED } from './startState';

// The mascot (issue 115): B, E, A, D played by hand, as in a bead of water, calls it up from behind the top right
// section, and again sends it away, melting. In three and four across it lives on that section's top edge, along the
// stretch that covers least above it: nothing, where the header has room. On a phone and in 2 × 2 it keeps in view as
// the page scrolls: on a right-column section's top edge (over a phone's section tabs while an edge shows under them,
// issue 142), or hovering on its tail under the header when none shows (issue 142). Out by default, it comes in by itself (issue 150). With
// Display's switch off the Notes do nothing (decision 9), so these tests start with it switched off, as every spec does,
// and bring it with the switch; then the Notes send it away and call it back for the visit. Those about its default
// start as they need.

const mascot = (page: Page) => page.locator('.mascot');
const listening = (page: Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
/** Bead's height on screen, in pixels, as the Mascot draws it. */
const BEAD_HEIGHT = 26;
const beadSwitch = (page: Page) => page.getByRole('radiogroup', { name: 'Bead', exact: true });

/** Brings Bead up by Display's switch, then closes Display. */
async function bringBead(page: Page) {
  await openDisplay(page);
  await beadSwitch(page).getByRole('radio', { name: 'Bead on' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
  await expect(mascot(page)).toHaveCount(1);
}

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

test('with the switch on, B, E, A, D sends it away and again brings it; B, E, D, A does nothing (issue 150, decision 8)', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await bringBead(page);
  await expect(mascot(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(mascot(page)).toHaveCSS('pointer-events', 'none');
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(0);
  await play(page, 'jdsh');
  await page.waitForTimeout(500);
  await expect(mascot(page)).toHaveCount(0);
  await play(page, 'jdhs');
  await expect(mascot(page)).toHaveCount(1);
});

test('it comes in any octave, from the piano too, and the Demo never calls it', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await bringBead(page);
  await play(page, 'jdhs'); // sent away for the visit, the switch still on
  await expect(mascot(page)).toHaveCount(0);
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
    await bringBead(page);
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

/**
 * Where the drop is in the window: on a right-column section's top edge, hovering a little under the header or the
 * section tabs and never over them (issue 142), or in between.
 */
const seen = (page: Page) =>
  page.evaluate((beadHeight) => {
    const drop = document.querySelector('.mascot-drop')!.getBoundingClientRect();
    const [header, strip] = ['header', '.section-strip'].map((q) => document.querySelector(q)?.getBoundingClientRect().bottom ?? 0);
    const ceiling = Math.max(0, header, strip);
    const right = Math.max(...[...document.querySelectorAll('section.block, section[aria-label="LFO & Envelopes"]')].map((s) => s.getBoundingClientRect().right));
    const edge = [...document.querySelectorAll<HTMLElement>('section[aria-label]')].find((s) => {
      const r = s.getBoundingClientRect();
      return Math.abs(r.right - right) < 4 && Math.abs(r.top - drop.bottom) < 2.5; // a stroll bobs it a pixel
    });
    return {
      // On an edge just under a phone's section strip, its top is over the strip's foot by up to its height (issue 142):
      // its height less the edge left showing, so its whole height at most.
      inView: drop.top >= ceiling - (strip > header ? beadHeight : 0) && drop.bottom <= innerHeight + 1,
      // For a failure's message: where it was against the ceiling and the window, and how.
      at: `top ${Math.round(drop.top)}, bottom ${Math.round(drop.bottom)}, ceiling ${Math.round(ceiling)}, window ${innerHeight}, ${document.querySelector<HTMLElement>('.mascot')!.dataset.moving}`,
      on: edge
        ? edge.getAttribute('aria-label')
        : document.querySelector<HTMLElement>('.mascot')!.dataset.moving === 'hovering' && drop.top >= ceiling && drop.top - ceiling <= 8
          ? 'hovering'
          : null,
    };
  }, BEAD_HEIGHT);

/** Scrolls through the page, down then up, noting where the drop is each time it has settled, and that it is in view. */
async function scrollThrough(page: Page, step: number) {
  const places: (string | null)[] = [];
  const at = async (y: number) => {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(1200); // it falls or flies there, lands and recovers
    // On a busy machine its flight may take longer: once it has settled, standing or hovering.
    await expect(mascot(page)).toHaveAttribute('data-moving', /^(standing|hovering)$/, { timeout: 5000 });
    const where = await seen(page);
    expect(where.inView, `scrolled to ${y}: ${where.at}`).toBe(true);
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
    await bringBead(page);
    const places = await scrollThrough(page, 250);
    const edges = places.filter((p) => p !== 'hovering' && p !== null);
    expect(edges.every((p) => (column as readonly string[]).includes(p!)), places.join(', ')).toBe(true);
    // It moved with the page: more than one place, a later section on the way down.
    expect(new Set(places).size, places.join(', ')).toBeGreaterThan(1);
    const order = (p: string | null) => (column as readonly (string | null)[]).indexOf(p);
    expect(Math.max(...places.slice(0, places.length / 2).map(order)), places.join(', ')).toBeGreaterThan(0);
  });
}

/** Each frame for `seconds`: the drop's top under the ceiling (the header or the section tabs), its left, and its tail's turn. */
const watchHover = (page: Page, seconds: number) =>
  page.evaluate(
    (ms) =>
      new Promise<{ under: number; left: number; tail: string; moving: string }[]>((done) => {
        const samples: { under: number; left: number; tail: string; moving: string }[] = [];
        const start = performance.now();
        const sample = () => {
          const drop = document.querySelector('.mascot-drop')!.getBoundingClientRect();
          const [header, strip] = ['header', '.section-strip'].map((q) => document.querySelector(q)?.getBoundingClientRect().bottom ?? 0);
          samples.push({
            under: drop.top - Math.max(0, header, strip),
            left: drop.left,
            tail: document.querySelector('#bead-self > g')!.getAttribute('transform') ?? '',
            moving: document.querySelector<HTMLElement>('.mascot')!.dataset.moving ?? '',
          });
          if (performance.now() - start < ms) requestAnimationFrame(sample);
          else done(samples);
        };
        requestAnimationFrame(sample);
      }),
    seconds * 1000,
  );

test('in a short phone window, with no edge in view, it hovers on its tail where it lost ground, under the tabs (issue 142)', async ({ page }) => {
  test.slow();
  await page.goto('/');
  await listening(page);
  await bringBead(page); // before the window shrinks, which would put Display's switch out of reach
  await page.setViewportSize({ width: 375, height: 560 });
  const places = await scrollThrough(page, 120);
  expect(places, places.join(', ')).toContain('hovering');
  // Down the page from the top, a step at a time, until its edge goes and none is left in view.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(mascot(page)).toHaveAttribute('data-moving', 'standing', { timeout: 5000 });
  let lostAt: number | null = null;
  for (let y = 60; lostAt === null; y += 60) {
    expect(y, 'no edge ever left it').toBeLessThan(4000);
    const before = await page.locator('.mascot-drop').evaluate((el) => el.getBoundingClientRect().left);
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(900); // it takes off and settles, or falls to an edge and lands
    if ((await mascot(page).getAttribute('data-moving')) === 'hovering') lostAt = before;
  }
  const hovering = await watchHover(page, 1.5);
  expect(hovering.every((h) => h.moving === 'hovering')).toBe(true);
  // A little under the tabs, never over them, bobbing.
  const unders = hovering.map((h) => h.under);
  expect(Math.min(...unders), unders.join(', ')).toBeGreaterThanOrEqual(0);
  expect(Math.max(...unders), unders.join(', ')).toBeLessThanOrEqual(8);
  expect(Math.max(...unders) - Math.min(...unders)).toBeGreaterThan(1);
  // Near where it lost ground, across.
  for (const h of hovering) expect(Math.abs(h.left - lostAt)).toBeLessThanOrEqual(14);
  // Its tail whirling under it.
  expect(new Set(hovering.map((h) => h.tail)).size).toBeGreaterThan(3);
  // With reduced motion, it hovers still: no whirl, no bob.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const still = await watchHover(page, 1);
  expect(still.every((h) => h.moving === 'hovering')).toBe(true);
  expect(new Set(still.map((h) => Math.round(h.under * 10))).size).toBe(1);
  expect(new Set(still.map((h) => h.tail)).size).toBe(1);
});

test('it comes up from behind the Amp, and leaves jumping, then melting; with reduced motion it comes and goes at once', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await bringBead(page);
  await play(page, 'jdhs'); // sent away for the visit, so the Notes bring it back
  await expect(mascot(page)).toHaveCount(0);
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

test('it adds under a millisecond to each frame the Viewers draw (their own runs vary by half that)', async ({ page, browserName }) => {
  // Measured in Chromium only (issue 138): WebKit's clock counts whole milliseconds and, on GitHub's runner, draws some
  // fifteen frames a second, so two seconds' average wanders by ±0.7 ms with Bead or without, and a 1 ms bound fails
  // on noise. In Chromium on Linux Bead adds under 0.1 ms.
  test.skip(browserName !== 'chromium', "WebKit's whole-millisecond clock cannot measure a fraction of one");
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
  await bringBead(page);
  const shown = Math.min(await perFrame(), await perFrame());
  expect(shown - without).toBeLessThan(1);
});

test.describe('Display’s switch lasts, the Notes are for the visit (issue 150, decisions 7 to 9)', () => {
  test.describe('switched on', () => {
    test.use({ storageState: holding({ ...WELCOMED, 'limpide.bead': 'on' }) });

    test('B, E, A, D sends it away and brings it back, the switch staying on; a reload brings it by itself again', async ({ page }) => {
      await page.goto('/');
      await listening(page);
      await expect(mascot(page)).toHaveCount(1, { timeout: 6000 });
      await play(page, 'jdhs');
      await expect(mascot(page)).toHaveCount(0);
      await openDisplay(page);
      await expect(beadSwitch(page).getByRole('radio', { name: 'Bead on' })).toHaveAttribute('aria-checked', 'true');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(4000); // sent away for the visit: it does not come by itself
      await expect(mascot(page)).toHaveCount(0);
      await page.reload();
      await listening(page);
      await expect(mascot(page)).toHaveCount(1, { timeout: 6000 });
      await play(page, 'jdhs');
      await expect(mascot(page)).toHaveCount(0);
      await play(page, 'jdhs');
      await expect(mascot(page)).toHaveCount(1);
      await openDisplay(page);
      await expect(beadSwitch(page).getByRole('radio', { name: 'Bead on' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  test('switched off, it never appears: the Notes do nothing, nor a reload, until the switch is turned on', async ({ page }) => {
    await page.goto('/');
    await listening(page);
    await play(page, 'jdhs');
    await page.waitForTimeout(4000);
    await expect(mascot(page)).toHaveCount(0);
    await play(page, 'jdhs'); // played again just before a reload: the Notes stored nothing either
    await page.reload();
    await listening(page);
    await page.waitForTimeout(4000);
    await expect(mascot(page)).toHaveCount(0);
    await play(page, 'jdhs');
    await page.waitForTimeout(500);
    await expect(mascot(page)).toHaveCount(0);
    await openDisplay(page);
    await expect(beadSwitch(page).getByRole('radio', { name: 'Bead off' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.bead-icon')).toHaveAttribute('data-state', 'gone');
    await beadSwitch(page).getByRole('radio', { name: 'Bead on' }).click();
    await expect(mascot(page)).toHaveCount(1);
    await expect(page.locator('.bead-icon')).toHaveAttribute('data-state', 'popping');
    await beadSwitch(page).getByRole('radio', { name: 'Bead off' }).click();
    await expect(page.locator('.bead-icon')).toHaveAttribute('data-state', 'melting');
    await expect(mascot(page)).toHaveCount(0);
    await page.keyboard.press('Escape');
    await play(page, 'jdhs');
    await page.waitForTimeout(500);
    await expect(mascot(page)).toHaveCount(0);
  });
});

test.describe('out by default (issue 150)', () => {
  test.describe('a first visit', () => {
    test.use({ storageState: holding({}) });

    test('it waits while the welcome is up, then comes in by itself; Display’s switch and its tip show from the start', async ({ page }) => {
      await page.goto('/');
      const welcome = page.getByRole('dialog', { name: 'Limpide' });
      await expect(welcome).toBeVisible();
      await page.waitForTimeout(4000);
      await expect(mascot(page)).toHaveCount(0);
      await welcome.getByRole('button', { name: 'Close' }).click();
      await expect(mascot(page)).toHaveCount(1, { timeout: 6000 });
      await openDisplay(page);
      const bead = page.getByRole('radiogroup', { name: 'Bead', exact: true });
      await expect(bead.getByRole('radio', { name: 'Bead on' })).toHaveAttribute('aria-checked', 'true');
      await bead.getByRole('radio', { name: 'Bead off' }).hover();
      await expect(page.getByRole('tooltip')).toContainText('water drop');
      await expect(page.getByRole('tooltip')).toContainText('B, E, A, D');
    });
  });

  test.describe('switched on', () => {
    test.use({ storageState: holding({ ...WELCOMED, 'limpide.bead': 'on' }) });

    test('it comes in by itself a few seconds after the page opens, and again after a reload', async ({ page }) => {
      await page.goto('/');
      await listening(page);
      await expect(mascot(page)).toHaveCount(1, { timeout: 6000 });
      await page.reload();
      await listening(page);
      await expect(mascot(page)).toHaveCount(1, { timeout: 6000 });
    });
  });
});

test('a pointer over it tickles it; a click sends tiny drops every way', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await bringBead(page);
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
  await bringBead(page);
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
  await bringBead(page);
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
  await bringBead(page);
  await expect(mascot(page)).toHaveAttribute('data-tail', 'logo');
  await page.getByRole('radio', { name: 'Square', exact: true }).first().click();
  await expect(mascot(page)).toHaveAttribute('data-tail', 'square');
  await expect(mascot(page)).toHaveAttribute('data-tail', 'logo', { timeout: 5000 });
});

test("Detune splits it, its twin on the side of Detune's sign: left below 0 cents, right above (issue 174)", async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'the side is drawn alike in every browser; checked in one');
  await page.goto('/');
  await listening(page);
  await bringBead(page);
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await page.getByRole('slider', { name: 'Osc 2', exact: true }).press('ArrowUp');
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  const detune = page.getByRole('slider', { name: 'Osc 2 Detune', exact: true });
  // Every frame for half a second, as Bead strolls and turns: where its twin stands, against itself.
  const sides = () =>
    page.evaluate(
      () =>
        new Promise<number[]>((done) => {
          const seen: number[] = [];
          const sample = () => {
            const self = document.querySelector('#bead-self')!.getBoundingClientRect();
            const twin = document.querySelector<SVGUseElement>('.mascot-twin')!;
            const at = twin.checkVisibility() ? twin.getBoundingClientRect() : self;
            seen.push(Math.sign(Math.round(at.left - self.left)));
            if (seen.length < 30) requestAnimationFrame(sample);
            else done(seen);
          };
          requestAnimationFrame(sample);
        }),
    );
  await detune.press('Home');
  await expect.poll(sides).toEqual(Array(30).fill(-1));
  await detune.press('End');
  await expect.poll(sides).toEqual(Array(30).fill(1));
});

test('dragged and let go, it is thrown, and lands on an edge', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await bringBead(page);
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
  await bringBead(page);
  await expect(mascot(page)).toHaveAttribute('data-hat', 'ghost');
});

test('the theme switched: it shades its eyes once Display is closed', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await bringBead(page);
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
  await bringBead(page);
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
  // The Demo's card over the plot's foot, it never surfs there (issue 164): dragged aside by its name, it does.
  await page.waitForTimeout(500);
  await expect(mascot(page)).toHaveAttribute('data-act', 'conduct');
  const name = (await page.getByRole('region', { name: 'Demo', exact: true }).locator('.demo-bar-name').boundingBox())!;
  await page.mouse.move(name.x + 4, name.y + name.height / 2);
  await page.mouse.down();
  await page.mouse.move(name.x + 504, name.y + name.height / 2, { steps: 8 });
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

/**
 * Where the drop is against the docked cards (the Demo's, a Tutorial's, the Tour's): whether any part of its drawing is
 * under one, and whether it is in the window, below the header (issue 164).
 */
const againstCards = (page: Page) =>
  page.evaluate(() => {
    const drop = document.querySelector('.mascot-drop svg')!.getBoundingClientRect();
    const [header, strip] = ['header', '.section-strip'].map((q) => document.querySelector(q)?.getBoundingClientRect().bottom ?? 0);
    const cards = [...document.querySelectorAll('.docked')].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0);
    return {
      cards: cards.length,
      under: cards.some((r) => r.left < drop.right && r.right > drop.left && r.top < drop.bottom && r.bottom > drop.top),
      // Its foot under the header and the section tabs, over which it may stand (issue 142), and on the window.
      inView: drop.bottom > Math.max(header, strip) && drop.bottom <= innerHeight + 1,
    };
  });

test.describe('never under a card (issue 164)', () => {
  const cards = {
    Demo: async (page: Page) => {
      await page.getByRole('button', { name: 'Demo', exact: true }).click();
    },
    'a Tutorial': async (page: Page) => {
      await page.getByRole('button', { name: /^Patch: / }).click();
      const tutorials = page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Tutorials' });
      await tutorials.getByRole('button', { name: /^Tutorial: Bass/ }).click();
    },
    'the Tour': async (page: Page) => {
      await page.getByRole('button', { name: 'About' }).click();
      await page.getByRole('dialog', { name: 'Limpide' }).getByRole('button', { name: 'Take the Tour' }).click();
    },
  };
  test('three across, with Display open over its edge, it goes to an edge clear of the panel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await listening(page);
    await bringBead(page);
    await openDisplay(page);
    const panel = page.getByRole('region', { name: 'Viewer controls' });
    await expect(panel).toBeVisible();
    await page.mouse.move(2, 894); // off every control, so no tip opens
    await page.waitForTimeout(300);
    await expect(mascot(page)).toHaveAttribute('data-moving', /^(standing|hovering)$/, { timeout: 5000 });
    const under = await page.evaluate(() => {
      const drop = document.querySelector('.mascot-drop svg')!.getBoundingClientRect();
      const r = document.querySelector('.display-panel')!.getBoundingClientRect();
      return r.left < drop.right && r.right > drop.left && r.top < drop.bottom && r.bottom > drop.top;
    });
    expect(under).toBe(false);
  });

  for (const [name, open] of Object.entries(cards)) {
    test(`on a phone, with ${name}'s card docked, it keeps in view and out from under the card as the page scrolls`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await listening(page);
      await bringBead(page);
      await open(page);
      const card = page.getByRole('region', { name: /^(Demo|Tour|Tutorial: .+)$/ });
      await expect(card).toBeVisible();
      // The pointer onto the card's blank edge, so no tip of what it was last over stands open.
      const box = (await card.boundingBox())!;
      await page.mouse.move(box.x + 3, box.y + box.height / 2);
      const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const tops = [...Array.from({ length: Math.floor(height / 200) + 1 }, (_, i) => i * 200), height];
      for (const top of [...tops, ...[...tops].reverse()]) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
        await page.waitForTimeout(300);
        // Once it has fallen or flown there and landed: standing, or hovering under the header.
        await expect(mascot(page)).toHaveAttribute('data-moving', /^(standing|hovering)$/, { timeout: 5000 });
        expect(await againstCards(page), `scrolled to ${top}`).toEqual({ cards: 1, under: false, inView: true });
      }
    });
  }
});
