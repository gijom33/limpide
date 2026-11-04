import { expect, type Locator, type Page, test } from '@playwright/test';
import { type AuditOptions, auditPage } from './audit';

/**
 * "One line, shorter words" (the design principles, issue 156): where a label's room runs short it takes a shorter
 * form, never a second line, and keeps its whole name for screen readers and in its tip. The design audit checks
 * every label at its widths with the page as it opens; these check the labels a Patch makes longer.
 */

/** Both LFOs on, on the longest Destinations, and the Filter Envelope's Amount set: the Timeline key's five entries. */
async function longestKey(page: Page) {
  for (const [lfo, destination] of [['1', 'Pulse Width'], ['2', 'Osc 2 Pitch']]) {
    await page.getByRole('button', { name: new RegExp(`^LFO ${lfo} Destination:`) }).click();
    await page.getByRole('menuitemradio', { name: destination, exact: true }).click();
  }
  for (const name of ['LFO 1 Depth', 'LFO 2 Depth', 'Filter Envelope Amount']) await page.getByRole('slider', { name, exact: true }).press('ArrowUp');
  await expect(page.locator('.timeline-key [data-mark]')).toHaveCount(5);
}

const noSecondLine = (page: Page) => page.evaluate(auditPage, { rules: ['wrap'], minTarget: 0, waivers: [] } satisfies AuditOptions);

// The issue's widths, the audit's, and the narrowest plot column beside the controls (861 px).
for (const [width, height] of [[375, 812], [430, 932], [690, 830], [1440, 900], [280, 568], [320, 568], [861, 900], [1024, 768], [1920, 1080]]) {
  test(`the Timeline key is one line at ${width} px, both LFOs on and both Envelopes shown (issue 156)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await longestKey(page);
    const key = page.locator('.timeline-key');
    const rows = await key.locator('[data-mark]').evaluateAll((marks) => new Set(marks.map((m) => Math.round(m.getBoundingClientRect().top))).size);
    expect(rows).toBe(1);
    const box = (await key.boundingBox())!;
    const section = (await page.getByRole('region', { name: 'LFO & Envelopes' }).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(section.x + section.width);
    expect((await noSecondLine(page)).unexpected).toEqual([]);
  });
}

test('a shortened key entry keeps its whole name for screen readers and in its tip (issue 156)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await longestKey(page);
  const entry = page.locator('.timeline-key [data-mark="lfo-pulseWidth"]');
  await expect(entry).toHaveText('PW', { useInnerText: true }); // a phone's room: its short form
  await expect(entry).toHaveAccessibleName('Pulse Width');
  await entry.focus();
  await expect(page.getByRole('tooltip').locator('visible=true').locator('strong')).toHaveText('Pulse Width');
  // Wide, the whole name.
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(entry).toHaveText('Pulse Width', { useInnerText: true });
  await expect(page.locator('.timeline-key [data-mark="filterEnvelope"]')).toHaveText('Filter Env', { useInnerText: true });
});

test('an LFO’s Destination name fits its picker on one line, its whole name in the button’s name (issue 156)', async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1024, 768], [375, 812]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await longestKey(page);
    const picker = page.getByRole('button', { name: 'LFO 2 Destination: Osc 2 Pitch', exact: true });
    const fits = await picker.locator('[data-one-line]').evaluate((label) => {
      const range = document.createRange();
      range.selectNodeContents(label);
      const text = range.getBoundingClientRect();
      const button = label.closest('button')!.getBoundingClientRect();
      return text.left >= button.left && text.right <= button.right;
    });
    expect(fits, `${width} px`).toBe(true);
    expect((await noSecondLine(page)).unexpected, `${width} px`).toEqual([]);
  }
});

/** The Filter's row of knobs: Cutoff, Resonance, Velocity and Key Track. */
const filterRow = (page: Page) => page.locator('.knobs', { has: page.getByRole('slider', { name: 'Key Track', exact: true }) });
const knobName = (page: Page, name: string) => page.locator('.knob', { has: page.getByRole('slider', { name, exact: true }) }).locator('.knob-label');
/** How many lines a row's knobs sit on: their names' tops. */
const lines = (row: Locator) =>
  row.locator('.knob-label').evaluateAll((names) => new Set(names.map((n) => Math.round(n.getBoundingClientRect().top))).size);

test('Key Track and Velocity read Key and Vel where their row runs short, whole where it does not (issue 223)', async ({ page }) => {
  for (const [width, height] of [[320, 568], [861, 900], [1024, 768]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    // Mac's fonts: the row has room for the whole names.
    await expect(knobName(page, 'Key Track')).toHaveText('Key Track', { useInnerText: true });
    await expect(knobName(page, 'Velocity')).toHaveText('Velocity', { useInnerText: true });
    // A wider font (Linux's, or a larger text setting) leaves the row short: the names step down before a knob wraps.
    await page.addStyleTag({ content: '.knob-label { letter-spacing: 0.3em; }' });
    await expect(knobName(page, 'Key Track'), `${width} px`).toHaveText('Key', { useInnerText: true });
    await expect(knobName(page, 'Velocity'), `${width} px`).toHaveText('Vel', { useInnerText: true });
    expect(await lines(filterRow(page)), `${width} px`).toBe(1);
    // The whole names stay what a screen reader hears.
    await expect(page.getByRole('slider', { name: 'Key Track', exact: true })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Velocity', exact: true })).toBeVisible();
  }
});
