import { expect, test } from '@playwright/test';

test('dragging a knob changes its value without selecting any text', async ({ page }) => {
  await page.goto('/');
  const cutoff = page.getByRole('slider', { name: 'Cutoff' });
  const before = await cutoff.getAttribute('aria-valuetext');

  const box = (await cutoff.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Drag down and sideways across the labels and neighbouring knobs, as a real hand does.
  await page.mouse.move(box.x + 200, box.y + 120, { steps: 12 });
  await page.mouse.up();

  expect(await cutoff.getAttribute('aria-valuetext')).not.toBe(before);
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
});

// Where every visible knob sits, rounded to the pixel.
const knobLayout = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.knob')]
      .filter((k) => k.checkVisibility())
      .map((k) => {
        const r = k.getBoundingClientRect();
        return `${k.querySelector('[role=slider]')?.getAttribute('aria-label')} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}`;
      }),
  );

test('turning knobs never moves or resizes any knob, whatever width their values take', async ({ page }) => {
  await page.goto('/');
  const before = await knobLayout(page);
  // Parameters whose readouts change width the most across their range (Hz → kHz, ms → s, Off → seconds, signs).
  for (const [region, name] of [
    ['Filter', 'Cutoff'],
    ['Filter', 'Amount'],
    ['Amp', 'Attack'],
    ['Envelope Timeline', 'Rate'],
    ['Envelope Timeline', 'Glide'],
  ]) {
    const knob = page.getByRole('region', { name: region }).getByRole('slider', { name, exact: true });
    const seen = new Set<string | null>();
    for (const key of ['ArrowDown', 'ArrowUp']) {
      for (let i = 0; i < 10; i++) {
        // Five key presses in one go (one round trip instead of five), then a tick for React to render them. Not
        // requestAnimationFrame: background tabs (parallel runs) pause it.
        await knob.evaluate(async (el, k) => {
          for (let n = 0; n < 5; n++) el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
          await new Promise((resolve) => setTimeout(resolve, 0));
        }, key);
        const value = await knob.getAttribute('aria-valuetext');
        seen.add(value);
        expect(await knobLayout(page), `${name} at ${value}`).toEqual(before);
      }
    }
    expect(seen.size, `${name} really turned`).toBeGreaterThan(5);
  }
});

test('a mapped knob’s marker takes no room', async ({ page }) => {
  await page.goto('/');
  const before = await knobLayout(page);
  await page.evaluate(() =>
    localStorage.setItem(
      'limpide.mappings',
      JSON.stringify(
        ['cutoff', 'resonance', 'velocityCutoff'].map((id, i) => ({
          control: { kind: 'cc', channel: 1, number: 70 + i },
          target: { kind: 'param', id },
          mode: 'absolute',
        })),
      ),
    ),
  );
  await page.reload();
  await expect(page.getByRole('region', { name: 'Filter' }).locator('.knob[data-mapped]')).toHaveCount(3);
  expect(await knobLayout(page)).toEqual(before);
  await page.evaluate(() => localStorage.removeItem('limpide.mappings'));
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('a knob shows its name, and its value only while it changes, in the same line', async ({ page }) => {
    await page.goto('/');
    const dial = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
    const knob = dial.locator('xpath=ancestor::div[contains(@class, "knob")][1]');
    const name = knob.locator('.knob-label');
    const value = knob.locator('.knob-value > span').first();
    await expect(name).toBeVisible();
    await expect(value).toBeHidden();
    const at = async () => [(await dial.boundingBox())!.y, (await name.boundingBox())!.y];
    const before = await at();

    await dial.press('ArrowUp');
    await expect(value).toBeVisible();
    await expect(value).toHaveText((await dial.getAttribute('aria-valuetext'))!);
    await expect(name).toBeHidden();
    expect((await value.boundingBox())!.y).toBeCloseTo(before[1], 0); // the value takes the name's place
    expect(await at()).toEqual(before); // nothing moved

    await expect(value).toBeHidden({ timeout: 3000 }); // and the name comes back
    await expect(name).toBeVisible();
  });

  test('knob rows have no line for values', async ({ page }) => {
    await page.goto('/');
    const dial = page.getByRole('slider', { name: 'Cutoff' });
    const knob = dial.locator('xpath=ancestor::div[contains(@class, "knob")][1]');
    const [k, d, n] = await Promise.all([knob, dial, knob.locator('.knob-label')].map(async (l) => (await l.boundingBox())!));
    expect(k.y + k.height).toBeCloseTo(n.y + n.height, 0); // the name is the knob's last line
    expect(n.y).toBeGreaterThan(d.y + d.height - 1);
  });
});
