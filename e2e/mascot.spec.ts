import { expect, type Page, test } from '@playwright/test';
import { LONGEST_STEP } from '../src/ui/mascotPlace';
import { openDisplay, reachAudio, stopSound } from './helpers';
import { BEAD_ON, holding, WELCOMED } from './startState';

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
/** Bead's height on screen, in pixels: the Mascot's HEIGHT. */
const BEAD_HEIGHT = 26;
const beadSwitch = (page: Page) => page.getByRole('radiogroup', { name: 'Bead', exact: true });

/** Brings Bead up by Display's switch, then closes Display. */
async function bringBead(page: Page) {
  await openDisplay(page);
  await beadSwitch(page).getByRole('radio', { name: 'Bead on' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
  // Escape hands the focus back to Display's button, whose tip then shows: on Linux's wider type it reaches over the
  // LFO & Envelopes' edge, and Bead rightly keeps clear of it. Nothing is left focused or hovered.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(mascot(page)).toHaveCount(1);
}

/**
 * Waits until it stands or hovers (or is as `moving` says), giving it `seconds` of its own time. Its motion goes at
 * most LONGEST_STEP a frame, so where frames come slower than that (WebKit on GitHub's runner, about fifteen a second;
 * any browser on a loaded machine) a move takes longer than the clock says (issue 177). Counted frame by frame, each
 * frame's share capped as its motion caps it, the wait holds at any frame rate.
 */
async function settles(page: Page, moving = /^(standing|hovering)$/, seconds = 5) {
  // What it was doing when the wait ended: read again later, it may already be off again (the Demo startles it).
  const seen = await page.evaluate(
    ([limit, step, pattern]) =>
      new Promise<string>((done) => {
        const wanted = new RegExp(pattern);
        let own = 0;
        let last: number | null = null;
        const frame = (time: number) => {
          if (last !== null) own += Math.min(step, (time - last) / 1000);
          last = time;
          const now = document.querySelector<HTMLElement>('.mascot')?.dataset.moving ?? '';
          if (wanted.test(now) || own > limit) done(now);
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
    [seconds, LONGEST_STEP, moving.source] as const,
  );
  expect(seen).toMatch(moving);
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

/**
 * Each frame for `ms`, while it rests (standing or clinging still, not lifted off its line by a hop or a bounce, nor surfing):
 * the page's text its drawing covers, pixel by pixel, its twin included (issue 181). Text in what is drawn over it (the
 * cards, tips and panels) and text for screen readers alone do not count. How many frames it rested, and what it covered.
 */
const restsOverText = (page: Page, ms: number) =>
  page.evaluate(
    (ms) =>
      new Promise<{ rests: number; over: string[] }>((done) => {
        const over = new Set<string>();
        let rests = 0;
        let was: number | null = null;
        const end = performance.now() + ms;
        const sample = () => {
          const bead = document.querySelector<HTMLElement>('.mascot');
          const drop = document.querySelector<HTMLElement>('.mascot-drop');
          const lift = Number(/translateY\((-?[\d.]+)px\)/.exec(drop?.style.transform ?? '')?.[1] ?? 0);
          // Still along its line since the last frame: not strolling, nor walking into a new stretch of it.
          const left = bead?.getBoundingClientRect().left ?? null;
          const still = left !== null && was !== null && Math.abs(left - was) < 0.5;
          was = left;
          if (bead && still && /^(standing|clinging)$/.test(bead.dataset.moving ?? '') && bead.dataset.act !== 'surf' && lift > -0.5) {
            rests++;
            const self = document.querySelector('#bead-self')!;
            const twin = document.querySelector<SVGUseElement>('.mascot-twin')!;
            const off = twin.style.display === 'none' ? null : twin.getBoundingClientRect().left - self.getBoundingClientRect().left;
            const pixels = [...self.querySelectorAll('rect')].map((r) => r.getBoundingClientRect()).filter((r) => r.width > 0);
            const drawn = off === null ? pixels : [...pixels, ...pixels.map((r) => new DOMRect(r.x + off, r.y, r.width, r.height))];
            const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const range = document.createRange();
            for (let node = walk.nextNode(); node; node = walk.nextNode()) {
              const el = node.parentElement;
              if (!el || !/\S/.test(node.nodeValue ?? '') || el.closest('.mascot, .docked, .tooltip, .patch-about, .patch-words, .patch-panel, .display-panel, .visually-hidden')) continue;
              range.selectNodeContents(node);
              const lines = [...range.getClientRects()];
              const hit = lines.some((t) => drawn.some((p) => Math.min(p.right, t.right) - Math.max(p.left, t.left) > 0.5 && Math.min(p.bottom, t.bottom) - Math.max(p.top, t.top) > 0.5));
              if (hit && el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) over.add(`"${node.nodeValue!.trim()}" (${bead.dataset.moving} at ${Math.round(left!)})`);
            }
          }
          if (performance.now() < end) requestAnimationFrame(sample);
          else done({ rests, over: [...over] });
        };
        requestAnimationFrame(sample);
      }),
    ms,
  );

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
      // On an edge just under a phone's section strip, its top is over the strip's foot by up to its height (issue 142).
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
    await settles(page);
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

/** Each frame for `seconds`: the drop's top under the ceiling (the header or the section tabs), its box's left, and its tail's turn. */
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
            // Its place: its box, whichever way its drawing faces (issue 179).
            left: document.querySelector('.mascot')!.getBoundingClientRect().left,
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
    const before = await mascot(page).evaluate((el) => el.getBoundingClientRect().left);
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

test('on a phone, on an edge just under the tabs, its fountains are seen whole under the header (issue 200)', async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await bringBead(page);
  await settles(page, /^standing$/);
  // Its edge scrolled up to just under the section tabs, the header slid away: as high as it keeps standing there.
  await page.evaluate(async () => {
    for (let i = 0; i < 4; i++) {
      const foot = document.querySelector('.mascot-drop')!.getBoundingClientRect().bottom;
      const tabs = document.querySelector('.section-strip')!.getBoundingClientRect().bottom;
      window.scrollBy({ top: foot - tabs - 4, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 600));
    }
  });
  await settles(page, /^standing$/);
  // Each frame through the Las Vegas show and the fountain after it: the highest of its drawing and its droplets,
  // against the header's foot.
  const over = await page.evaluate(
    (BEAD_HEIGHT) =>
      new Promise<{ under: number; head: number }>((done) => {
        let under = Infinity;
        let head = Infinity;
        const end = performance.now() + 6000;
        window.__limpideTrick!('fountainShow');
        window.__limpideTrick!('fountain');
        const sample = () => {
          const header = document.querySelector('header')!.getBoundingClientRect().bottom;
          for (const r of document.querySelectorAll('.mascot-spray rect, .mascot rect')) {
            const b = r.getBoundingClientRect();
            if (b.width > 0) under = Math.min(under, b.top - header);
          }
          head = Math.min(head, document.querySelector('.mascot-drop')!.getBoundingClientRect().bottom - BEAD_HEIGHT - header);
          if (performance.now() < end) requestAnimationFrame(sample);
          else done({ under, head });
        };
        requestAnimationFrame(sample);
      }),
    BEAD_HEIGHT,
  );
  // Its head close under the header, the room short for a fountain; nothing of it behind the header.
  expect(over.head).toBeLessThan(40);
  expect(over.under).toBeGreaterThanOrEqual(0);
  await expect(mascot(page)).toHaveAttribute('data-moving', 'standing');
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

test('it adds under a millisecond to each frame the Viewers draw, or under their share of a slowed one (issues 138, 177)', async ({ page, browserName }) => {
  test.slow(); // up to three rounds
  // Measured in Chromium only (issue 138): WebKit's clock counts whole milliseconds and, on GitHub's runner, draws some
  // fifteen frames a second, so two seconds' average wanders by ±0.7 ms with Bead or without, and a 1 ms bound fails
  // on noise. In Chromium on Linux Bead adds under 0.1 ms.
  test.skip(browserName !== 'chromium', "WebKit's whole-millisecond clock cannot measure a fraction of one");
  // Every frame callback's run time: the Viewers' render loop is one of them (ADR-0002).
  await page.addInitScript(() => {
    const w = window as unknown as { works: number[] };
    w.works = [];
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      raf((time) => {
        const start = performance.now();
        callback(time);
        w.works.push(performance.now() - start);
      });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  // The median frame's work, not the mean: on a loaded machine a frame the system stops halfway counts its wait as
  // work, and a few of those moved the mean by ±0.6 ms where the median moved by ±0.3 (issue 177, at load 30).
  const perFrame = async () => {
    await page.keyboard.down('f'); // F4 held, so the Viewers draw a sound
    await page.evaluate(() => Object.assign(window, { works: [] }));
    await page.waitForTimeout(2000);
    await page.keyboard.up('f');
    return page.evaluate(() => {
      const works = [...(window as unknown as { works: number[] }).works].sort((a, b) => a - b);
      return works[works.length >> 1];
    });
  };
  // The frame without Bead is the reference: a busy machine slows Bead's drawing with the Viewers', so the bound grows
  // with that frame (Bead measured 1.0 to 1.4 ms at the night's load of 10 to 46, issue 177). On a quiet Mac the
  // Viewers take about 3.6 ms and Bead 0.3 to 0.6 more, and 30 % of that frame is the bound's 1 ms: quiet, the bound
  // is 1 ms. Other browsers' bursts beside it still pushed one round in six over (at load 30), so it is measured
  // up to three times, Bead sent away between: a Bead grown dearer fails all three.
  const rounds: string[] = [];
  let within = false;
  for (let round = 0; round < 3 && !within; round++) {
    if (round) {
      await openDisplay(page);
      await beadSwitch(page).getByRole('radio', { name: 'Bead off' }).click();
      await page.keyboard.press('Escape');
      await expect(mascot(page)).toHaveCount(0, { timeout: 10_000 });
    }
    const without = Math.min(await perFrame(), await perFrame());
    await bringBead(page);
    const shown = Math.min(await perFrame(), await perFrame());
    rounds.push(`${(shown - without).toFixed(2)} ms over ${without.toFixed(2)}`);
    within = shown - without < Math.max(1, 0.3 * without);
  }
  expect(within, `Bead's cost per frame, each round: ${rounds.join('; ')}`).toBe(true);
});

test.describe('Display’s switch lasts, the Notes are for the visit (issue 150, decisions 7 to 9)', () => {
  test.describe('switched on', () => {
    test.use({ storageState: holding({ ...WELCOMED, ...BEAD_ON }) });

    test('switched off and on again while it leaves, it comes back up whole, in the window, once gone', async ({ page }) => {
      await page.goto('/');
      await listening(page);
      await expect(mascot(page)).toHaveCount(1, { timeout: 6000 });
      await openDisplay(page);
      await beadSwitch(page).getByRole('radio', { name: 'Bead off' }).click();
      await page.waitForTimeout(400); // melting, or dripping away down the window
      await beadSwitch(page).getByRole('radio', { name: 'Bead on' }).click();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(3000); // gone, and come up again
      await expect(mascot(page)).toHaveCount(1);
      const drawn = () =>
        page.locator('.mascot-drop').evaluate((el) => {
          const { top, bottom } = el.getBoundingClientRect();
          return Number(getComputedStyle(el).opacity) > 0.9 && top >= 0 && bottom <= innerHeight;
        });
      await expect.poll(drawn).toBe(true);
    });

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

test('About shows it beside the name while the switch is on, and not once it is off (issue 163)', async ({ page }) => {
  const about = page.getByRole('dialog', { name: 'Limpide' });
  const inAbout = about.getByRole('button', { name: 'Bead, Limpide’s water drop: its tricks' });
  const openAbout = () => page.getByRole('button', { name: 'About', exact: true }).click();
  await page.goto('/');
  await openAbout();
  await expect(about).toBeVisible();
  await expect(inAbout).toHaveCount(0);
  await page.keyboard.press('Escape');
  await bringBead(page);
  await openAbout();
  await expect(inAbout).toBeVisible();
  await page.keyboard.press('Escape');
  await openDisplay(page);
  await beadSwitch(page).getByRole('radio', { name: 'Bead off' }).click();
  await page.keyboard.press('Escape');
  await openAbout();
  await expect(about).toBeVisible();
  await expect(inAbout).toHaveCount(0);
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
    test.use({ storageState: holding({ ...WELCOMED, ...BEAD_ON }) });

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

test('with the sound stopped by the browser (an iPhone, back from another app), it moves on all the same', async ({ page }) => {
  await reachAudio(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await bringBead(page);
  await settles(page);
  await stopSound(page);
  // Its own time goes on: within a few seconds it strolls, as it does with the sound running.
  const x = () => mascot(page).evaluate((el) => el.getBoundingClientRect().left);
  const from = await x();
  await expect.poll(async () => Math.abs((await x()) - from), { timeout: 20_000 }).toBeGreaterThan(10);
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
            // Edge-on as it turns round (issue 179), it and its twin are one line: no side to be on.
            if (self.width > 10) seen.push(Math.sign(Math.round(at.left - self.left)));
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

test('strolling right its tail trails on its left; strolling left, a step and still, its tail is on its right (issue 179)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'drawn alike in every browser; checked in one');
  test.slow();
  // Its rolls as the test sets them, once it does: low, it strolls to its line's left end, looks over, takes fright and
  // steps back; high, it strolls to near its right end.
  await page.addInitScript(() => {
    const own = Math.random;
    Math.random = () => (window as { roll?: number }).roll ?? own();
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await bringBead(page);
  await page.mouse.move(2, 894); // off it, so its eyes and tail are its own
  await page.keyboard.down('f'); // a Note held: it listens, and does no funny turn of its own
  await settles(page);
  // Every frame for `seconds` from the roll set: where it is across, which side of it its tail is, and whether it is on
  // its own line doing nothing but strolling.
  type Seen = { t: number; left: number; tail: number; free: boolean };
  const sample = (roll: number, seconds: number) =>
    page.evaluate(
      ([roll, seconds]) =>
        new Promise<Seen[]>((done) => {
          (window as { roll?: number }).roll = roll;
          const frames: Seen[] = [];
          const frame = (t: number) => {
            const bead = document.querySelector<HTMLElement>('.mascot')!;
            const self = document.querySelector('#bead-self')!;
            const [whole, tail] = [self.getBoundingClientRect(), self.firstElementChild!.getBoundingClientRect()];
            const { moving, doing, act, pointing } = bead.dataset;
            frames.push({
              t: t / 1000,
              left: bead.getBoundingClientRect().left,
              tail: Math.sign(tail.left + tail.width / 2 - (whole.left + whole.width / 2)),
              free: moving === 'standing' && !doing && !act && pointing === 'no',
            });
            if (t / 1000 - frames[0].t < seconds) requestAnimationFrame(frame);
            else done(frames);
          };
          requestAnimationFrame(frame);
        }),
      [roll, seconds] as const,
    );
  // Its strolls and stops: each frame the same way along from three frames back (a frame sampled before it is drawn
  // repeats the last), all on its own, from where it set off. Past the moment it turns round (a quarter of a second, and its
  // trailing tail clear of its line's left end: 45 px along at most), a stroll right longer than its width has its tail
  // on its left; anything else, on its right.
  const SETTLING = 0.25;
  const CLEAR = 45;
  const BACK = 3;
  type Stroll = { kind: 'right' | 'short' | 'left' | 'still'; tails: number[]; side: number; said: string };
  const strollsIn = (frames: Seen[]) => {
    const strolls: Stroll[] = [];
    const way = (k: number) =>
      frames.slice(k - BACK, k + 1).every((f) => f.free) ? Math.sign(Math.round(((frames[k].left - frames[k - BACK].left) * 20) / BACK)) : NaN;
    for (let i = BACK + 1, end = i; i < frames.length - 1; i = end + 1) {
      const w = way(i);
      end = i;
      while (end + 1 < frames.length && way(end + 1) === w) end++;
      if (Number.isNaN(w) || Number.isNaN(way(i - 1))) continue;
      // Cut short (a fright at its line's end, the sample's end), a stroll right may have gone on: not a short one.
      const cut = end + 1 >= frames.length || Number.isNaN(way(end + 1));
      const length = frames[end].left - frames[i - BACK].left;
      const kind = w > 0 ? (length >= 60 ? 'right' : length < 40 && !cut ? 'short' : null) : w < 0 ? 'left' : 'still';
      const from = frames[i - BACK].left;
      const settled = frames.slice(i, end + 1).filter((f) => f.t - frames[i].t >= SETTLING && (kind !== 'right' || f.left - from >= CLEAR));
      if (!settled.length || !kind) continue;
      const tails = settled.map((f) => f.tail);
      strolls.push({ kind, tails, side: kind === 'right' ? -1 : 1, said: `${kind}, ${Math.round(length)} px, from ${frames[i].t.toFixed(2)} s` });
    }
    return strolls;
  };
  // Wherever it came up: a stroll to near its right end, then all the way to its left end, then far to the right, each
  // given 12 s (on GitHub's Linux it may set off 2 s late and take 9 s over its whole line). A visit to another section,
  // 15 to 35 s after it came, may take one of them, so again until each kind is seen, three times at most (1.22.0's
  // deploy run).
  await sample(0.9, 5);
  const strolls: Stroll[] = [];
  const seen = (kind: Stroll['kind']) => strolls.some((s) => s.kind === kind);
  for (let round = 0; round < 3 && !(seen('right') && seen('left') && seen('still')); round++) {
    strolls.push(...strollsIn([...(await sample(0.3, 12)), ...(await sample(0.9, 12))]));
  }
  await page.keyboard.up('f');
  for (const { tails, side, said } of strolls) expect(tails, said).toEqual(tails.map(() => side));
  const counted = Object.fromEntries((['right', 'short', 'left', 'still'] as const).map((k) => [k, strolls.filter((s) => s.kind === k).length]));
  expect(counted.right * counted.left * counted.still, JSON.stringify(counted)).toBeGreaterThan(0);
});

test('dragged and let go, it is thrown, and lands on an edge', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await bringBead(page);
  // Up on the Amp's edge: a visit elsewhere can keep it away 8 to 18 s (1 run in 120 in WebKit waited longer than 5 s).
  await expect.poll(async () => Math.abs((await footing(page)).below) <= 1, { timeout: 20_000 }).toBe(true);
  // Picked up where it is now: it may stroll on between where it is read and the press, on a slow runner (1.22.0's
  // deploy run), so a press that misses it is let go and tried again.
  let box = (await page.locator('.mascot-drop').boundingBox())!;
  let at = { x: 0, y: 0 };
  await expect(async () => {
    box = (await page.locator('.mascot-drop').boundingBox())!;
    at = { x: box.x + 9, y: box.y + box.height - 8 };
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await page.mouse.move(at.x - 25, at.y - 12);
    try {
      await expect(mascot(page)).toHaveAttribute('data-moving', 'held', { timeout: 1000 });
    } catch (missed) {
      await page.mouse.up();
      throw missed;
    }
  }).toPass({ timeout: 15_000 });
  for (let i = 2; i <= 8; i++) await page.mouse.move(at.x - i * 25, at.y - i * 12);
  await expect(mascot(page)).toHaveAttribute('data-moving', 'held');
  await page.mouse.up();
  await expect(mascot(page)).toHaveAttribute('data-moving', 'thrown');
  await expect(mascot(page)).toHaveAttribute('data-moving', 'standing', { timeout: 5000 });
  // Somewhere along to the left, on a section's top edge. Its foot is read where it is placed, not from its drawing's box:
  // landed over text it walks off at once (issue 181), leaning into its steps, and a leaning drop's box reaches past its
  // foot (2 to 4 runs in 20 read it off the edge that way, 1.22.0's statistics).
  const landed = await mascot(page).evaluate((el: HTMLElement) => {
    const at = el.getBoundingClientRect();
    const tops = [...document.querySelectorAll('section[aria-label]')].map((s) => s.getBoundingClientRect().top);
    return { left: at.left, onEdge: tops.some((top) => Math.abs(at.bottom - top) <= 2) };
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

/** Where its foot is against LFO `lfo`'s plot: how far over or under the line the plot draws under its middle, in pixels. */
const offTheLine = (page: Page, lfo: number) =>
  mascot(page).evaluate((el, n) => {
    const box = el.getBoundingClientRect(); // its box's bottom is its foot
    const plot = document.querySelector(`.lfo-plot[data-lfo="${n}"]`)!;
    const at = plot.getBoundingClientRect();
    const points = [...plot.querySelector('.lfo-plot-line')!.getAttribute('d')!.matchAll(/[ML](\S+) (\S+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
    const middle = box.left + 9 - at.left; // the drop's middle, the Mascot's DROP_MIDDLE
    const under = points.reduce((a, b) => (Math.abs(b.x - middle) < Math.abs(a.x - middle) ? b : a));
    return { off: box.bottom - (at.top + under.y), foot: box.bottom, moving: (el as HTMLElement).dataset.moving };
  }, lfo);

test('now and then it rides a slow Sine on an LFO plot, along its line, and goes home once the Depth is 0 (issue 141)', async ({ page }) => {
  test.slow();
  // Its every roll its lowest: its first visit is due soonest, 15 seconds in, and goes to the first choice, a ride.
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  // LFO 1 a Sine at half a hertz, half on.
  await page.goto(`/#p=${Buffer.from(JSON.stringify({ lfoAmount: 0.5, lfoRate: 0.5 })).toString('base64url')}`);
  await listening(page);
  await bringBead(page);
  await page.mouse.move(2, 894); // off every control, so no tip stands over the plot
  await page.keyboard.down('f'); // a Note held: it listens, and does no funny turn
  await expect(mascot(page)).toHaveAttribute('data-ride', '1', { timeout: 40_000 });
  await expect(mascot(page)).toHaveAttribute('data-moving', 'standing', { timeout: 5000 });
  // On the line, each moment, as it rises and falls.
  const feet: number[] = [];
  for (let i = 0; i < 10; i++) {
    const { off, foot, moving } = await offTheLine(page, 1);
    expect(moving).toBe('standing');
    // It follows the plot a frame behind, so the slower the frames the further it trails: within 2 px at about fifteen a
    // second in WebKit on Linux, 4.4 on GitHub's slower runner (1.22.0's branch run).
    expect(Math.abs(off), `off the line by ${off}`).toBeLessThanOrEqual(6);
    feet.push(foot);
    await page.waitForTimeout(150);
  }
  expect(Math.max(...feet) - Math.min(...feet), feet.join(', ')).toBeGreaterThan(4);
  // Its Depth to 0 (a double-click puts it back to its 0): off with a jump home, onto the Amp's edge.
  const depth = (await page.getByRole('slider', { name: 'LFO 1 Depth', exact: true }).boundingBox())!;
  await page.mouse.dblclick(depth.x + depth.width / 2, depth.y + depth.height / 2);
  await page.mouse.move(2, 894);
  await expect(mascot(page)).toHaveAttribute('data-ride', '');
  await expect.poll(async () => Math.abs((await footing(page)).below) <= 1, { timeout: 5000 }).toBe(true);
  await page.keyboard.up('f');
});

/** A patch in a Share link: LFO 1 a Sine at half a hertz, half on, and what `more` sets. */
const slowLfo = (more: Record<string, unknown> = {}) => `/#p=${Buffer.from(JSON.stringify({ lfoAmount: 0.5, lfoRate: 0.5, ...more })).toString('base64url')}`;

for (const [size, viewport, edge] of [
  ['on a phone', { width: 375, height: 812 }, 'LFO & Envelopes'],
  ['in 2 × 2', { width: 690, height: 640 }, 'LFO & Envelopes'],
] as const) {
  test(`${size}, now and then it rides a slow Sine on LFO 1's plot in view, on its line, and goes back to its edge after (issue 197)`, async ({ page }) => {
    test.slow();
    // Its every roll its lowest: its first ride is due soonest, 15 seconds in, and lasts the least, 8 seconds.
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.setViewportSize(viewport);
    await page.goto(slowLfo());
    await listening(page);
    await bringBead(page);
    // LFO 1's plot in view, a little under its section's top edge, which is clear of the header and the tabs.
    await page.evaluate(() => {
      const plot = document.querySelector('.lfo-plot[data-lfo="1"]')!.getBoundingClientRect();
      window.scrollTo({ top: scrollY + plot.top - 400, behavior: 'instant' });
    });
    await settles(page);
    expect(Math.abs((await footing(page, edge)).bottom)).toBeLessThanOrEqual(1);
    await page.mouse.move(2, viewport.height - 6); // off every control, so no tip stands over the plot
    await page.keyboard.down('f'); // a Note held: it listens, and does no funny turn
    await expect(mascot(page)).toHaveAttribute('data-ride', '1', { timeout: 40_000 });
    await expect(mascot(page)).toHaveAttribute('data-moving', 'standing', { timeout: 5000 });
    const feet: number[] = [];
    for (let i = 0; i < 10; i++) {
      const { off, foot, moving } = await offTheLine(page, 1);
      expect(moving).toBe('standing');
      expect(Math.abs(off), `off the line by ${off}`).toBeLessThanOrEqual(4);
      feet.push(foot);
      await page.waitForTimeout(150);
    }
    expect(Math.max(...feet) - Math.min(...feet), feet.join(', ')).toBeGreaterThan(4);
    // Its ride over, back to its edge.
    await expect(mascot(page)).toHaveAttribute('data-ride', '', { timeout: 15_000 });
    await settles(page);
    // Its box on the edge: the LFO's sway may tilt the drop a few pixels past it.
    expect(Math.abs((await footing(page, edge)).bottom)).toBeLessThanOrEqual(1);
    await page.keyboard.up('f');
  });
}

/** Picks it up where it is, drags it to `to` in a few moves, and lets it go there. */
async function dropAt(page: Page, to: { x: number; y: number }) {
  // It may stroll on between where it is read and the press, on a slow runner: a press that misses is tried again.
  let at = { x: 0, y: 0 };
  await expect(async () => {
    const box = (await page.locator('.mascot-drop').boundingBox())!;
    at = { x: box.x + 9, y: box.y + box.height - 8 };
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await page.mouse.move(at.x + (to.x - at.x) / 8, at.y + (to.y - at.y) / 8);
    try {
      await expect(mascot(page)).toHaveAttribute('data-moving', 'held', { timeout: 1000 });
    } catch (missed) {
      await page.mouse.up();
      throw missed;
    }
  }).toPass({ timeout: 15_000 });
  for (let i = 2; i <= 8; i++) await page.mouse.move(at.x + ((to.x - at.x) * i) / 8, at.y + ((to.y - at.y) * i) / 8);
  await page.mouse.up();
}

test("three across, dropped on LFO 1's plot, a slow Triangle, it rides it; dropped on a Saw's, it lands as anywhere (issue 197)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // LFO 1 a slow Triangle; LFO 2 a Saw as slow, on too.
  await page.goto(slowLfo({ lfoWaveform: 'triangle', lfo2Amount: 0.5, lfo2Rate: 0.5, lfo2Waveform: 'saw' }));
  await listening(page);
  await bringBead(page);
  // Up on the Amp's edge: a visit elsewhere can keep it away 8 to 18 s.
  await expect.poll(async () => Math.abs((await footing(page)).below) <= 1, { timeout: 20_000 }).toBe(true);
  const plot = async (lfo: number) => (await page.locator(`.lfo-plot[data-lfo="${lfo}"]`).boundingBox())!;
  const one = await plot(1);
  await dropAt(page, { x: one.x + one.width / 2, y: one.y + one.height / 2 });
  await expect(mascot(page)).toHaveAttribute('data-ride', '1');
  await expect(mascot(page)).toHaveAttribute('data-moving', 'standing', { timeout: 5000 });
  const { off } = await offTheLine(page, 1);
  expect(Math.abs(off), `off the line by ${off}`).toBeLessThanOrEqual(6);
  // Picked up again and dropped on the Saw's plot: thrown, it lands on the edge under it, with no ride.
  await page.mouse.move(2, 894);
  const two = await plot(2);
  await dropAt(page, { x: two.x + two.width / 2, y: two.y + two.height / 2 });
  await expect(mascot(page)).toHaveAttribute('data-ride', '');
  await settles(page);
  await expect(mascot(page)).toHaveAttribute('data-ride', '');
  // Home, on the Amp's edge: read where it is placed, not from its drawing, whose box reaches past its foot as it leans
  // into a step or hops (4 runs in 12 in WebKit read it off the edge that way; the throw test's fix, 2026-11-03).
  expect(Math.abs((await footing(page)).bottom)).toBeLessThanOrEqual(1);
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
        // Once it has fallen or flown there and landed: standing, or hovering under the header; or, the Tour pointing
        // the way to its card's control, clinging beside it (issue 151).
        await settles(page, /^(standing|hovering|clinging)$/);
        expect(await againstCards(page), `scrolled to ${top}`).toEqual({ cards: 1, under: false, inView: true });
      }
    });
  }
});

test.describe('never over text where it rests (issue 181)', () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
  ]) {
    test(`through the Demo at ${viewport.width} × ${viewport.height}, conducting, on air guitar, surfing: over no label, readout or heading`, async ({ page }) => {
      test.slow();
      await page.setViewportSize(viewport);
      await page.goto('/');
      await listening(page);
      await bringBead(page);
      await page.getByRole('button', { name: 'Demo', exact: true }).click();
      const card = page.getByRole('region', { name: 'Demo' });
      let rests = 0;
      // A part each act: it conducts, plays air guitar (its tail swung down under its foot), surfs.
      for (const part of [1, 2, 3]) {
        await card.getByRole('button', { name: new RegExp(`^Play from part ${part},`) }).click();
        const seen = await restsOverText(page, 8000);
        expect(seen.over, `part ${part}`).toEqual([]);
        rests += seen.rests;
      }
      // Some rests seen, so the check meant something: counted in frames, and WebKit on GitHub's runner draws about
      // fifteen a second, where it rests as few as 4 frames over the three parts (issue 177).
      expect(rests).toBeGreaterThan(0);
    });
  }

  test('on a phone, on its edge just under the section tabs, over none of their names (issue 142)', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await listening(page);
    await bringBead(page); // before the window shrinks, which would put Display's switch out of reach
    await page.setViewportSize({ width: 375, height: 560 });
    // Scrolled until the Oscillators' edge, the one in view, is just under the tabs: its top over them, level with
    // their names.
    let level = 0;
    for (let y = 0; y <= 14; y += 2) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(700);
      await settles(page);
      const seen = await restsOverText(page, 800);
      expect(seen.over, `scrolled to ${y}`).toEqual([]);
      const names = await page.evaluate(() => {
        const top = document.querySelector('.mascot-drop svg')!.getBoundingClientRect().top;
        const walk = document.createTreeWalker(document.querySelector('.section-strip')!, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let bottom = -Infinity;
        for (let node = walk.nextNode(); node; node = walk.nextNode()) {
          range.selectNodeContents(node);
          bottom = Math.max(bottom, range.getBoundingClientRect().bottom);
        }
        return top < bottom && document.querySelector<HTMLElement>('.mascot')!.dataset.moving === 'standing';
      });
      if (names) level++;
    }
    expect(level, 'never on the line level with the names').toBeGreaterThan(0);
  });
});

test.describe('pointing the way in a Tutorial and the Tour (issue 151)', () => {
  const tutorialCard = (page: Page) => page.getByRole('region', { name: /^Tutorial: / });
  const tourCard = (page: Page) => page.getByRole('region', { name: 'Tour' });
  const clings = (page: Page) => settles(page, /^clinging$/, 12);

  async function openTutorial(page: Page, preset: string) {
    await page.getByRole('button', { name: /^Patch: / }).click();
    await page.getByRole('dialog', { name: 'Patches' }).getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: new RegExp(`^Tutorial: ${preset}`) }).click();
    await tutorialCard(page).getByRole('button', { name: 'Start', exact: true }).click();
  }

  /** The Step made with "Do it for me", as the Tutorial spec does it, however slow the machine. */
  async function doIt(page: Page) {
    const next = tutorialCard(page).getByRole('button', { name: /^(Next|Finish)$/ });
    const button = tutorialCard(page).getByRole('button', { name: 'Do it for me', exact: true });
    await expect(async () => {
      if (await button.isVisible()) await button.click({ timeout: 2000 });
      await expect(next).toBeEnabled({ timeout: 2000 });
    }).toPass({ timeout: 30000 });
  }
  const next = (page: Page) => tutorialCard(page).getByRole('button', { name: /^(Next|Finish)$/ }).click();

  /**
   * Where it is against `selector`'s control: beside it (its drawing within a few pixels of the ring, and level with
   * the control, or with a label beside it up to `lower` pixels lower, issue 181), over neither the ring nor the band
   * its target text takes over the control, its tail on the control's side, and the pointer passing through it.
   */
  const against = (page: Page, selector: string, lower = 0) =>
    page.evaluate(([selector, lower]) => {
      const control = document.querySelector(selector)!.getBoundingClientRect();
      const drop = document.querySelector('.mascot-drop svg')!.getBoundingClientRect();
      const ring = { left: control.left - 6, right: control.right + 6, top: control.top - 6, bottom: control.bottom + 6 };
      const middle = (control.left + control.right) / 2;
      const target = { left: middle - 30, right: middle + 30, top: control.top - 26, bottom: control.top - 6 };
      const over = (r: { left: number; right: number; top: number; bottom: number }) => r.left < drop.right && r.right > drop.left && r.top < drop.bottom && r.bottom > drop.top;
      const gap = Math.max(ring.left - drop.right, drop.left - ring.right);
      const tail = document.querySelector('#bead-self > g')!.getBoundingClientRect();
      const body = [...document.querySelectorAll<SVGGElement>('#bead-self > g.mascot-body')].find((g) => g.style.display !== 'none')!.getBoundingClientRect();
      const towards = Math.sign((tail.left + tail.right) / 2 - (body.left + body.right) / 2) === Math.sign(middle - (drop.left + drop.right) / 2);
      const hit = document.elementFromPoint((body.left + body.right) / 2, (body.top + body.bottom) / 2);
      return {
        beside: gap >= 0 && gap <= 6,
        level: (drop.top + drop.bottom) / 2 > control.top && (drop.top + drop.bottom) / 2 < control.bottom + lower,
        covers: over(ring) || over(target),
        towards,
        through: !!hit && !hit.closest('.mascot'),
      };
    }, [selector, lower] as const);
  const POINTING = { beside: true, level: true, covers: false, towards: true, through: true };

  /** From now, each change of how it moves, in order. */
  const watchMoves = (page: Page) =>
    page.evaluate(() => {
      const w = window as unknown as { moves: string[] };
      w.moves = [];
      const sample = () => {
        const now = document.querySelector<HTMLElement>('.mascot')?.dataset.moving ?? '';
        if (now !== w.moves.at(-1)) w.moves.push(now);
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  const moves = (page: Page) => page.evaluate(() => (window as unknown as { moves: string[] }).moves);

  /** Over `ms`, how high it lifts off where it clings at most, in pixels. */
  const highest = (page: Page, ms: number) =>
    page.evaluate(
      (ms) =>
        new Promise<number>((done) => {
          let most = 0;
          const end = performance.now() + ms;
          const sample = () => {
            const lift = -Number(/translateY\((-?[\d.]+)px\)/.exec(document.querySelector<HTMLElement>('.mascot-drop')!.style.transform)?.[1] ?? 0);
            most = Math.max(most, lift);
            if (performance.now() < end) requestAnimationFrame(sample);
            else done(most);
          };
          requestAnimationFrame(sample);
        }),
      ms,
    );

  test('in a Tutorial it goes beside each Step’s control and points at it; a Step made, a hop; quit, home it hops', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await bringBead(page);
    await openTutorial(page, 'Bass');
    // Osc 2's level, on the Mixer tab: its usual move to the Oscillators' edge, then a slide down.
    await clings(page);
    expect(await against(page, '[data-learn="param:mixOsc2"]')).toEqual(POINTING);
    await expect(mascot(page)).toHaveAttribute('data-pointing', 'yes');
    // A click on it reaches what is under it.
    const clicked = page.evaluate(() => new Promise<boolean>((done) => document.addEventListener('click', (e) => done(!(e.target as Element).closest('.mascot')), { once: true, capture: true })));
    const body = (await page.locator('#bead-self > g.mascot-body:visible').first().boundingBox())!;
    await page.mouse.click(body.x + body.width / 2, body.y + body.height / 2);
    expect(await clicked).toBe(true);
    // Made: a happy hop, higher than its bounce (watched long enough for the click to land on a slow machine).
    const made = highest(page, 2000);
    await doIt(page);
    expect(await made).toBeGreaterThan(8);
    // Osc 2's Waveform, in the same Section: a slide across, never back up to the edge; a little lower, under its name.
    await watchMoves(page);
    await next(page);
    await expect(async () => expect(await against(page, '[data-learn="choice:osc2Waveform"]', BEAD_HEIGHT)).toEqual(POINTING)).toPass({ timeout: 15000 });
    expect(await moves(page)).not.toContain('flying');
    expect(await moves(page)).not.toContain('falling');
    await doIt(page);
    await next(page);
    await clings(page);
    await doIt(page);
    // The Ideal Display option: the Display button stands for it, in the header; a little lower, under its neighbours' names.
    await next(page);
    await expect(async () => expect(await against(page, 'button[aria-label="Display"]', BEAD_HEIGHT)).toEqual(POINTING)).toPass({ timeout: 15000 });
    await doIt(page);
    // The Cutoff, in another Section: its usual move to the Filter's edge, then the slide down.
    await watchMoves(page);
    await next(page);
    await expect(async () => expect(await against(page, '[data-learn="param:cutoff"]')).toEqual(POINTING)).toPass({ timeout: 15000 });
    const way = await moves(page);
    expect(way.some((m) => m === 'flying' || m === 'falling')).toBe(true);
    expect(way.slice(way.findIndex((m) => m === 'flying' || m === 'falling'))).toContain('sliding');
    // Quit: a hop back up to its edge, where it takes the pointer again.
    await tutorialCard(page).getByRole('button', { name: 'Quit the tutorial' }).click();
    await settles(page, /^standing$/, 8);
    await expect(mascot(page)).toHaveAttribute('data-pointing', 'no');
    expect((await footing(page)).bottom).toBe(0);
  });

  test('beside each control in the Tour and a Tutorial, over no label: a little lower under it, else along (issue 181)', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await bringBead(page);
    /** Once it has gone there and bounced on arriving, where it rests over no text. */
    const restsClear = async (where: string) => {
      await page.waitForTimeout(2500); // off from the last control
      await settles(page, /^(clinging|standing)$/, 12);
      await page.waitForTimeout(800); // its bounce
      const seen = await restsOverText(page, 1500);
      expect(seen.over, where).toEqual([]);
      expect(seen.rests, where).toBeGreaterThan(0);
    };
    // The Tour: Osc 1's Waveform, by its name's right end; the Cutoff, by its name (the owner's, 2026-11-02).
    await page.getByRole('button', { name: 'About' }).click();
    await page.getByRole('dialog', { name: 'Limpide' }).getByRole('button', { name: 'Take the Tour' }).click();
    await expect(async () => expect(await against(page, '[data-learn="choice:waveform"]', BEAD_HEIGHT)).toEqual(POINTING)).toPass({ timeout: 20000 });
    for (let card = 1; ; card++) {
      await restsClear(`the Tour's card ${card}`);
      const next = tourCard(page).getByRole('button', { name: 'Next', exact: true });
      if (!(await next.isVisible())) break;
      await next.click();
    }
    await tourCard(page).getByRole('button', { name: 'Close the Tour' }).click();
    // A Tutorial: its first Steps' controls, in two Sections and the header.
    await openTutorial(page, 'Bass');
    for (let step = 1; step <= 6; step++) {
      await restsClear(`the Bass Tutorial's Step ${step}`);
      await doIt(page);
      await next(page);
    }
  });

  test('a control on a hidden tab: it goes back to its edge and looks; shown again, it goes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await bringBead(page);
    await openTutorial(page, 'Bass');
    await clings(page);
    // The Mixer's tab hidden behind Osc 1's.
    await page.getByRole('tab', { name: /^Osc 1/ }).click();
    await settles(page, /^standing$/, 8);
    // Its tail towards the Oscillators, on its left.
    await expect(page.locator('.mascot-drop')).toHaveAttribute('style', /scale\(-/);
    await page.getByRole('tab', { name: 'Mixer' }).click();
    await clings(page);
    expect(await against(page, '[data-learn="param:mixOsc2"]')).toEqual(POINTING);
  });

  test('a Tutorial finished: the fountain', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await bringBead(page);
    await openTutorial(page, 'FM Ladder');
    while (await tutorialCard(page).getByRole('button', { name: /^(Next|Finish)$/ }).isVisible()) {
      await doIt(page);
      await next(page);
    }
    await expect(mascot(page)).toHaveAttribute('data-doing', 'fountain', { timeout: 5000 });
  });

  test('the Tour: one control a card, its first move’s; closed, home it hops', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await bringBead(page);
    await page.getByRole('button', { name: 'About' }).click();
    await page.getByRole('dialog', { name: 'Limpide' }).getByRole('button', { name: 'Take the Tour' }).click();
    await expect(async () => expect(await against(page, '[data-learn="choice:waveform"]', BEAD_HEIGHT)).toEqual(POINTING)).toPass({ timeout: 20000 });
    await tourCard(page).getByRole('button', { name: 'Next', exact: true }).click();
    await expect(async () => expect(await against(page, '[data-learn="param:cutoff"]')).toEqual(POINTING)).toPass({ timeout: 20000 });
    await tourCard(page).getByRole('button', { name: 'Close the Tour' }).click();
    await settles(page, /^standing$/, 8);
    await expect(mascot(page)).toHaveAttribute('data-pointing', 'no');
  });

  test('with reduced motion it stays on its edge, only turning its eyes and tail towards the control', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await bringBead(page);
    await openTutorial(page, 'Bass');
    // Osc 2's level is far to its left: it faces it, turned round, where it stands, and stays there.
    await expect(page.locator('.mascot-drop')).toHaveAttribute('style', /scale\(-1, 1\)/);
    await watchMoves(page);
    expect(await highest(page, 1000)).toBe(0);
    expect(await moves(page)).toEqual(['standing']);
    expect((await footing(page)).bottom).toBe(0);
  });

  test('on a phone it clings beside the Step’s control, under the section tabs and over the card', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await bringBead(page);
    await openTutorial(page, 'Bass');
    await clings(page);
    expect(await against(page, '[data-learn="param:mixOsc2"]')).toEqual(POINTING);
    expect(await againstCards(page)).toEqual({ cards: 1, under: false, inView: true });
    const top = await page.evaluate(() => document.querySelector('.mascot-drop svg')!.getBoundingClientRect().top);
    const tabs = await page.evaluate(() => document.querySelector('.section-strip')!.getBoundingClientRect().bottom);
    expect(top).toBeGreaterThanOrEqual(tabs);
  });
});
