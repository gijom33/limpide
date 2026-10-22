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
