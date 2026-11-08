import { expect, type Page, test } from '@playwright/test';

// Issue 49: a phone has no hover, so holding a control still for half a second shows its explanation. It stays after
// the finger lifts, the control doesn't act on that release, and the next touch puts it away.

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
test.skip(({ browserName }) => browserName !== 'chromium', 'touch input through CDP is Chromium-only');

async function touch(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const at = async (locator: ReturnType<Page['locator']>) => {
    const b = (await locator.boundingBox())!;
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  return {
    down: async (locator: ReturnType<Page['locator']>) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await at(locator)] }),
    up: () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }),
  };
}

test('holding a control shows what it does; it stays after lifting; the next touch puts it away', async ({ page }) => {
  await page.goto('/');
  const finger = await touch(page);
  const cutoff = page.getByRole('slider', { name: /^Cutoff/ });
  await cutoff.scrollIntoViewIfNeeded();
  const tip = page.getByRole('tooltip').filter({ hasText: 'Where the Filter starts to take Harmonics away' });
  await finger.down(cutoff);
  await expect(tip).toBeVisible(); // held until it shows
  await finger.up();
  await expect(tip).toBeVisible();
  await expect(tip.locator('.tooltip-keys')).toBeHidden(); // no keys on a phone: no steps for them (issue 160)
  await finger.down(page.getByRole('heading', { name: 'Filter', level: 2 }));
  await finger.up();
  await expect(tip).toBeHidden();
});

test('a long press on Hold explains it without switching it; a tap still switches it at once', async ({ page }) => {
  await page.goto('/');
  const finger = await touch(page);
  const hold = page.getByRole('button', { name: 'Hold' });
  const tip = page.getByRole('tooltip').filter({ hasText: 'Hold' }).first();
  await finger.down(hold);
  await expect(tip).toBeVisible(); // held until it shows
  await finger.up();
  await expect(tip).toBeVisible();
  await expect(hold).toHaveAttribute('aria-pressed', 'false');
  await hold.tap();
  await expect(hold).toHaveAttribute('aria-pressed', 'true');
});

test('holding a piano key plays it and shows no explanation', async ({ page }) => {
  await page.goto('/');
  const finger = await touch(page);
  const key = page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'E4' });
  await finger.down(key);
  await page.waitForTimeout(800); // a time: longer than a hold takes to show a tip, so none shows
  await expect(key).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('tooltip').filter({ hasText: 'Your computer keyboard is a piano' })).toBeHidden();
  await finger.up();
});

// Issue 134: with the Synth Geek Layer on, the History line shows whole in the touch-and-hold tip on a 375 px phone,
// FM's too, the tallest tip with one.
test.describe('on a 375 px phone', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('a held control’s History line shows whole, last in its tip', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
    await page.goto('/');
    const finger = await touch(page);
    for (const [name, words] of [['Cutoff', 'Cutoff Frequency'], ['FM', 'Poly Mod']] as const) {
      const control = page.getByRole('slider', { name, exact: true });
      await control.scrollIntoViewIfNeeded();
      await finger.down(control);
      await expect(page.getByRole('tooltip').locator('visible=true'), name).toBeVisible(); // held until it shows
      await finger.up();
      const history = page.getByRole('tooltip').locator('visible=true').locator('.tooltip-history');
      await expect(history, name).toContainText(words);
      await expect(history.locator('xpath=following-sibling::*')).toHaveCount(0);
      const box = (await history.boundingBox())!;
      expect(box.x, name).toBeGreaterThanOrEqual(0);
      expect(box.y, name).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, name).toBeLessThanOrEqual(375);
      expect(box.y + box.height, name).toBeLessThanOrEqual(667);
      await finger.down(page.getByRole('heading', { name: 'Filter', level: 2 }));
      await finger.up();
      await expect(history).toBeHidden();
    }
  });

  // Issue 168: a fader's τ, worked out at its setting, shows in its touch-and-hold tip, whole, its readout as it was.
  test('a held Envelope fader’s tip works out its τ under the hood, whole on the screen', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
    await page.goto('/');
    const finger = await touch(page);
    const decay = page.getByRole('slider', { name: 'Amp Decay', exact: true });
    await decay.scrollIntoViewIfNeeded();
    const tip = page.getByRole('tooltip').locator('visible=true');
    await finger.down(decay);
    await expect(tip).toBeVisible(); // held until it shows
    await finger.up();
    await expect(tip.locator('.tooltip-hood')).toContainText('τ = Decay ÷ 4 = 75.0 ms now');
    const box = (await tip.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    expect(box.y + box.height).toBeLessThanOrEqual(667);
    await expect(page.locator('.knob', { has: decay }).locator('.knob-value > span').first()).toHaveText('300 ms');
  });
});
