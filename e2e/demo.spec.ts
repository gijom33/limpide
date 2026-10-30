import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

const demo = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Demo' });
const patchName = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^Patch:/ });

test('the Demo plays its track, one Preset after another, making sound, and stops when a key is pressed', async ({ page }) => {
  test.setTimeout(60000);
  test.slow(); // waits for the intro to end and the next Preset to load
  await page.goto('/');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(patchName(page)).toContainText('Kick'); // the intro, first
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /^-?[0-5]?\d(\.\d+)?$/, { timeout: 8000 }); // sound
  await expect(page.getByRole('group', { name: 'Piano' }).locator('[aria-pressed="true"]').first()).toBeVisible({ timeout: 8000 }); // the Notes show on the piano
  await expect(patchName(page)).toContainText('Acid', { timeout: 15000 }); // the build, next, four bars later
  await page.keyboard.press('a');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.up('a');
  const name = await patchName(page).textContent();
  await page.waitForTimeout(1500);
  expect(await patchName(page).textContent()).toBe(name); // the track has stopped moving
});

test('turning a knob keeps the Demo playing, and the Demo leaves that knob where it was put', async ({ page }) => {
  test.slow(); // waits for the intro to end
  await page.goto('/');
  await demo(page).click();
  await expect(patchName(page)).toContainText('Acid', { timeout: 15000 }); // its Cutoff sweeps open while it plays
  const cutoff = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
  const box = (await cutoff.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60, { steps: 5 });
  await page.mouse.up();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  const turned = await cutoff.getAttribute('aria-valuetext');
  await page.waitForTimeout(1000);
  await expect(cutoff).toHaveAttribute('aria-valuetext', turned!);
  await expect(patchName(page)).toContainText('Acid');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /^-?[0-5]?\d(\.\d+)?$/); // still sounding
});

test('the Waveform, Filter and Voices switches keep the Demo playing, and it plays on with the choice', async ({ page }) => {
  await page.goto('/');
  await demo(page).click();
  await expect(patchName(page)).toContainText('Kick');
  const choose = async (group: string, option: string) => {
    const radio = page.getByRole('radiogroup', { name: group }).getByRole('radio', { name: option, exact: true });
    await radio.click();
    await expect(radio).toHaveAttribute('aria-checked', 'true');
  };
  await choose('Osc 1 Waveform', 'Square');
  await choose('Filter Mode', 'Band-pass');
  await choose('Voices', '4');
  await choose('LFO 1 Waveform', 'Square');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /^-?[0-5]?\d(\.\d+)?$/); // still sounding
  await page.getByRole('button', { name: 'Next Preset' }).click(); // a control that is not part of the sound: it takes over
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
});

test('moving around (the section strip, the Oscillator tabs) and an LFO’s destination keep the Demo playing', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  const strip = page.getByRole('navigation', { name: 'Sections' });
  for (const name of ['Filter', 'Amp', 'LFO & Envelopes', 'Oscillators']) {
    await strip.getByRole('button', { name, exact: true }).click();
    await expect(demo(page), name).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  await expect(demo(page), 'Osc 2 tab').toHaveAttribute('aria-pressed', 'true');
  const lfo = page.getByRole('group', { name: 'LFO 1', exact: true });
  await lfo.getByRole('button', { name: 'Next destination' }).click();
  await lfo.getByRole('button', { name: /Destination:/ }).click();
  await lfo.getByRole('menuitemradio', { name: 'Cutoff' }).click();
  await expect(demo(page), 'LFO destination').toHaveAttribute('aria-pressed', 'true');
});

test('Display leaves the Demo playing: opening it, its settings, Space’s Freeze, and closing it (issue 64)', async ({ page }) => {
  await page.goto('/');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  const playing = (what: string) => expect(demo(page), what).toHaveAttribute('aria-pressed', 'true');
  await openDisplay(page);
  await playing('opened');
  await page.getByRole('button', { name: 'Ideal' }).click();
  await playing('Ideal');
  await page.getByRole('button', { name: 'Snapshot', exact: true }).click();
  await page.getByRole('button', { name: 'Clear Snapshot' }).click();
  await playing('Snapshot');
  const freeze = page.getByRole('button', { name: 'Freeze', exact: true });
  await freeze.click();
  await freeze.click();
  await playing('Freeze');
  await page.getByRole('button', { name: 'Ideal' }).press('Enter');
  await page.getByRole('button', { name: 'Ideal' }).press(' ');
  await playing('by keys');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
  await playing('closed by Escape');
  // Space with nothing focused: Freeze, and back.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Space');
  await expect(page.locator('main')).toHaveAttribute('data-frozen');
  await page.keyboard.press('Space');
  await playing('Space');
  // A click elsewhere that closes it.
  await openDisplay(page);
  await page.mouse.click(8, 700); // the page's bottom-left corner, clear of the panel
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
  await playing('closed by a click elsewhere');
  // Playing still takes over.
  await page.keyboard.press('a');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.up('a');
});

test('with Display open, a key on the on-screen piano ends the Demo (issue 71)', async ({ page }) => {
  await page.goto('/');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await openDisplay(page);
  // Whichever key comes first: the Demo moves the piano's Octave as it plays.
  await page.getByRole('group', { name: 'Piano' }).getByRole('button').first().click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('status').filter({ hasText: 'The Demo stopped: you are playing now.' })).toBeVisible();
});

test('with Display open, a computer-keyboard piano key ends the Demo (issue 71)', async ({ page }) => {
  await page.goto('/');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await openDisplay(page);
  await page.keyboard.press('a');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('status').filter({ hasText: 'The Demo stopped: you are playing now.' })).toBeVisible();
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('the page follows the knob the Demo turns', async ({ page }) => {
    await page.goto('/');
    await demo(page).click();
    // The intro turns the Filter Envelope's Amount: the Filter's top lands just under the section strip.
    const gap = () =>
      page.evaluate(() => document.querySelector('section[aria-label="Filter"]')!.getBoundingClientRect().top - document.querySelector('.section-strip')!.getBoundingClientRect().bottom);
    await expect.poll(gap, { timeout: 5000 }).toBeLessThan(20);
    expect(await gap()).toBeGreaterThanOrEqual(0);
    await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Filter' })).toHaveAttribute('aria-current', 'true');
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('a scroll of the person’s own stops the following until the next part', async ({ page }) => {
    await page.goto('/');
    await demo(page).click();
    await page.waitForTimeout(1500); // the Filter's jump has landed
    await page.evaluate(() => {
      document.body.dispatchEvent(new WheelEvent('wheel', { deltaY: -2000, bubbles: true }));
      scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(4500); // past the Amp's Decay starting to move, still in the intro
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  });
});

test('the Demo never touches the Display settings', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('button', { name: 'Guides' }).click(); // a setting that is not the default
  await page.keyboard.press('Escape');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await openDisplay(page);
  await expect(page.getByRole('button', { name: 'Guides' })).toHaveAttribute('aria-pressed', 'true'); // untouched
  await expect(page.getByRole('radiogroup', { name: 'Viewers follow' }).getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
});

test.describe('on a touch screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test.skip(({ browserName }) => browserName !== 'chromium', 'drives real touches through the Chrome DevTools Protocol');

  /** A real finger: down, a few moves, up. Scrolls the page when the finger moves over a part that does not take touches itself. */
  async function swipe(page: import('@playwright/test').Page, x: number, fromY: number, toY: number) {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y: number) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', fromY);
    for (let i = 1; i <= 10; i++) await touch('touchMove', fromY + ((toY - fromY) * i) / 10);
    await touch('touchEnd', toY);
  }

  test('scrolling the page or touching a knob keeps the Demo playing; a tap elsewhere stops it', async ({ page }) => {
    await page.goto('/');
    await demo(page).tap();
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
    const heading = (await page.getByRole('region', { name: 'Oscillators' }).getByRole('heading').first().boundingBox())!;
    await swipe(page, heading.x + 5, heading.y + 300, heading.y + 50);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100); // the page did scroll
    await page.waitForTimeout(300);
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' }).tap(); // a knob takes the touch at once
    await page.waitForTimeout(300);
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('region', { name: 'Oscillators' }).getByRole('heading').first().tap(); // a tap anywhere else, once lifted
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  });
});

test('on a phone the Demo’s card keeps the sound’s name, what to listen for, how far it is, and Stop in view', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await page.goto('/');
  await demo(page).click();
  const card = page.getByRole('region', { name: 'Demo' });
  await expect(card).toBeInViewport();
  await expect(card).toContainText('Kick');
  await expect(card).toContainText('A kick drum, made by the synth');
  await expect(card.getByRole('group', { name: 'Part 1 of 15' })).toBeVisible();
  // The page follows the Demo's knobs and the header slides away; the card stays.
  await page.mouse.wheel(0, 600);
  await expect(card).toBeInViewport();
  await card.getByRole('button', { name: 'Stop' }).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(card).toBeHidden(); // stopped on purpose: nothing to explain
});

test('a key that stops the Demo says so, and offers to play it again', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await page.goto('/');
  await demo(page).click();
  await expect(page.getByRole('region', { name: 'Demo' })).toContainText('Kick');
  await page.getByRole('group', { name: 'Piano' }).locator('[data-note]').first().click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  const status = page.getByRole('status').filter({ hasText: 'The Demo stopped' });
  await expect(status).toBeVisible();
  await page.getByRole('region', { name: 'Demo' }).getByRole('button', { name: 'Play again' }).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(status).toBeHidden();
});

test('where the page fits its window, the Demo’s card adds no scroll bar: it sits over the bottom edge', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const scrolls = () => page.evaluate(() => document.documentElement.scrollHeight > innerHeight);
  expect(await scrolls()).toBe(false); // the page fits, before the Demo
  await demo(page).click();
  await expect(page.getByRole('region', { name: 'Demo' })).toBeVisible();
  await page.waitForTimeout(300);
  expect(await scrolls()).toBe(false);
});

test('the Demo’s card closes with its ×, the Demo playing on, and comes back with the next Demo (the owner, 2026-10-28)', async ({ page }) => {
  await page.goto('/');
  await demo(page).click();
  const card = page.getByRole('region', { name: 'Demo' });
  await expect(card).toContainText('Kick');
  await card.getByRole('button', { name: 'Close the card' }).click();
  await expect(card).toBeHidden();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true'); // still playing
  await demo(page).click(); // the lit Demo button stops it
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await demo(page).click();
  await expect(card).toContainText('Kick');
});

test('a segment on the Demo’s card plays on from its part, and the Demo keeps playing (the owner)', async ({ page }) => {
  await page.goto('/');
  await demo(page).click();
  const card = page.getByRole('region', { name: 'Demo' });
  await expect(card).toContainText('Kick');
  await card.getByRole('button', { name: 'Play from part 7, Wobble' }).click();
  await expect(card).toContainText('Wobble');
  await expect(card.getByRole('group', { name: 'Part 7 of 15' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Play from part 7, Wobble' })).toHaveAttribute('aria-current', 'step');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  // Back to an earlier part too.
  await card.getByRole('button', { name: 'Play from part 2, Acid' }).click();
  await expect(card.getByRole('group', { name: 'Part 2 of 15' })).toBeVisible();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
});

test('from the keyboard alone, Enter and Space on a part play from it and keep the focus there, the arrows move along the parts, and the Demo plays on (issue 104)', async ({ page }) => {
  await page.goto('/');
  await demo(page).focus();
  await page.keyboard.press('Enter');
  const card = page.getByRole('region', { name: 'Demo', exact: true });
  await expect(card).toContainText('Kick');
  const part = (n: number) => card.getByRole('button', { name: new RegExp(`^Play from part ${n},`) });
  // The parts are one Tab stop, on the part playing (the arrows move along them).
  await expect(card.getByRole('group', { name: /^Part / }).locator('button[tabindex="0"]')).toHaveCount(1);
  await part(1).focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await expect(part(5)).toBeFocused();
  await expect(part(5)).not.toHaveAttribute('aria-current', 'step'); // moving along plays nothing
  await page.keyboard.press('Enter');
  await expect(card.getByRole('group', { name: 'Part 5 of 15' })).toBeVisible();
  await expect(part(5)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press(' ');
  await expect(card.getByRole('group', { name: 'Part 4 of 15' })).toBeVisible();
  await expect(part(4)).toBeFocused();
  await page.keyboard.press('End');
  await expect(part(15)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(part(1)).toBeFocused();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(part(1)).not.toHaveAttribute('aria-current', 'step');
  // Tab leaves the parts in one step, for the card's other buttons.
  await page.keyboard.press('Tab');
  await expect(part(2)).not.toBeFocused();
  await expect(card.locator('.demo-bar-parts button:focus')).toHaveCount(0);
  // Enter on the lit Demo button stops it, as a click does.
  await demo(page).focus();
  await page.keyboard.press('Enter');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
});

for (const width of [393, 1440]) {
  test(`the parts' segments stay put whatever the part's name (the owner, 2026-10-29), at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await demo(page).click();
    const card = page.getByRole('region', { name: 'Demo' });
    const firstSegment = () => card.getByRole('button', { name: /^Play from part 1,/ }).evaluate((el) => Math.round(el.getBoundingClientRect().left));
    await expect(card).toContainText('Kick');
    const before = await firstSegment();
    await card.getByRole('button', { name: 'Play from part 6, Self-Oscillation' }).click();
    await expect(card.getByRole('group', { name: 'Part 6 of 15' })).toBeVisible();
    expect(await firstSegment()).toBe(before);
    // The name never runs under the segments.
    const [name, segments] = await Promise.all([card.locator('.demo-bar-name'), card.locator('.demo-bar-parts')].map((l) => l.evaluate((el) => el.getBoundingClientRect().toJSON())));
    // Beside them, or on a phone above them: never over them.
    expect(name.right <= segments.left || name.bottom <= segments.top).toBe(true);
  });
}

test('each part is a segment as wide as it is long, the playing one filling over time (the owner, 2026-10-29)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await demo(page).click();
  const card = page.getByRole('region', { name: 'Demo' });
  await expect(card).toContainText('Kick');
  const width = (n: number) => card.getByRole('button', { name: new RegExp(`^Play from part ${n},`) }).evaluate((el) => el.getBoundingClientRect().width);
  // Acid plays 8 bars, the Kick 4: twice as wide, give or take the gaps between segments.
  expect(Math.abs((await width(2)) - 2 * (await width(1)))).toBeLessThanOrEqual(4);
  const filled = () =>
    card.locator('.demo-bar-fill').evaluate((el) => {
      const [fill, track] = [el.getBoundingClientRect().width, el.parentElement!.getBoundingClientRect().width];
      return fill / track;
    });
  const early = await filled();
  await page.waitForTimeout(1500);
  expect(await filled()).toBeGreaterThan(early + 0.1); // 1.5 s of a 7.5 s part
  await card.getByRole('button', { name: 'Play from part 3, Poly Pluck' }).click();
  await expect(card.getByRole('group', { name: 'Part 3 of 15' })).toBeVisible();
  expect(await filled()).toBeLessThan(0.2); // a jump starts the segment's fill again
});

/** Each part's segment, from the first: its box, and whether it is the part playing. */
const segments = (card: import('@playwright/test').Locator) =>
  card.locator('.demo-bar-parts > button').evaluateAll((all) => all.map((b) => b.getBoundingClientRect().toJSON() as DOMRect));

for (const width of [601, 690, 1440]) {
  test(`from 601 px up every part's segment is at least 24 × 24 px, in a row of its own, still as wide as its part is long (issue 99), at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await demo(page).click();
    const card = page.getByRole('region', { name: 'Demo', exact: true });
    await expect(card).toContainText('Kick');
    const boxes = await segments(card);
    expect(boxes).toHaveLength(15);
    for (const [i, b] of boxes.entries()) {
      expect(b.width, `part ${i + 1}'s width`).toBeGreaterThanOrEqual(23.5);
      expect(b.height, `part ${i + 1}'s height`).toBeGreaterThanOrEqual(23.5);
    }
    // One row, under the name and the card's buttons.
    expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBe(1);
    for (const name of ['Fold the card', 'Stop', 'Close the card']) {
      expect((await card.getByRole('button', { name, exact: true }).boundingBox())!.y + 1, name).toBeLessThan(boxes[0].top);
    }
    // Acid plays 8 bars, the Kick 4, Brass Section 6: in the 640 px card and up each is wider in proportion and only
    // Self-Oscillation (2 bars) is drawn wider than its share; in a narrower card the 4-bar parts are held at 24 px too.
    const [kick, acid, selfOsc, brass] = [boxes[0].width, boxes[1].width, boxes[5].width, boxes[14].width];
    if (width >= 690) {
      expect(Math.abs(acid - 2 * kick)).toBeLessThanOrEqual(4);
      expect(Math.abs(brass - 1.5 * kick)).toBeLessThanOrEqual(4);
    }
    expect(acid).toBeGreaterThan(brass);
    expect(brass).toBeGreaterThan(kick);
    expect(selfOsc).toBeLessThanOrEqual(kick);
    // The shortest part's segment plays from it.
    await card.getByRole('button', { name: 'Play from part 6, Self-Oscillation' }).click();
    await expect(card.getByRole('group', { name: 'Part 6 of 15' })).toBeVisible();
    await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
    // The Previous and Next part buttons are the phone's: here the segments are big enough.
    await expect(card.getByRole('button', { name: 'Previous part' })).toBeHidden();
    await expect(card.getByRole('button', { name: 'Next part' })).toBeHidden();
  });
}

test('on a phone the segments are 44 px tall, with Previous part and Next part buttons of 44 × 44 px beside them, by pointer and by keyboard (issue 99)', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await demo(page).click();
  const card = page.getByRole('region', { name: 'Demo', exact: true });
  await expect(card).toContainText('Kick');
  const previous = card.getByRole('button', { name: 'Previous part', exact: true });
  const next = card.getByRole('button', { name: 'Next part', exact: true });
  const boxes = await segments(card);
  for (const [i, b] of boxes.entries()) expect(b.height, `part ${i + 1}'s height`).toBeGreaterThanOrEqual(43.5);
  for (const [name, button] of [['Previous', previous], ['Next', next]] as const) {
    const b = (await button.boundingBox())!;
    expect(Math.min(b.width, b.height), name).toBeGreaterThanOrEqual(43.5);
  }
  // Beside the segments: Previous at their start, Next at their end, on their row.
  const [p, n] = [(await previous.boundingBox())!, (await next.boundingBox())!];
  expect(p.x + p.width).toBeLessThanOrEqual(boxes[0].left);
  expect(n.x).toBeGreaterThanOrEqual(boxes[14].right);
  expect(Math.abs(p.y - boxes[0].top)).toBeLessThanOrEqual(1);
  // Still sized by their parts: Acid twice the Kick.
  expect(Math.abs(boxes[1].width - 2 * boxes[0].width)).toBeLessThanOrEqual(3);
  // On the first part there is no part before: Previous is greyed out and says so, and keeps the focus.
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  await next.click();
  await expect(card.getByRole('group', { name: 'Part 2 of 15' })).toBeVisible();
  await expect(previous).not.toHaveAttribute('aria-disabled', 'true');
  await previous.click();
  await expect(card.getByRole('group', { name: 'Part 1 of 15' })).toBeVisible();
  // From the keyboard: Enter and Space press them, the focus stays, the Demo plays on.
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(card.getByRole('group', { name: 'Part 2 of 15' })).toBeVisible();
  await page.keyboard.press(' ');
  await expect(card.getByRole('group', { name: 'Part 3 of 15' })).toBeVisible();
  await expect(next).toBeFocused();
  await previous.focus();
  await page.keyboard.press('Enter');
  await expect(card.getByRole('group', { name: 'Part 2 of 15' })).toBeVisible();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  // Tab reaches them in the order they stand: Previous, the parts (one stop), Next. (Not in WebKit, where Tab skips
  // buttons unless Safari's settings ask for them.)
  if (browserName !== 'webkit') {
    await page.keyboard.press('Tab');
    await expect(card.getByRole('group', { name: /^Part / }).locator('button:focus')).toHaveCount(1);
    await page.keyboard.press('Tab');
    await expect(next).toBeFocused();
  }
  // On the last part, Next is greyed out.
  await card.getByRole('button', { name: /^Play from part 15,/ }).click();
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await next.click({ force: true }); // greyed out, it does nothing
  await expect(card.getByRole('group', { name: 'Part 15 of 15' })).toBeVisible();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
});
