import { expect, test, type Page } from '@playwright/test';

const db = (page: Page) => page.getByLabel('Amp Scope', { exact: true }).getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));
const ready = (page: Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

test('the on-screen piano plays, and lights the key while it sounds', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const piano = page.getByRole('group', { name: 'Piano' });
  await expect(piano.getByRole('button')).toHaveCount(17);
  const c4 = piano.getByRole('button', { name: 'C4' });
  await c4.scrollIntoViewIfNeeded(); // the piano sits at the bottom, below the fold of a small test window
  const box = (await c4.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8);
  await page.mouse.down();
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await expect(c4).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.up();
  await expect(c4).toHaveAttribute('aria-pressed', 'false');
});

test('computer keys light the matching piano key', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.keyboard.down('KeyD'); // E4
  await expect(page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'E4' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up('KeyD');
});

test('octave shift moves the piano and the computer keys (buttons, or Z / X)', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const piano = page.getByRole('group', { name: 'Piano' });
  await page.getByRole('button', { name: 'Octave up' }).click();
  await expect(piano.getByRole('button', { name: 'C5' })).toBeVisible();
  await page.keyboard.press('KeyZ');
  await page.keyboard.press('KeyZ');
  await expect(piano.getByRole('button', { name: 'C3' })).toBeVisible();
  await page.keyboard.down('KeyA');
  await expect(piano.getByRole('button', { name: 'C3' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up('KeyA');
  await expect(piano.getByRole('button', { name: 'C3' })).toHaveAttribute('aria-pressed', 'false');
});

test('a MIDI controller plays the synth, its pads lighting the piano', async ({ page }) => {
  // A stand-in Controller: Web MIDI with one input the test can play.
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), { id: 'fake', name: 'Synido TempoPAD C16', state: 'connected' });
    const access = Object.assign(new EventTarget(), { inputs: new Map([['fake', input]]) });
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: () => Promise.resolve(access), configurable: true });
    (window as unknown as { playMidi(bytes: number[]): void }).playMidi = (bytes) =>
      input.dispatchEvent(Object.assign(new Event('midimessage'), { data: Uint8Array.from(bytes) }));
  });
  await page.goto('/');
  await ready(page);
  await expect(page.getByRole('button', { name: 'MIDI', exact: true })).toContainText('1');
  await page.getByRole('button', { name: 'MIDI', exact: true }).click(); // a user gesture, so audio may start
  await page.evaluate(() => (window as unknown as { playMidi(b: number[]): void }).playMidi([0x90, 64, 120]));
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await expect(page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'E4' })).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => (window as unknown as { playMidi(b: number[]): void }).playMidi([0x80, 64, 0]));
  await expect(page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'E4' })).toHaveAttribute('aria-pressed', 'false');
});

test('without Web MIDI (Safari) the MIDI indicator says so, and everything else works', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'requestMIDIAccess', { value: undefined, configurable: true }));
  await page.goto('/');
  await page.getByRole('button', { name: 'MIDI', exact: true }).hover();
  await expect(page.getByRole('tooltip')).toContainText(/not support/i);
});

test('when the browser blocks MIDI, the indicator shows it is unavailable (not just empty) and says why', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: () => Promise.reject(new DOMException('Permission to use Web MIDI API was not granted.', 'NotAllowedError')),
      configurable: true,
    }),
  );
  await page.goto('/');
  const status = page.getByRole('button', { name: 'MIDI', exact: true });
  await expect(status).toHaveAttribute('data-unavailable', 'true');
  await status.hover();
  await expect(page.getByRole('tooltip')).toContainText(/not allowed/i);
});

test('with Web MIDI working but nothing plugged in, the indicator is not marked unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const access = Object.assign(new EventTarget(), { inputs: new Map() });
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: () => Promise.resolve(access), configurable: true });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'MIDI', exact: true }).hover();
  await expect(page.getByRole('tooltip')).toContainText(/no midi controller/i);
  await expect(page.getByRole('button', { name: 'MIDI', exact: true })).not.toHaveAttribute('data-unavailable');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('the header stays on screen while scrolling, so the piano can be played under any stage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('region', { name: 'Envelope Timeline' }).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500);
    const piano = page.getByRole('group', { name: 'Piano' });
    const box = (await piano.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThan(852);
    const key = piano.getByRole('button', { name: 'C4' });
    const k = (await key.boundingBox())!;
    await page.mouse.move(k.x + k.width / 2, k.y + k.height - 5);
    await page.mouse.down();
    await expect(key).toHaveAttribute('aria-pressed', 'true'); // the key under the finger is the one that plays
    await page.mouse.up();
    // Nothing scrolls under it unseen: the header has a solid background.
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('header')!).backgroundColor)).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });
});

// A real piano's black keys are about 0.58 as wide as its white ones; the on-screen piano keeps that at any width.
for (const width of [375, 465, 1440]) {
  test(`black keys are a real piano's share of a white key's width at ${width} wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const widths = await page.getByRole('group', { name: 'Piano' }).getByRole('button')
      .evaluateAll((keys) => keys.map((k) => ({ black: k.hasAttribute('data-black'), width: k.getBoundingClientRect().width })));
    const white = widths.filter((k) => !k.black).map((k) => k.width);
    const black = widths.filter((k) => k.black).map((k) => k.width);
    for (const b of black) {
      expect(b / white[0]).toBeGreaterThanOrEqual(0.55);
      expect(b / white[0]).toBeLessThanOrEqual(0.62);
    }
  });
}
