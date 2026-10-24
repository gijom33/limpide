import { expect, test } from '@playwright/test';

// The icon pickers: one representation everywhere, the Filter Mode's segmented control.
const PICKERS = ['Filter Mode', 'Osc 1 Waveform'];

test('the Waveform and Filter Mode pickers look the same, and each hugs its icons', async ({ page }) => {
  await page.goto('/');
  const looks = await page.evaluate((names) => {
    return names.map((name) => {
      const group = document.querySelector<HTMLElement>(`[role="radiogroup"][aria-label="${name}"]`)!;
      const buttons = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
      const g = getComputedStyle(group);
      const checked = getComputedStyle(group.querySelector<HTMLElement>('[aria-checked="true"]')!);
      const unchecked = getComputedStyle(group.querySelector<HTMLElement>('[aria-checked="false"]')!);
      const box = group.getBoundingClientRect();
      const last = buttons.at(-1)!.getBoundingClientRect();
      return {
        name,
        look: {
          trackRadius: g.borderRadius, trackBorder: g.borderTopWidth, trackBackground: g.backgroundColor,
          height: Math.round(box.height), buttonHeight: Math.round(buttons[0].getBoundingClientRect().height),
          buttonRadius: checked.borderRadius, checkedBackground: checked.backgroundColor, uncheckedBorder: unchecked.borderTopWidth,
        },
        spareRight: Math.round(box.right - last.right),
      };
    });
  }, PICKERS);
  for (const { name, look } of looks.slice(1)) expect(look, name).toEqual(looks[0].look);
  for (const { name, spareRight } of looks) expect(spareRight, `${name}: no empty track after the last icon`).toBeLessThanOrEqual(6);
});
