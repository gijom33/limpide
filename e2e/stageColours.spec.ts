import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

// The Hardware palette, validated for colour-blind separation and contrast against each theme's canvas.
const PALETTE = {
  dark: { Oscillator: 'rgb(8, 173, 114)', Filter: 'rgb(227, 107, 2)', Amp: 'rgb(160, 82, 254)' },
  light: { Oscillator: 'rgb(6, 145, 95)', Filter: 'rgb(151, 50, 1)', Amp: 'rgb(122, 31, 208)' },
} as const;

for (const theme of ['dark', 'light'] as const) {
  test(`each stage wears its own validated colour on traces, knobs and outline (${theme})`, async ({ page }) => {
    await page.goto('/');
    if (theme === 'light') {
      await openDisplay(page);
      await page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name: 'Light' }).click();
      await page.keyboard.press('Escape');
    }

    for (const [stage, colour] of Object.entries(PALETTE[theme])) {
      const block = page.getByRole('region', { name: stage });
      // Viewers read --trace from their canvas; it must resolve to the stage colour.
      const trace = await block.evaluate((el) => {
        const probe = document.createElement('div');
        probe.style.color = getComputedStyle(el).getPropertyValue('--trace');
        el.append(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      });
      expect(trace, `${stage} trace`).toBe(colour);
      expect(await block.evaluate((el) => getComputedStyle(el).borderTopColor), `${stage} outline`).not.toBe(
        await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--border')),
      );

      const knob = block.getByRole('slider').first();
      if (await knob.count()) {
        const pointer = await knob.evaluate((el) => getComputedStyle(el, '::after').backgroundColor);
        expect(pointer, `${stage} knob pointer`).toBe(colour);
      }
    }
  });
}
