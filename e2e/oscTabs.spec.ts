import { expect, test } from '@playwright/test';

test('Osc 1, Osc 2, Sub & Noise and the Mixer are tabs, one shown at a time, each Oscillator with its own pitch row (issue 90)', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Oscillator' });
  const osc1 = tabs.getByRole('tab', { name: 'Osc 1' });
  const osc2 = tabs.getByRole('tab', { name: /Osc 2/ });
  const subNoise = tabs.getByRole('tab', { name: 'Sub & Noise' });
  const mixer = tabs.getByRole('tab', { name: 'Mixer' });
  const shows = async (visible: string[]) => {
    for (const [name, locator] of [
      ['Osc 1', page.getByRole('radiogroup', { name: 'Osc 1 Waveform' })],
      ['Osc 2', page.getByRole('radiogroup', { name: 'Osc 2 Waveform' })],
      ['Osc 1 Pitch', page.getByRole('group', { name: 'Osc 1 Pitch' })],
      ['Tuning', page.getByRole('group', { name: 'Tuning' })],
      ['Sub', page.getByRole('group', { name: 'Sub', exact: true })],
      ['Noise', page.getByRole('group', { name: 'Noise', exact: true })],
      ['Mixer', page.getByRole('group', { name: 'Mixer' })],
    ] as const) {
      if (visible.includes(name)) await expect(locator, name).toBeVisible();
      else await expect(locator, name).toBeHidden();
    }
  };
  await expect(osc1).toHaveAttribute('aria-selected', 'true');
  await shows(['Osc 1', 'Osc 1 Pitch']);
  await osc2.click();
  await expect(osc2).toHaveAttribute('aria-selected', 'true');
  await shows(['Osc 2', 'Tuning']);
  await subNoise.click();
  await expect(subNoise).toHaveAttribute('aria-selected', 'true');
  await shows(['Sub', 'Noise']);
  await expect(page.getByRole('radiogroup', { name: 'Sub Octave' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Noise Colour' })).toBeVisible();
  await mixer.click();
  await expect(mixer).toHaveAttribute('aria-selected', 'true');
  await shows(['Mixer']);
});

test('the tabs work from the keyboard (arrow keys)', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Oscillator' });
  await tabs.getByRole('tab', { name: 'Osc 1' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: /Osc 2/ })).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByRole('tab', { name: /Osc 2/ })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.getByRole('tab', { name: 'Osc 1' })).toHaveAttribute('aria-selected', 'true');
});

test('the Osc 2 tab shows when Osc 2 is sounding, even while Osc 1 is selected', async ({ page }) => {
  await page.goto('/');
  const osc2 = page.getByRole('tablist', { name: 'Oscillator' }).getByRole('tab', { name: /Osc 2/ });
  await expect(osc2).not.toHaveAttribute('data-sounding', 'true');
  await page.getByRole('tab', { name: 'Mixer' }).click();
  const mix2 = page.getByRole('group', { name: 'Mixer' }).getByRole('slider', { name: 'Osc 2' });
  await mix2.focus();
  await page.keyboard.press('ArrowUp');
  await expect(osc2).toHaveAttribute('data-sounding', 'true');
});

test('Osc 1 and Sub & Noise show a dot too while any of their sources is heard', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Oscillator' });
  const osc1 = tabs.getByRole('tab', { name: /Osc 1/ });
  const subNoise = tabs.getByRole('tab', { name: /Sub & Noise/ });
  await expect(osc1).toHaveAttribute('data-sounding', 'true');
  await expect(subNoise).not.toHaveAttribute('data-sounding', 'true');
  await tabs.getByRole('tab', { name: 'Mixer' }).click();
  const mixer = page.getByRole('group', { name: 'Mixer' });
  await mixer.getByRole('slider', { name: 'Noise' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(subNoise).toHaveAttribute('data-sounding', 'true');
  // Osc 1 down, but Ring still multiplies it by Osc 2: still heard.
  await mixer.getByRole('slider', { name: 'Ring' }).focus();
  await page.keyboard.press('ArrowUp');
  await mixer.getByRole('slider', { name: 'Osc 1' }).focus();
  await page.keyboard.press('Home');
  await expect(osc1).toHaveAttribute('data-sounding', 'true');
  await mixer.getByRole('slider', { name: 'Ring' }).focus();
  await page.keyboard.press('Home');
  await expect(osc1).not.toHaveAttribute('data-sounding', 'true');
});

test('Osc 2’s dot never pushes the Mixer tab aside: its room is kept while it is hidden', async ({ page }) => {
  await page.goto('/');
  const mixer = page.getByRole('tab', { name: 'Mixer' });
  const before = (await mixer.boundingBox())!.x;
  await mixer.click();
  await page.getByRole('group', { name: 'Mixer' }).getByRole('slider', { name: 'Osc 2' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('tab', { name: /Osc 2/ })).toHaveAttribute('data-sounding', 'true');
  expect((await mixer.boundingBox())!.x).toBe(before);
});

for (const [width, height] of [
  [1300, 900],
  [1100, 900],
]) {
  test(`intermediate windows fit without scrolling too (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
  });
}

for (const width of [1710, 1100, 872]) {
  test(`Pulse Width sits in the same place on both Oscillator tabs (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const where = async (osc: 'Osc 1' | 'Osc 2') => {
      await page.getByRole('tab', { name: new RegExp(osc) }).click();
      const box = await page.getByRole('group', { name: osc }).getByRole('slider', { name: 'Pulse Width' }).boundingBox();
      return { x: Math.round(box!.x), y: Math.round(box!.y) };
    };
    expect(await where('Osc 2')).toEqual(await where('Osc 1'));
  });
}

for (const [width, height] of [
  [1710, 1060],
  [1440, 900],
  [1300, 900],
  [1100, 900],
  [872, 920],
]) {
  test(`the tabs sit under the heading, Pulse Width beside the Waveform picker, pickers all one size (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    const m = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      const heading = r('[aria-label="Oscillators"] h2');
      const tabs = r('[role="tablist"]');
      const picker = r('[aria-label="Osc 1 Waveform"]');
      const dial = r('[aria-label="Osc 1"] .knob-dial');
      const button = (s: string) => Math.round(document.querySelector(`${s} [role="radio"]`)!.getBoundingClientRect().width);
      return {
        tabsUnderHeading: tabs.top >= heading.bottom - 1,
        pulseWidthBeside: dial.left > picker.right && Math.abs(dial.top + dial.height / 2 - (picker.top + picker.height / 2)) < 30,
        pickers: [button('[aria-label="Osc 1 Waveform"]'), button('[aria-label="Filter Mode"]'), button('[aria-label="LFO 1 Waveform"]')],
        scrolls: document.documentElement.scrollHeight > innerHeight,
      };
    });
    expect(m.tabsUnderHeading).toBe(true);
    expect(m.pulseWidthBeside).toBe(true);
    expect(new Set(m.pickers).size).toBe(1);
    expect(m.scrolls).toBe(false);
  });
}

// The owner, 2026-10-27: on a phone the Waveform picker sat at the top of its row, above its name and the Pulse
// Width dial. Its tooltip's anchor kept it from the rule that lines a picker up with the row's dial.
for (const [width, height] of [[375, 812], [430, 932], [690, 830], [1100, 900], [1440, 900]] as const) {
  test(`the Waveform picker lines up with its name and the Pulse Width dial (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const m = await page.evaluate(() => {
      const r = (e: Element) => e.getBoundingClientRect();
      const picker = r(document.querySelector('[aria-label="Osc 1 Waveform"]')!);
      const row = document.querySelector('[aria-label="Osc 1 Waveform"]')!.closest('.sub-block')!;
      const name = r(row.querySelector('h3')!);
      const dial = r(row.querySelector('.knob-dial')!);
      const mid = (b: DOMRect) => b.top + b.height / 2;
      return { beside: name.right <= picker.left, offName: Math.abs(mid(name) - mid(picker)), inDial: mid(picker) > dial.top && mid(picker) < dial.bottom };
    });
    if (m.beside) expect(m.offName, JSON.stringify(m)).toBeLessThanOrEqual(1);
    expect(m.inDial, JSON.stringify(m)).toBe(true);
  });
}

test('controls of a source not heard are greyed out, choices too, and wake when it is heard', async ({ page }) => {
  await page.goto('/');
  // Controls on hidden tabs too: by name, not by role (which skips them).
  const inactive = (name: string) => page.locator(`[aria-label="${name}"]`).evaluate((el) => !!el.closest('[data-inactive]'));
  const mixer = page.getByRole('group', { name: 'Mixer' });
  const fader = async (name: string, key: 'End' | 'Home') => {
    await page.getByRole('tab', { name: 'Mixer' }).click();
    await mixer.getByRole('slider', { name, exact: true }).focus();
    await page.keyboard.press(key);
  };
  // Init: Osc 1 sounds; Osc 2, the Sub and the Noise do not.
  expect(await inactive('Osc 1 Waveform')).toBe(false);
  expect(await inactive('FM')).toBe(false);
  expect(await inactive('Osc 2 Waveform')).toBe(true);
  for (const name of ['Sub Octave', 'Sub Waveform', 'Noise Colour']) expect(await inactive(name), name).toBe(true);
  await fader('Sub', 'End');
  expect(await inactive('Sub Octave')).toBe(false);
  expect(await inactive('Noise Colour')).toBe(true);
  await fader('Noise', 'End');
  expect(await inactive('Noise Colour')).toBe(false);
  // Osc 1 down: its Waveform and FM grey out, its Octave stays (it moves the Sub too).
  await fader('Osc 1', 'Home');
  expect(await inactive('Osc 1 Waveform')).toBe(true);
  expect(await inactive('FM')).toBe(true);
  expect(await inactive('Osc 1 Octave')).toBe(false);
});
