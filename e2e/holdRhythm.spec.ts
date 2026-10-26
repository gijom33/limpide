import { expect, test } from '@playwright/test';

test('quick clicks on Hold tap a rhythm: the held Note repeats on it, until Hold is switched off', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Patch:/ }).click();
  await page.getByRole('button', { name: 'Pluck Shape', exact: true }).click(); // fades between strikes
  const hold = page.getByRole('button', { name: 'Hold' });
  // The taps' timing is the rhythm, so they are clicked in the page: under load each of the test's own clicks can
  // take a second or more to arrive, and a gap over two seconds switches Hold off.
  await hold.evaluate(async (button: HTMLElement) => {
    for (let tap = 0; tap < 3; tap++) {
      if (tap) await new Promise((resolve) => setTimeout(resolve, 450));
      button.click();
    }
  });
  await expect(hold).toHaveAttribute('aria-pressed', 'true'); // taps, not switching off
  await page.keyboard.down('a');
  await page.keyboard.up('a');
  await expect(page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'C4' })).toHaveAttribute('aria-pressed', 'true');

  // The level jumps on every strike and fades between them: several strikes in three seconds.
  const strikes = await page.evaluate(async () => {
    const scope = document.querySelector<HTMLElement>('[aria-label="Amp Scope"]')!;
    let count = 0;
    let low = Infinity; // the quietest level since the last strike
    const end = Date.now() + 3000;
    while (Date.now() < end) {
      const db = Number.isFinite(Number(scope.dataset.db)) ? Number(scope.dataset.db) : -120;
      low = Math.min(low, db);
      if (db - low >= 8) {
        count++;
        low = db;
      }
      await new Promise((r) => setTimeout(r, 15));
    }
    return count;
  });
  expect(strikes).toBeGreaterThanOrEqual(3);

  await page.waitForTimeout(2100); // past the taps: the next click switches Hold off
  await hold.click();
  await expect(hold).toHaveAttribute('aria-pressed', 'false');
});
