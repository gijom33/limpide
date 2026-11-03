import { expect, type Page, test } from '@playwright/test';

// Issue 112: the page keeps a tempo, set by hand or by tapping, and each LFO can sync its Rate to it in note values,
// its cycle locked to the beat.

const lfo = (page: Page, n: 1 | 2 = 1) => page.getByRole('region', { name: 'LFO & Envelopes' }).getByRole('group', { name: `LFO ${n}`, exact: true });
const bpm = (page: Page) => page.getByRole('spinbutton', { name: 'Tempo' });

test('the tempo starts at 120 BPM, steps with the arrows and is remembered after a reload (issue 112)', async ({ page }) => {
  await page.goto('/');
  await expect(bpm(page)).toHaveAttribute('aria-valuetext', '120 BPM');
  await expect(bpm(page)).toHaveText(/120\s*BPM/);
  await bpm(page).focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('PageUp');
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '131');
  await page.reload();
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '131');
});

test('a drag up sets the BPM where it is let go, a BPM a pixel (issue 112)', async ({ page }) => {
  await page.goto('/');
  const box = (await bpm(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 15, { steps: 5 });
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '135');
  await page.mouse.up();
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '135');
  await page.reload();
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '135');
});

test('a double-click types the BPM; Enter sets it, kept between 40 and 240 (issue 112)', async ({ page }) => {
  await page.goto('/');
  await bpm(page).dblclick();
  const field = page.getByRole('textbox', { name: 'Tempo in BPM' });
  await expect(field).toBeFocused();
  await page.keyboard.type('96');
  await page.keyboard.press('Enter');
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '96');
  await bpm(page).dblclick();
  await page.keyboard.type('400');
  await page.keyboard.press('Enter');
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '240');
});

test('Tap sets the tempo from four taps (issue 112)', async ({ page }) => {
  await page.goto('/');
  const tap = page.getByRole('button', { name: 'Tap', exact: true });
  await tap.waitFor();
  // Four taps half a second apart, timed inside the page (CODING_STANDARDS: timing-sensitive steps in one evaluate).
  await tap.evaluate(async (button) => {
    for (let i = 0; i < 4; i++) {
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }));
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  });
  const tapped = Number(await bpm(page).getAttribute('aria-valuenow'));
  expect(tapped).toBeGreaterThanOrEqual(115);
  expect(tapped).toBeLessThanOrEqual(121);
});

test('while the Demo plays the BPM is the track’s, and the person’s comes back when it stops (issue 112)', async ({ page }) => {
  await page.goto('/');
  await bpm(page).focus();
  await page.keyboard.press('PageDown');
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '110');
  const demo = page.getByRole('button', { name: 'Demo', exact: true });
  await demo.click();
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '128');
  await expect(bpm(page)).toHaveAttribute('aria-disabled', 'true');
  await demo.click();
  await expect(bpm(page)).toHaveAttribute('aria-valuenow', '110');
  await expect(bpm(page)).not.toHaveAttribute('aria-disabled', 'true');
});

test('Sync turns the Rate knob to note values, "1/4" (2 Hz at 120 BPM, in its tip), and off brings back the Hz it had (issues 112, 176)', async ({ page }) => {
  await page.goto('/');
  const rate = lfo(page).getByRole('slider', { name: 'LFO 1 Rate' });
  const sync = lfo(page).getByRole('button', { name: 'LFO 1 Sync' });
  await rate.focus();
  await page.keyboard.press('PageUp');
  const hz = await rate.getAttribute('aria-valuetext');
  expect(hz).toMatch(/Hz$/);
  await sync.click();
  await expect(sync).toHaveAttribute('aria-pressed', 'true');
  await expect(rate).toHaveAttribute('aria-valuetext', '1/4, 2.00 Hz');
  await rate.focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(rate).toHaveAttribute('aria-valuetext', '1/8, 4.00 Hz');
  await expect(lfo(page).locator('.knob', { has: page.getByRole('slider', { name: 'LFO 1 Rate' }) }).locator('.knob-value > :first-child')).toHaveText('1/8');
  await rate.hover();
  await expect(page.getByRole('tooltip')).toContainText('At 120 BPM, 1/8 is 4.00 Hz.');
  await sync.click();
  await expect(rate).toHaveAttribute('aria-valuetext', hz!);
  await sync.click();
  await expect(rate).toHaveAttribute('aria-valuetext', '1/8, 4.00 Hz');
  // The synced Rate follows the tempo at once.
  await bpm(page).focus();
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await expect(rate).toHaveAttribute('aria-valuetext', '1/8, 3.00 Hz');
});

test('the beats show on the LFO plot and the Timeline only while Sync is on, Retrigger off (issues 112, 193)', async ({ page }) => {
  await page.goto('/');
  const plot = page.getByRole('img', { name: /^LFO 1:/ });
  const timeline = page.getByRole('img', { name: 'Envelope Timeline' });
  // The page's clock runs once sound is allowed: a key starts it.
  await page.getByRole('button', { name: 'Hold' }).click();
  await expect(plot).toHaveAttribute('data-beats', '0');
  await expect(timeline).toHaveAttribute('data-beats', '0');
  await lfo(page).getByRole('button', { name: 'LFO 1 Sync' }).click();
  // A second of the plot holds two beats of 120 BPM; the Timeline's two seconds, four.
  await expect(plot).toHaveAttribute('data-beats', /^[23]$/);
  await expect(timeline).toHaveAttribute('data-beats', /^[45]$/);
  // With Retrigger on, each Note starts the cycle, which the beat does not.
  const retrigger = lfo(page).getByRole('button', { name: 'LFO 1 Retrigger' });
  await retrigger.click();
  await expect(plot).toHaveAttribute('data-beats', '0');
  await expect(timeline).toHaveAttribute('data-beats', '0');
  await retrigger.click();
  await expect(plot).toHaveAttribute('data-beats', /^[23]$/);
  await lfo(page).getByRole('button', { name: 'LFO 1 Sync' }).click();
  await expect(plot).toHaveAttribute('data-beats', '0');
  await expect(timeline).toHaveAttribute('data-beats', '0');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the BPM opens a small field with the BPM and Tap in it (issue 112)', async ({ page }) => {
    await page.goto('/');
    const open = page.locator('header').getByRole('button', { name: 'Tempo' });
    await expect(open).toContainText('120');
    await expect(page.getByRole('button', { name: 'Tap', exact: true })).toHaveCount(0);
    await open.click();
    await expect(bpm(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tap', exact: true })).toBeVisible();
    await bpm(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect(open).toContainText('119');
    await page.keyboard.press('Escape');
    await expect(bpm(page)).toHaveCount(0);
  });
});
