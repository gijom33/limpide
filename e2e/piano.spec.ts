import { expect, test, type Page } from '@playwright/test';

const db = (page: Page) => page.getByTestId('amp-level').getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));
const ready = (page: Page) => expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);

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
  await expect(page.getByRole('status', { name: 'MIDI' })).toContainText('1');
  await page.getByRole('status', { name: 'MIDI' }).click(); // a user gesture, so audio may start
  await page.evaluate(() => (window as unknown as { playMidi(b: number[]): void }).playMidi([0x90, 64, 120]));
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await expect(page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'E4' })).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => (window as unknown as { playMidi(b: number[]): void }).playMidi([0x80, 64, 0]));
  await expect(page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'E4' })).toHaveAttribute('aria-pressed', 'false');
});

test('without Web MIDI (Safari) the MIDI indicator says so, and everything else works', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'requestMIDIAccess', { value: undefined, configurable: true }));
  await page.goto('/');
  await page.getByRole('status', { name: 'MIDI' }).hover();
  await expect(page.getByRole('tooltip')).toContainText(/not support/i);
});
