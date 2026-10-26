import { expect, test } from '@playwright/test';

// Full-screen browser viewports on MacBooks (points): this Mac (1710×1107, less the ~37 pt notch band, with a
// margin), and the common 1440×900.
// How tall each Viewer must at least be: generous on this Mac; the 78 pt floor on the smaller 1440×900, where
// the toolbar wraps under the title and Osc 2's knobs wrap.
for (const [width, height, minViewer] of [
  [1710, 1060, 150],
  [1440, 900, 78],
]) {
  test(`the whole app fits a ${width}×${height} screen without scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    const { scrollHeight, timelineBottom, viewport } = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      timelineBottom: document.querySelector('.timeline')!.getBoundingClientRect().bottom,
      viewport: innerHeight,
    }));
    expect(scrollHeight).toBeLessThanOrEqual(viewport);
    expect(timelineBottom).toBeLessThanOrEqual(viewport);
  });

  test(`the Viewers stay usefully large at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLCanvasElement>('canvas.scope, canvas.spectrum')].map((c) => c.getBoundingClientRect().height),
    );
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(minViewer);
  });
}

for (const [width, height] of [
  [1710, 1060],
  [1440, 900],
  [1100, 800],
  [872, 920],
]) {
  test(`the three stages' Viewers are the same size and line up (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    const boxes = await page.evaluate(() =>
      ['scope', 'spectrum'].map((kind) =>
        [...document.querySelectorAll<HTMLCanvasElement>(`canvas.${kind}`)].map((c) => {
          const r = c.getBoundingClientRect();
          return { kind, top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
        }),
      ),
    );
    for (const row of boxes) {
      const [first, ...rest] = row;
      for (const other of rest) {
        expect(Math.abs(other.height - first.height), `${first.kind} height`).toBeLessThanOrEqual(1);
        expect(Math.abs(other.width - first.width), `${first.kind} width`).toBeLessThanOrEqual(1);
        expect(Math.abs(other.top - first.top), `${first.kind} top`).toBeLessThanOrEqual(1);
      }
    }
  });
}

for (const [width, height] of [
  [872, 920],
  [960, 800],
  [1100, 800],
  [1300, 900],
  [1710, 1060],
]) {
  test(`nothing spills out of place at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    const problems = await page.evaluate(() => {
      const found: string[] = [];
      const box = (el: Element) => el.getBoundingClientRect();
      for (const block of document.querySelectorAll('.block')) {
        const b = box(block);
        // The canvases themselves, not just their container: a collapsed container can sit inside while they spill.
        for (const part of block.querySelectorAll('.block-controls, .tap figcaption, canvas')) {
          const r = box(part);
          if (r.bottom > b.bottom + 1 || r.top < b.top - 1) found.push(`${block.getAttribute('aria-label')}: ${part.className} outside its block`);
        }
      }
      const stagesBottom = Math.max(...[...document.querySelectorAll('.chain > .block')].map((b) => box(b).bottom));
      if (stagesBottom > box(document.querySelector('.timeline')!).top + 1) found.push('stages overlap the Timeline');
      const title = box(document.querySelector('h1')!);
      const display = box(document.querySelector('.display-menu')!);
      if (display.top > title.bottom) found.push('Display button is not on the title line');
      return found;
    });
    expect(problems).toEqual([]);
  });
}

for (const [width, height, maxControls, minViewer] of [
  [872, 920, 350, 78],
  [1100, 900, 300, 100],
]) {
  test(`narrow stages use compact controls, leaving room for the Viewers (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    const m = await page.evaluate(() => ({
      controls: Math.max(...[...document.querySelectorAll('.block-controls')].map((c) => c.getBoundingClientRect().height)),
      viewer: Math.min(...[...document.querySelectorAll('canvas.scope, canvas.spectrum')].map((c) => c.getBoundingClientRect().height)),
      scroll: document.documentElement.scrollHeight,
    }));
    expect(m.controls).toBeLessThanOrEqual(maxControls);
    expect(m.viewer).toBeGreaterThanOrEqual(minViewer);
    expect(m.scroll).toBeLessThanOrEqual(height);
  });
}

// ADR-0008: knobs worth turning while playing are big, set-and-forget ones small; smaller together on compact
// windows, and on phones the big ones less big, so a row of two of each fits.
for (const [width, height, big, small] of [
  [1710, 1060, 68, 52],
  [1440, 900, 68, 52],
  [1100, 900, 52, 40],
  [872, 920, 52, 40],
  [393, 852, 60, 52],
]) {
  test(`play knobs are ${big} pt and set-and-forget knobs ${small} pt at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    // Not getByRole: it skips the hidden Oscillator tabs (aria-hidden), whose knobs keep their layout.
    const sizes = await page.locator('[role=slider]').evaluateAll((sliders) =>
      sliders
        // Every laid-out knob, on the shown Oscillator tab or not (hidden tabs keep their layout).
        .filter((s) => s.getClientRects().length > 0 && s.getAttribute('aria-orientation') !== 'vertical')
        .map((s) => `${s.getAttribute('aria-label')} ${Math.round(s.getBoundingClientRect().width)}`),
    );
    const play = ['Cutoff', 'Resonance', 'Amount', 'Rate', 'Depth', 'Detune'];
    expect(sizes.sort()).toEqual(
      ['Cutoff', 'Resonance', 'Velocity', 'Key Track', 'Amount', 'Pulse Width', 'Pulse Width', 'Octave', 'Semitone', 'Detune', 'Rate', 'Depth', 'Rate', 'Depth', 'Glide']
        .map((name) => `${name} ${play.includes(name) ? big : small}`)
        .sort(),
    );
  });
}

// Each control's column is as wide as its dial or its text, whichever is wider (ADR-0008): no knob, fader, row name
// or picker ever comes closer than 8 pt to another in its stage, whatever the window.
for (const [width, height] of [
  [375, 812],
  [1000, 800],
  [1440, 900],
  [1710, 1060],
]) {
  test(`no two controls come closer than 8 pt at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    const tooClose = await page.evaluate(() => {
      const shown = (e: Element | null): e is Element => !!e && e.checkVisibility({ visibilityProperty: true });
      // Text by its glyphs, not its box (a label's box may be wider than its words).
      const rect = (e: Element) => {
        if (e.matches('h3, .knob-label, .knob-value > span')) {
          const range = document.createRange();
          range.selectNodeContents(e);
          return range.getBoundingClientRect();
        }
        return e.getBoundingClientRect();
      };
      const found: string[] = [];
      for (const stage of document.querySelectorAll('.block, .timeline')) {
        const boxes: { name: string; l: number; r: number; t: number; b: number }[] = [];
        for (const control of stage.querySelectorAll('.knob')) {
          const parts = [...control.querySelectorAll('.knob-dial, .fader, .knob-label, .knob-value > span:first-child')].filter(shown).map(rect);
          if (!parts.length) continue;
          boxes.push({
            name: control.querySelector('.knob-label')!.textContent!,
            l: Math.min(...parts.map((p) => p.left)), r: Math.max(...parts.map((p) => p.right)),
            t: Math.min(...parts.map((p) => p.top)), b: Math.max(...parts.map((p) => p.bottom)),
          });
        }
        for (const other of stage.querySelectorAll('.sub-block > h3, .sub-block > .segmented, .lfo-pickers > *')) {
          if (!shown(other)) continue;
          const r = rect(other);
          boxes.push({ name: other.textContent!.slice(0, 16), l: r.left, r: r.right, t: r.top, b: r.bottom });
        }
        boxes.forEach((a, i) =>
          boxes.slice(i + 1).forEach((b) => {
            const sideBySide = Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0;
            const gap = Math.max(b.l - a.r, a.l - b.r);
            if (sideBySide && gap < 8) found.push(`${a.name} | ${b.name}: ${Math.round(gap)} pt`);
          }),
        );
      }
      return found;
    });
    expect(tooClose).toEqual([]);
  });
}

test('the Timeline plot is as tall as its controls, whatever size the window was before', async ({ page }) => {
  // Wide, but under the 1920 px where LFO & Envelopes becomes a column beside the stages (issue 43).
  await page.setViewportSize({ width: 1900, height: 1140 });
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  const measure = () =>
    page.evaluate(() => ({
      plot: Math.round(document.querySelector('.timeline-plot canvas')!.getBoundingClientRect().height),
      controls: Math.round(document.querySelector('.timeline-controls')!.getBoundingClientRect().height),
      viewer: Math.round(document.querySelector('canvas.scope')!.getBoundingClientRect().height),
      keyOnTitleLine: (() => {
        const key = document.querySelector('.timeline-key')!.getBoundingClientRect();
        const title = document.querySelector('.timeline h2')!.getBoundingClientRect();
        const plot = document.querySelector('.timeline-plot canvas')!.getBoundingClientRect();
        return Math.abs(key.top + key.height / 2 - (title.top + title.height / 2)) < 4 && Math.abs(key.left - plot.left) < 2;
      })(),
    }));
  const fresh = await measure();
  expect(fresh.plot).toBe(fresh.controls);
  expect(fresh.keyOnTitleLine).toBe(true);
  // A narrower window, then back: the plot's own pixel size must not have grown the row.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 1900, height: 1140 });
  await page.waitForTimeout(300);
  const again = await measure();
  expect(again.plot).toBe(fresh.plot);
  expect(again.viewer).toBe(fresh.viewer);
});

test('the Filter Mode and Slope stay on one line each, never wrapping inside', async ({ page }) => {
  await page.setViewportSize({ width: 872, height: 920 });
  await page.goto('/');
  const rows = await page.evaluate(() =>
    ['[aria-label="Filter Mode"]', '[aria-label="Slope"]'].map((sel) => {
      const buttons = [...document.querySelectorAll<HTMLElement>(`${sel} [role="radio"]`)];
      const tops = buttons.map((b) => Math.round(b.getBoundingClientRect().top));
      // …and each label on one line: a button no taller than one line of its text plus padding.
      const wrapped = buttons.some((b) => b.scrollHeight > 30 || /\n/.test(b.innerText));
      return new Set(tops).size + (wrapped ? 1 : 0);
    }),
  );
  expect(rows).toEqual([1, 1]);
});

// Phones held upright (the smallest current iPhone, the common size, the largest), and a laptop.
for (const width of [375, 393, 430, 1440]) {
  test(`the Voices choice stays on one row at ${width} wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 860 });
    await page.goto('/');
    const tops = await page
      .getByRole('radiogroup', { name: 'Voices' })
      .getByRole('radio')
      .evaluateAll((radios) => radios.map((r) => Math.round(r.getBoundingClientRect().top)));
    expect(tops).toHaveLength(8);
    expect(new Set(tops).size, `tops: ${tops}`).toBe(1);
  });
}
