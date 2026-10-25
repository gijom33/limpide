import { appendFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { auditPage, type Rule } from './audit';

/**
 * The design principles' measurable rules (docs/design-principles.md, issue 17), on every screen state a visitor
 * can reach without playing: the page with each Oscillator tab, and each panel open.
 *
 * Today's failures are listed below, each with the issue that fixes it. A failure not on the list fails the test,
 * and so does an entry that no longer fails anything: fixing a failure means taking it off the list.
 */
interface Known {
  rule: Rule;
  /** The elements it covers. */
  selector: string;
  /** Only in this theme or at this size; both when left out. */
  theme?: 'dark' | 'light';
  size?: 'laptop' | 'phone';
  issue: number;
}
const KNOWN: Known[] = [
  // Issue 27: the edges of buttons, pickers, fields and Patch items (--border, --control-on), a knob's groove and
  // a fader's track (--groove) barely stand out from the panel in either theme (1.1 to 1.5:1).
  { rule: 'boundary', selector: '.tool, .segmented button, .patch-item, .patch-save input', issue: 27 },
  { rule: 'boundary', selector: '.knob-groove, .fader', issue: 27 },
  // Issue 27: in the light theme, muted text on buttons and pickers is just short (4.1 to 4.4:1), and the
  // Oscillators green is too light for text (3.3 to 3.5:1).
  { rule: 'text', selector: '.tool, .tool *, .segmented button, .section-strip button', theme: 'light', issue: 27 },
  { rule: 'text', selector: ".block[data-stage='osc'] h2", theme: 'light', issue: 27 },
  // Issue 27: the key hint on Freeze is drawn at 60 % opacity (2.3 to 2.9:1).
  { rule: 'text', selector: '.tool kbd', issue: 27 },
  // Issue 28: on laptops, the segmented pickers are 22 px tall and the piano's keys 20 px (white) and 12 px
  // (black) wide.
  { rule: 'target', selector: '.segmented button, .piano button', size: 'laptop', issue: 28 },
  // Issue 28: on phones, most controls are 28 px tall (the toolbar height), the header's icon buttons 34 to 40 px
  // wide, the Preset arrows 18 px wide, the logo 24 px tall, and the piano's black keys 27 px wide.
  {
    rule: 'target',
    selector: '.tool, .segmented button, .tab-list [role=tab], .patch-item, .patch-save input, .wordmark-button, .piano button',
    size: 'phone',
    issue: 28,
  },
];

const SIZES = {
  laptop: { width: 1440, height: 900, minTarget: 24 }, // WCAG 2.5.8
  phone: { width: 375, height: 812, minTarget: 44 }, // Apple's 44 pt, WCAG 2.5.5
} as const;

/** The states to audit, each opened from the page as loaded and closed again. */
const STATES: { name: string; open?(page: Page): Promise<void>; close?(page: Page): Promise<void> }[] = [
  { name: 'Osc 1 tab' },
  { name: 'Osc 2 tab', open: (page) => page.getByRole('tab', { name: 'Osc 2' }).click(), close: (page) => page.getByRole('tab', { name: 'Osc 1' }).click() },
  { name: 'Mixer tab', open: (page) => page.getByRole('tab', { name: 'Mixer' }).click(), close: (page) => page.getByRole('tab', { name: 'Osc 1' }).click() },
  { name: 'Patches panel', open: (page) => page.getByRole('button', { name: /^Patch:/ }).click(), close: (page) => page.getByRole('button', { name: /^Patch:/ }).click() },
  { name: 'Display panel', open: (page) => page.getByRole('button', { name: 'Display', exact: true }).click(), close: (page) => page.getByRole('button', { name: 'Display', exact: true }).click() },
  { name: 'MIDI panel', open: (page) => page.getByRole('button', { name: 'MIDI', exact: true }).click(), close: (page) => page.getByRole('button', { name: 'MIDI', exact: true }).click() },
  { name: 'About', open: (page) => page.getByRole('button', { name: 'About', exact: true }).click(), close: (page) => page.keyboard.press('Escape') },
];

async function audit(page: Page, size: keyof typeof SIZES, theme: 'dark' | 'light', rules: Rule[]) {
  const { width, height, minTarget } = SIZES[size];
  await page.setViewportSize({ width, height });
  await page.addInitScript((t) => localStorage.setItem('limpide.theme', t), theme);
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  const known = KNOWN.filter((k) => rules.includes(k.rule) && (k.theme ?? theme) === theme && (k.size ?? size) === size);
  const unexpected: string[] = [];
  const matched = new Set<string>();
  for (const state of STATES) {
    await state.open?.(page);
    const result = await page.evaluate(auditPage, { rules, minTarget, known: known.map(({ rule, selector }) => ({ rule, selector })) });
    for (const f of result.unexpected) unexpected.push(`${state.name}: ${f.rule} ${f.what} ${f.measured}`);
    // AUDIT_REPORT=<file> writes every finding the list does not cover, one JSON line each: handy while fixing.
    if (process.env.AUDIT_REPORT) appendFileSync(process.env.AUDIT_REPORT, result.unexpected.map((f) => JSON.stringify({ theme, size, state: state.name, ...f }) + '\n').join(''));
    for (const m of result.matched) matched.add(m);
    await state.close?.(page);
  }
  const unused = known.map((k) => `${k.rule} ${k.selector}`).filter((k) => !matched.has(k));
  return { unexpected: [...new Set(unexpected)], unused };
}

for (const theme of ['dark', 'light'] as const) {
  for (const size of ['laptop', 'phone'] as const) {
    test(`contrast, ${theme} theme, ${size}: text 4.5:1, what draws a control 3:1`, async ({ page }) => {
      const { unexpected, unused } = await audit(page, size, theme, ['text', 'boundary']);
      expect(unexpected, 'failures not on the known list').toEqual([]);
      expect(unused, 'known failures that pass now: take them off the list').toEqual([]);
    });
  }
}

for (const size of ['laptop', 'phone'] as const) {
  test(`targets, ${size}: at least ${SIZES[size].minTarget} × ${SIZES[size].minTarget} px`, async ({ page }) => {
    const { unexpected, unused } = await audit(page, size, 'dark', ['target']);
    expect(unexpected, 'failures not on the known list').toEqual([]);
    expect(unused, 'known failures that pass now: take them off the list').toEqual([]);
  });
}

test('every knob and fader works from the keyboard, with a focus ring for the keyboard only', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  const sliders = page.getByRole('slider');
  for (const tab of ['Osc 1', 'Osc 2', 'Mixer']) {
    await page.getByRole('tab', { name: tab }).click();
    const visible = await sliders.evaluateAll((all) => all.filter((s) => s.checkVisibility({ visibilityProperty: true })).length);
    expect(visible, tab).toBeGreaterThan(10);
    // Tab through the whole page once: each slider reached shows a ring and moves with the arrow keys.
    await page.locator('body').evaluate((b) => (document.activeElement as HTMLElement | null)?.blur?.() ?? b);
    const reached = new Set<string>();
    const problems: string[] = [];
    for (let i = 0; i < 300; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el.getAttribute('role') !== 'slider') return el === document.body ? 'body' : null;
        const all = [...document.querySelectorAll('[role="slider"]')];
        const s = getComputedStyle(el);
        return { id: `${all.indexOf(el)} ${el.getAttribute('aria-label')}`, ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 };
      });
      if (focused === 'body') break;
      if (!focused || reached.has(focused.id)) continue;
      reached.add(focused.id);
      if (!focused.ring) problems.push(`${focused.id}: no focus ring`);
      const now = () => page.evaluate(() => document.activeElement!.getAttribute('aria-valuenow'));
      const before = await now();
      await page.keyboard.press('ArrowUp');
      let after = await now();
      if (after === before) {
        await page.keyboard.press('ArrowDown'); // already at the top
        after = await now();
        await page.keyboard.press('ArrowUp');
      } else await page.keyboard.press('ArrowDown');
      if (after === before) problems.push(`${focused.id}: the arrow keys do not move it`);
    }
    expect(problems, tab).toEqual([]);
    expect(reached.size, `${tab}: every slider on screen is reached with Tab`).toBe(visible);
  }

  // A click on a knob or a fader focuses it for the keys, without the ring.
  for (const name of ['Cutoff', 'Attack']) {
    const slider = page.getByRole('slider', { name, exact: true }).first();
    await slider.click();
    await expect(slider).toBeFocused();
    expect(await slider.evaluate((el) => getComputedStyle(el).outlineStyle), name).toBe('none');
  }
});
