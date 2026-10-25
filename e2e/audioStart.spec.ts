import { expect, test } from '@playwright/test';

// The app is listening once the Viewers are drawing (a key pressed in the first few milliseconds after
// the load event, before React attaches its listeners, is not something a person can do).
const ready = (page: import('@playwright/test').Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

const db = (page: import('@playwright/test').Page) =>
  page.getByLabel('Amp Scope', { exact: true }).getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));

test('the Viewers are on screen from the start, with no button to click first', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /start audio/i })).toHaveCount(0);
  for (const tap of ['Oscillator', 'Filter', 'Amp']) {
    await expect(page.getByLabel(`${tap} Scope`)).toBeVisible();
    await expect(page.getByLabel(`${tap} Spectrum`)).toBeVisible();
  }
});

test('the first key press both unlocks audio and plays its Note', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.keyboard.down('KeyA');
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await page.keyboard.up('KeyA');
  await expect(page.getByText(/enable sound/i)).toHaveCount(0);
});

test('a first click anywhere unlocks audio too', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.getByRole('radiogroup', { name: 'Osc 1 Waveform' }).getByRole('radio', { name: 'Square' }).click();
  await page.keyboard.down('KeyA');
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await page.keyboard.up('KeyA');
});

/**
 * Holds sound back as a browser does before the page is used: the AudioContext reports 'suspended' until resume()
 * is called from a key press or a click.
 */
const holdSoundBack = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
    const state = Object.getOwnPropertyDescriptor(BaseAudioContext.prototype, 'state')!;
    let allowed = false;
    Object.defineProperty(BaseAudioContext.prototype, 'state', {
      configurable: true,
      get(this: BaseAudioContext) {
        return allowed ? state.get!.call(this) : 'suspended';
      },
    });
    const resume = AudioContext.prototype.resume;
    AudioContext.prototype.resume = function (this: AudioContext) {
      allowed = true;
      return resume.call(this).then(() => void this.dispatchEvent(new Event('statechange')));
    };
  });

const invite = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Piano' }).getByRole('status');

test('while the browser holds sound back, the piano invites a first Note; that Note starts the sound and the invitation goes', async ({ page }) => {
  await holdSoundBack(page);
  await page.goto('/');
  await ready(page);
  await expect(invite(page).getByText('Play to start the sound')).toBeVisible();
  await expect(invite(page).getByText('Tap a key to start the sound')).toBeHidden(); // for touch screens
  await page.keyboard.down('KeyA');
  await expect(invite(page)).toHaveCount(0);
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await page.keyboard.up('KeyA');
});

test('the invitation lets a click through to the key under it', async ({ page }) => {
  await holdSoundBack(page);
  await page.goto('/');
  await ready(page);
  const box = (await invite(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.getByRole('group', { name: 'Piano' }).locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(invite(page)).toHaveCount(0);
  await page.mouse.up();
});

/**
 * A browser that allows sound from the start: as the spec has it, a new AudioContext reports 'suspended' and turns
 * 'running' a moment later, by itself. (Playwright's page scripts run as if clicked, so a real one cannot show it.)
 */
const allowSoundFromStart = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
    const running = new WeakSet<BaseAudioContext>();
    Object.defineProperty(BaseAudioContext.prototype, 'state', {
      configurable: true,
      get(this: BaseAudioContext) {
        return running.has(this) ? 'running' : 'suspended';
      },
    });
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        setTimeout(() => {
          const label = document.querySelector('.play-invite');
          (window as unknown as { inviteSeen?: boolean }).inviteSeen = !!label && getComputedStyle(label).opacity !== '0';
          running.add(this);
          this.dispatchEvent(new Event('statechange'));
        }, 50);
      }
    };
  });

test('where the browser allows sound from the start, the invitation never shows, not even for a moment', async ({ page }) => {
  await allowSoundFromStart(page);
  await page.goto('/');
  await ready(page);
  await expect(invite(page)).toHaveCount(0);
  // The label was drawn for those 50 ms, but it fades in only later: it was never seen.
  const seen = await page.evaluate(() => (window as unknown as { inviteSeen?: boolean }).inviteSeen ?? false);
  expect(seen).toBe(false);
});
