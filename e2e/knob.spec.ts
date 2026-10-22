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
  test.slow(); // sweeps five knobs end to end, checking every knob along the way
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
    await knob.focus();
    for (const key of ['ArrowDown', 'ArrowUp']) {
      for (let i = 0; i < 10; i++) {
        await knob.press(key, { delay: 0 });
        await knob.press(key, { delay: 0 });
        await knob.press(key, { delay: 0 });
        await knob.press(key, { delay: 0 });
        await knob.press(key, { delay: 0 });
        expect(await knobLayout(page), `${name} at ${await knob.getAttribute('aria-valuetext')}`).toEqual(before);
      }
    }
  }
});

test('a mapped knob’s marker takes no room', async ({ page }) => {
  await page.goto('/');
  const before = await knobLayout(page);
  await page.evaluate(() =>
    localStorage.setItem(
      'synthview.mappings',
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
  await page.evaluate(() => localStorage.removeItem('synthview.mappings'));
});
