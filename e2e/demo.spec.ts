import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

const demo = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Demo' });
const patchName = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^Patch:/ });

test('the Demo tours one Preset per group, in order, making sound, and stops when a key is pressed', async ({ page }) => {
  test.setTimeout(60000);
  test.slow(); // waits for a phrase to end and the next Preset to load
  await page.goto('/');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(patchName(page)).toContainText('Init'); // the Start group's Preset, first
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /^-?[0-5]?\d(\.\d+)?$/, { timeout: 8000 }); // sound
  await expect(page.getByRole('group', { name: 'Piano' }).locator('[aria-pressed="true"]').first()).toBeVisible({ timeout: 8000 }); // the Notes show on the piano
  await expect(patchName(page)).toContainText('PWM Morph', { timeout: 15000 }); // Shapes, next
  await page.keyboard.press('a');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.up('a');
  const name = await patchName(page).textContent();
  await page.waitForTimeout(1500);
  expect(await patchName(page).textContent()).toBe(name); // the tour has stopped moving
});

test('turning a knob keeps the Demo playing, and the Demo leaves that knob where it was put', async ({ page }) => {
  await page.goto('/');
  await demo(page).click();
  await expect(patchName(page)).toContainText('Init'); // its Cutoff sweeps open while the phrase plays
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
  await expect(patchName(page)).toContainText('Init');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /^-?[0-5]?\d(\.\d+)?$/); // still sounding
});

test('the Waveform, Filter and Voices switches keep the Demo playing, and it plays on with the choice', async ({ page }) => {
  await page.goto('/');
  await demo(page).click();
  await expect(patchName(page)).toContainText('Init');
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
