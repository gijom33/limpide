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
  await finger.down(cutoff);
  await page.waitForTimeout(800);
  await finger.up();
  const tip = page.getByRole('tooltip').filter({ hasText: 'Where the Filter starts to take Harmonics away' });
  await expect(tip).toBeVisible();
  await finger.down(page.getByRole('heading', { name: 'Filter', level: 2 }));
  await finger.up();
  await expect(tip).toBeHidden();
});

test('a long press on Hold explains it without switching it; a tap still switches it at once', async ({ page }) => {
  await page.goto('/');
  const finger = await touch(page);
  const hold = page.getByRole('button', { name: 'Hold' });
  await finger.down(hold);
  await page.waitForTimeout(800);
  await finger.up();
  await expect(page.getByRole('tooltip').filter({ hasText: 'Hold' }).first()).toBeVisible();
  await expect(hold).toHaveAttribute('aria-pressed', 'false');
  await hold.tap();
  await expect(hold).toHaveAttribute('aria-pressed', 'true');
});

test('holding a piano key plays it and shows no explanation', async ({ page }) => {
  await page.goto('/');
  const finger = await touch(page);
  const key = page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'E4' });
  await finger.down(key);
  await page.waitForTimeout(800);
  await expect(key).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('tooltip').filter({ hasText: 'Your computer keyboard is a piano' })).toBeHidden();
  await finger.up();
});
