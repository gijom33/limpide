import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

// The Hardware palette, validated for colour-blind separation and contrast against each theme's canvas.
const PALETTE = {
  dark: { Oscillator: 'rgb(8, 173, 114)', Filter: 'rgb(227, 107, 2)', Amp: 'rgb(160, 82, 254)' },
  light: { Oscillator: 'rgb(6, 145, 95)', Filter: 'rgb(151, 50, 1)', Amp: 'rgb(122, 31, 208)' },
} as const;

for (const theme of ['dark', 'light'] as const) {
  test(`each stage wears its own validated colour on traces, control values and outline (${theme})`, async ({ page }) => {
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

      // A knob's value arc, or a fader's fill, is drawn in the stage colour.
      const value = block.locator('.knob-arc, .fader-fill').first();
      if (await value.count()) {
        const drawn = await value.evaluate((el) => (el.matches('.knob-arc') ? getComputedStyle(el).stroke : getComputedStyle(el).backgroundColor));
        expect(drawn, `${stage} value`).toBe(colour);
      }
    }
  });
}

// The row of what changes the sound over time wears the modulation colour, as each stage wears its own.
const MODULATION = { dark: 'rgb(91, 140, 255)', light: 'rgb(47, 95, 224)' } as const;

for (const theme of ['dark', 'light'] as const) {
  test(`the LFO & Envelopes section wears the modulation blue on its heading, outline and knob arcs (${theme})`, async ({ page }) => {
    await page.goto('/');
    if (theme === 'light') {
      await openDisplay(page);
      await page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name: 'Light' }).click();
      await page.keyboard.press('Escape');
    }
    const section = page.getByRole('region', { name: 'LFO & Envelopes' });
    const blue = MODULATION[theme];
    expect(await section.getByRole('heading', { name: 'LFO & Envelopes' }).evaluate((el) => getComputedStyle(el).color)).toBe(blue);
    expect(await section.locator('.knob-arc').first().evaluate((el) => getComputedStyle(el).stroke)).toBe(blue);
    const outline = await section.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(outline).not.toBe(await page.evaluate(() => getComputedStyle(document.body).borderTopColor));
    expect(outline).not.toBe(await page.getByRole('region', { name: 'Amp' }).evaluate((el) => getComputedStyle(el).borderTopColor));
  });
}
