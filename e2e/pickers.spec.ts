import { expect, test } from '@playwright/test';

// The icon pickers: one representation everywhere, the Filter Mode's segmented control.
const PICKERS = ['Filter Mode', 'Osc 1 Waveform', 'LFO 1 Waveform', 'LFO 2 Waveform'];

test('the Waveform, Filter Mode and LFO Waveform pickers look the same, the chosen icon in its section’s colour, and each hugs its icons', async ({ page }) => {
  await page.goto('/');
  const looks = await page.evaluate((names) => {
    return names.map((name) => {
      const group = document.querySelector<HTMLElement>(`[role="radiogroup"][aria-label="${name}"]`)!;
      const buttons = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
      const g = getComputedStyle(group);
      const checked = getComputedStyle(group.querySelector<HTMLElement>('[aria-checked="true"]')!);
      const unchecked = getComputedStyle(group.querySelector<HTMLElement>('[aria-checked="false"]')!);
      // The section's colour, as the chosen option resolves it (LFO 2 has its own).
      const probe = document.createElement('span');
      probe.style.background = 'var(--stage)';
      group.querySelector('[aria-checked="true"]')!.append(probe);
      const stage = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const box = group.getBoundingClientRect();
      const last = buttons.at(-1)!.getBoundingClientRect();
      return {
        name,
        look: {
          trackRadius: g.borderRadius, trackBorder: g.borderTopWidth, trackBackground: g.backgroundColor,
          height: Math.round(box.height), buttonHeight: Math.round(buttons[0].getBoundingClientRect().height),
          buttonRadius: checked.borderRadius, uncheckedBorder: unchecked.borderTopWidth,
        },
        checkedBackground: checked.backgroundColor,
        stage,
        spareRight: Math.round(box.right - last.right),
      };
    });
  }, PICKERS);
  for (const { name, look } of looks.slice(1)) expect(look, name).toEqual(looks[0].look);
  for (const { name, checkedBackground, stage } of looks) expect(checkedBackground, name).toBe(stage);
  expect(new Set(looks.map((l) => l.stage)).size, 'each section its own colour').toBe(looks.length);
  for (const { name, spareRight } of looks) expect(spareRight, `${name}: no empty track after the last icon`).toBeLessThanOrEqual(6);
});
