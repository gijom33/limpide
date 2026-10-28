import { expect, type Page, test } from '@playwright/test';
import { sliderName } from './helpers';

// Serum-style modulation on a knob (issue 20): a ring outside its value arc, over the range modulation can take it,
// and a dot at the value right now while a Note sounds.

const knob = (page: Page, region: string, name: string) =>
  page.getByRole('region', { name: region }).locator('.knob', { has: page.getByRole('slider', { name: sliderName(name) }) });
const ring = (k: ReturnType<typeof knob>) => k.locator('.knob-ring');
/** The Filter Envelope's white ring, on the knob's own track (issue 63). */
const envelopeRing = (k: ReturnType<typeof knob>) => k.locator('.knob-envelope:not(.knob-velocity, .knob-keytrack)');
/** Velocity's grey ring, beyond the Envelope's (the owner, 2026-10-28). */
const velocityRing = (k: ReturnType<typeof knob>) => k.locator('.knob-velocity');
const dot = (k: ReturnType<typeof knob>) => k.locator('.knob-live');
const listening = (page: Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

/** Aim an LFO at a destination, from its menu. */
async function aim(page: Page, lfo: 1 | 2, destination: string) {
  const group = page.getByRole('group', { name: `LFO ${lfo}`, exact: true });
  await group.getByRole('button', { name: /Destination:/ }).click();
  await group.getByRole('menuitemradio', { name: destination, exact: true }).click();
}

async function turnUp(page: Page, region: string, name: string, steps: number) {
  // A stage is a region; an LFO is a group within its section.
  const slider = page.getByRole(region.startsWith('LFO ') ? 'group' : 'region', { name: region, exact: true }).getByRole('slider', { name: sliderName(name) });
  await slider.evaluate(async (el, n) => {
    for (let i = 0; i < n; i++) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0)); // a tick for React to render each step
    }
  }, steps);
}

test('no ring while nothing modulates the Cutoff; turning the LFO’s Depth up rings it', async ({ page }) => {
  await page.goto('/');
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await expect(ring(cutoff)).toBeHidden();
  await turnUp(page, 'LFO 1', 'Depth', 25);
  await expect(ring(cutoff)).toBeVisible();
  await expect(ring(cutoff)).toHaveAttribute('d', /A/); // an arc
});

test('the live dot rides the Effective Cutoff while a Note sounds, and only then', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'LFO 1', 'Depth', 25);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await expect(dot(cutoff)).toBeHidden();
  await page.keyboard.down('KeyA');
  await expect(dot(cutoff)).toBeVisible();
  const at = await dot(cutoff).getAttribute('cx');
  await expect.poll(() => dot(cutoff).getAttribute('cx')).not.toBe(at); // the LFO moves it
  await page.keyboard.up('KeyA');
  await expect(dot(cutoff)).toBeHidden({ timeout: 3000 }); // once the Release has faded
});

test('the live dot moves with the Filter Envelope alone, no LFO, as with the LFO or both', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'Filter', 'Amount', 15);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  // The Envelope's own white ring; the blue one is the LFOs' alone (issue 63).
  await expect(envelopeRing(cutoff)).toBeVisible();
  await expect(ring(cutoff)).toBeHidden();
  // The Envelope moves the dot only through its Decay, a quarter of a second, sooner than the test's own calls can
  // come back under load: the Note is played and the dot followed in the page, frame by frame.
  const seen = await cutoff.evaluate(async (knob) => {
    dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    const seen = new Set<string>();
    const end = performance.now() + 600;
    while (performance.now() < end) {
      await new Promise(requestAnimationFrame);
      const cx = knob.querySelector('.knob-live')?.getAttribute('cx');
      if (cx) seen.add(cx);
    }
    dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
    return [...seen];
  });
  expect(seen.length, `the Envelope moves it: ${seen}`).toBeGreaterThan(2);
});

test('an LFO on Pulse Width rings both Oscillators’ Pulse Width knobs, and not the Cutoff', async ({ page }) => {
  await page.goto('/');
  await aim(page, 1, 'Pulse Width');
  await turnUp(page, 'LFO 1', 'Depth', 25);
  await expect(ring(page.getByRole('group', { name: 'Osc 1' }).locator('.knob'))).toBeVisible();
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  await expect(ring(page.getByRole('group', { name: 'Osc 2' }).locator('.knob'))).toBeVisible();
  await expect(ring(knob(page, 'Filter', 'Cutoff'))).toBeHidden();
});

test('pointing at a source: the LFOs’ controls change nothing; the Filter Envelope, Velocity and Key Track dim the blue ring (issue 63)', async ({ page }) => {
  await page.goto('/');
  await turnUp(page, 'LFO 1', 'Depth', 10);
  await turnUp(page, 'Filter', 'Amount', 10);
  await turnUp(page, 'Filter', 'Velocity', 5);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await page.getByRole('group', { name: 'LFO 1', exact: true }).getByRole('slider', { name: 'Depth' }).hover();
  await page.waitForTimeout(100);
  await expect(ring(cutoff)).not.toHaveAttribute('data-dim');
  await page.mouse.move(0, 0);
  // No source draws a blue share any more (the owner, 2026-10-28): their rings are the white and grey ones.
  for (const name of ['Amount', 'Velocity', 'Key Track']) {
    const control = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name });
    await control.focus();
    await expect(ring(cutoff), name).toHaveAttribute('data-dim', '');
    await expect(cutoff.locator('path[class*="share"]')).toHaveCount(0);
    await control.blur();
    await expect(ring(cutoff)).not.toHaveAttribute('data-dim');
  }
});

test('with reduced motion asked for, the ring stays and the moving dot does not show', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'LFO 1', 'Depth', 25);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await page.keyboard.down('KeyA');
  await expect(ring(cutoff)).toBeVisible();
  await page.waitForTimeout(300);
  await expect(dot(cutoff)).toBeHidden();
  await page.keyboard.up('KeyA');
});

test('LFO 2 rings the knobs of its new destinations: Resonance, Osc 2’s Semitone (Osc 2 Pitch) and Detune', async ({ page }) => {
  await page.goto('/');
  await turnUp(page, 'LFO 2', 'Depth', 25);
  for (const [destination, region, name] of [['Resonance', 'Filter', 'Resonance'], ['Osc 2 Pitch', 'Oscillators', 'Semitone'], ['Detune', 'Oscillators', 'Detune']]) {
    const k = knob(page, region, name);
    await expect(ring(k), destination).toBeHidden();
    await aim(page, 2, destination);
    await expect(ring(k), destination).toBeVisible();
  }
});

test('both LFOs on the Cutoff make one blue ring, wider than one alone, both LFOs in the same blue (issue 63)', async ({ page }) => {
  await page.goto('/');
  await turnUp(page, 'LFO 1', 'Depth', 10);
  const blue = ring(knob(page, 'Filter', 'Cutoff'));
  await expect(blue).toBeVisible();
  const length = () => blue.evaluate((el) => (el as SVGPathElement).getTotalLength());
  const alone = await length();
  await aim(page, 2, 'Cutoff');
  await turnUp(page, 'LFO 2', 'Depth', 10);
  await expect.poll(length).toBeGreaterThan(alone * 1.5);
  await expect(blue).toHaveCount(1);
  const colour = (n: 1 | 2) =>
    page.getByRole('group', { name: `LFO ${n}`, exact: true }).getByRole('slider', { name: 'Depth' }).evaluate((el) => getComputedStyle(el.closest('.lfo-rows')!).getPropertyValue('--stage'));
  expect(await colour(2)).toBe(await colour(1));
});

test('Velocity draws a grey ring beyond the Envelope’s, and neither moves before, during or after a Note (the owner, 2026-10-28)', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'Filter', 'Amount', 15);
  await turnUp(page, 'Amp', 'Release', 30); // a Release long enough to look at
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await expect(velocityRing(cutoff)).toBeHidden();
  const sweep = await envelopeRing(cutoff).getAttribute('d');
  await turnUp(page, 'Filter', 'Velocity', 100);
  await expect(velocityRing(cutoff)).toBeVisible();
  await expect(envelopeRing(cutoff)).toHaveAttribute('d', sweep!); // the Envelope's ring unchanged
  await expect(cutoff.locator('.knob-ring')).toBeHidden(); // and no blue ring: no LFO
  const reach = await velocityRing(cutoff).getAttribute('d');
  // Velocity's ring starts where the Envelope's ends.
  const end = (d: string) => d.trim().split(/\s+/).slice(-2).join(' ');
  const start = (d: string) => d.trim().split(/\s+/).slice(0, 2).join(' ').slice(1); // after the M
  expect(start(reach!)).toBe(end(sweep!));
  await page.keyboard.down('KeyA');
  await expect(dot(cutoff)).toBeVisible();
  for (const [ring, d] of [[envelopeRing(cutoff), sweep], [velocityRing(cutoff), reach]] as const) expect(await ring.getAttribute('d')).toBe(d); // held: still
  await page.keyboard.up('KeyA');
  await page.waitForTimeout(150);
  await expect(dot(cutoff)).toBeVisible(); // still heard
  for (const [ring, d] of [[envelopeRing(cutoff), sweep], [velocityRing(cutoff), reach]] as const) expect(await ring.getAttribute('d')).toBe(d); // released: still
});

test('Velocity alone, no Envelope: its grey ring starts at the knob and stays while a Note plays, the dot on it (the 1.14.0 review)', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'Filter', 'Velocity', 60);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await expect(envelopeRing(cutoff)).toBeHidden();
  await expect(velocityRing(cutoff)).toBeVisible();
  const reach = await velocityRing(cutoff).getAttribute('d');
  await page.keyboard.down('KeyA');
  await expect(dot(cutoff)).toBeVisible();
  await expect(velocityRing(cutoff)).toBeVisible();
  expect(await velocityRing(cutoff).getAttribute('d')).toBe(reach);
  await page.keyboard.up('KeyA');
});

test('the dot rides the knob’s own track whatever moves it, an LFO as well as the Filter Envelope (the owner, 2026-10-28)', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'LFO 1', 'Depth', 25);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  const fromCentre = () =>
    cutoff.locator('svg.knob-dial').evaluate((svg) => {
      const size = Number(svg.getAttribute('viewBox')!.split(' ')[2]);
      const live = svg.querySelector('.knob-live')!;
      const track = svg.querySelector('.knob-groove')!.getAttribute('d')!.match(/A([\d.]+)/)![1];
      return Math.abs(Math.hypot(Number(live.getAttribute('cx')) - size / 2, Number(live.getAttribute('cy')) - size / 2) - Number(track));
    });
  await page.keyboard.down('KeyA');
  await expect(dot(cutoff)).toBeVisible();
  expect(await fromCentre()).toBeLessThan(0.1); // with the LFO alone: on the track, not the blue ring
  await turnUp(page, 'Filter', 'Amount', 10);
  await page.waitForTimeout(100);
  expect(await fromCentre()).toBeLessThan(0.1); // with the Envelope too
  await page.keyboard.up('KeyA');
});

test('Key Track draws grey rings over the piano’s keys, and no ring moves from Note to Note, only with the octave (the owner, 2026-10-28)', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  const cutoffKnob = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
  await cutoffKnob.press('Home'); // a low Cutoff, so no ring is pinned at the dial's top
  await turnUp(page, 'Filter', 'Cutoff', 30);
  await turnUp(page, 'Filter', 'Amount', 10);
  await turnUp(page, 'Filter', 'Key Track', 80);
  await turnUp(page, 'LFO 1', 'Depth', 10);
  await cutoffKnob.blur();
  const cutoff = knob(page, 'Filter', 'Cutoff');
  const keyRing = cutoff.locator('.knob-keytrack');
  await expect(keyRing).toBeVisible();
  const rings = () => Promise.all([envelopeRing(cutoff), keyRing, ring(cutoff)].map((r) => r.getAttribute('d')));
  const before = await rings();
  for (const key of ['KeyA', 'KeyK', 'Semicolon']) {
    await page.keyboard.down(key);
    await expect(dot(cutoff)).toBeVisible();
    expect(await rings(), key).toEqual(before);
    await page.keyboard.up(key);
  }
  await page.keyboard.press('KeyZ'); // the piano an octave down, below C4: Key Track's reach goes with it
  await expect.poll(() => keyRing.getAttribute('d')).not.toBe(before[1]);
  expect(await envelopeRing(cutoff).getAttribute('d')).toBe(before[0]); // the Envelope's sweep stays
});
