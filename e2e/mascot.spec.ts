import { expect, type Page, test } from '@playwright/test';

// The mascot (issue 115): C, A, D, E played by hand calls it, and again sends it away. It perches right of the name
// of the section of the last control turned, covering no control.

const mascot = (page: Page) => page.locator('.mascot');
const listening = (page: Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

/** Plays Notes on the computer keyboard: A is C4, H A4, S D4, D E4, F F4. */
async function play(page: Page, keys: string) {
  for (const key of keys) await page.keyboard.press(key);
}

/** Turns the first slider of a section one step up, by hand. */
async function turnIn(page: Page, section: string) {
  const slider = page.locator(`section[aria-label="${section}"]`).getByRole('slider').first();
  await slider.evaluate((el) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })));
}

/** Where it should stand on a section: right of its name, its feet on the name's baseline. */
const perchOf = (page: Page, section: string) =>
  page.evaluate((name) => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(`section[aria-label="${name}"] h2`)!);
    const text = range.getBoundingClientRect();
    return { left: Math.round(text.right + 10), bottom: Math.round(text.bottom) };
  }, section);

/** Where it stands, unmoved by its hop, lean or stretch. */
const standing = (page: Page) =>
  mascot(page).evaluate((el: HTMLElement) => {
    const [x, y] = el.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/)!.slice(1).map(Number);
    const origin = (el.offsetParent ?? document.body).getBoundingClientRect();
    return { left: Math.round(x + origin.left), bottom: Math.round(y + origin.top + el.offsetHeight) };
  });

/** The controls and values its box overlaps. */
const covered = (page: Page) =>
  mascot(page).evaluate((el) => {
    const m = el.getBoundingClientRect();
    const controls = document.querySelectorAll<HTMLElement>('button, [role=slider], [role=tab], [role=radio], input, canvas, .knob-value, .fader');
    return [...controls]
      .filter((c) => c.checkVisibility({ visibilityProperty: true }))
      .filter((c) => {
        const r = c.getBoundingClientRect();
        return r.width > 0 && r.left < m.right && r.right > m.left && r.top < m.bottom && r.bottom > m.top;
      })
      .map((c) => c.getAttribute('aria-label') ?? c.className);
  });

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

for (const [size, viewport] of Object.entries({
  phone: { width: 375, height: 812 },
  '2 × 2': { width: 690, height: 830 },
  laptop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
})) {
  test(`${size}: it perches on the section of the last control turned, covering no control`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' }); // it goes straight there
    await page.goto('/');
    await listening(page);
    await play(page, 'ahsd');
    for (const section of ['Oscillators', 'Filter', 'Amp', 'LFO & Envelopes']) {
      if (section !== 'Oscillators') await turnIn(page, section);
      await expect.poll(() => standing(page), section).toEqual(await perchOf(page, section));
      expect(await covered(page), section).toEqual([]);
    }
  });
}

test('it adds well under a millisecond to each frame the Viewers draw', async ({ page }) => {
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
  expect(shown - without).toBeLessThan(0.5);
});

test('it walks to a new section, legs in turn, rather than jumping there', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await listening(page);
  await play(page, 'ahsd');
  await expect.poll(() => standing(page)).toEqual(await perchOf(page, 'Oscillators'));
  await turnIn(page, 'Amp');
  const target = await perchOf(page, 'Amp');
  await page.waitForTimeout(300);
  const halfway = await standing(page);
  expect(halfway.left).toBeGreaterThan((await perchOf(page, 'Oscillators')).left);
  expect(halfway.left).toBeLessThan(target.left);
  await expect.poll(() => standing(page), { timeout: 5000 }).toEqual(target);
});
