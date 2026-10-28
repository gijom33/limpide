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
  await expect(card.getByRole('img', { name: 'Part 1 of 12' })).toBeVisible();
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
