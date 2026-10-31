import { expect, type Page, test } from '@playwright/test';

// The mascot (issue 115): C, A, D, E played by hand calls it up from behind the Amp section, and again sends it away,
// melting. It lives on the Amp's top edge, along the stretch that covers least above it: nothing, where the header has
// room.

const mascot = (page: Page) => page.locator('.mascot');
const listening = (page: Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

/** Plays Notes on the computer keyboard: A is C4, H A4, S D4, D E4, F F4. */
async function play(page: Page, keys: string) {
  for (const key of keys) await page.keyboard.press(key);
}

/** Where its box stands against the Amp's top edge and sides, and how far the drop still is below that edge. */
const footing = (page: Page) =>
  mascot(page).evaluate((el: HTMLElement) => {
    const amp = document.querySelector('section[aria-label="Amp"]')!.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const drop = el.firstElementChild!.getBoundingClientRect();
    return { bottom: Math.round(box.bottom - amp.top), inside: box.left >= amp.left && box.right <= amp.right, below: Math.round(drop.bottom - amp.top) };
  });

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

test('C, A, D, E brings it and again sends it away; C, A, E, D does nothing', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await play(page, 'ahds');
  await expect(mascot(page)).toHaveCount(0);
  await play(page, 'ahsd');
  await expect(mascot(page)).toHaveCount(1);
  await expect(mascot(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(mascot(page)).toHaveCSS('pointer-events', 'none');
  await play(page, 'ahsd');
  await expect(mascot(page)).toHaveCount(0);
});

test('it comes in any octave, from the piano too, and the Demo never calls it', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  const key = (name: string) => page.getByRole('group', { name: 'Piano' }).getByRole('button', { name, exact: true });
  for (const name of ['C5', 'A4', 'D5', 'E4']) {
    const box = (await key(name).boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8);
  }
  await expect(mascot(page)).toHaveCount(1);
  await play(page, 'ahsd'); // sent away
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await page.waitForTimeout(3000);
  await expect(mascot(page)).toHaveCount(0);
});

for (const [size, viewport, room] of [
  ['phone', { width: 375, height: 812 }, false],
  ['2 × 2', { width: 690, height: 830 }, false],
  ['laptop', { width: 1440, height: 900 }, true],
  ['wide', { width: 1920, height: 1080 }, true],
] as const) {
  test(`${size}: it stands on the Amp's top edge, covering ${room ? 'nothing' : 'no control, only the bottom of the Viewer above'}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await listening(page);
    await play(page, 'ahsd');
    await expect.poll(async () => (await footing(page)).below <= 0).toBe(true);
    // Strolling, held awake by a Note, it stays on the edge, within the Amp, covering nothing it should not.
    await page.keyboard.down('f');
    for (let i = 0; i < 6; i++) {
      const { bottom, inside } = await footing(page);
      expect({ bottom, inside }).toEqual({ bottom: 0, inside: true });
      expect(await covered(page, room)).toEqual([]);
      await page.waitForTimeout(500);
    }
    await page.keyboard.up('f');
  });
}

test('it comes up from behind the Amp, and leaves jumping, then melting; with reduced motion it comes and goes at once', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await watchDrop(page);
  await play(page, 'ahsd');
  await expect.poll(async () => (await footing(page)).below <= 0).toBe(true);
  expect(Math.max(...(await watched(page)))).toBeGreaterThan(15); // it came up from behind the Amp
  await watchDrop(page);
  await play(page, 'ahsd');
  await expect(mascot(page)).toHaveCount(0);
  expect(Math.min(...(await watched(page)))).toBeLessThan(-8); // it jumped before it melted
  await play(page, 'ahsd'); // after it melts, it can come again
  await expect(mascot(page)).toHaveCount(1);
  await play(page, 'ahsd');
  await play(page, 'ahsd'); // while it melts, nothing calls it back
  await expect(mascot(page)).toHaveCount(0);
  await page.waitForTimeout(500);
  await expect(mascot(page)).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await play(page, 'ahsd');
  await expect(mascot(page)).toHaveCount(1);
  expect((await footing(page)).below).toBeLessThanOrEqual(0);
  await play(page, 'ahsd');
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
  await play(page, 'ahsd');
  await expect(mascot(page)).toHaveCount(1);
  const shown = Math.min(await perFrame(), await perFrame());
  expect(shown - without).toBeLessThan(1);
});
