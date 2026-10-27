import { expect, type Page, test } from '@playwright/test';
import { cc, midiButton, midiPanel, openMidi, play, times, withFakeController } from './fakeMidi';

const cutoff = (page: Page) => page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
const learnBar = (page: Page) => page.getByRole('status', { name: 'MIDI Learn' });

async function startLearn(page: Page) {
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: 'MIDI Learn' }).click();
  await expect(learnBar(page)).toBeVisible();
}

test.beforeEach(({ page }) => withFakeController(page));

test('MIDI Learn: pick a knob on screen, turn one on the Controller, and it drives that Parameter', async ({ page }) => {
  await startLearn(page);
  await expect(learnBar(page)).toContainText(/click a knob or button/i);
  const before = Number(await cutoff(page).getAttribute('aria-valuenow'));
  await cutoff(page).click(); // selects it for Learn, without moving it
  await expect(learnBar(page)).toContainText(/Cutoff/);
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', String(before));
  await play(page, ...times(4, cc(74, 1))); // an endless encoder, two's-complement steps
  await expect(learnBar(page)).toContainText(/Cutoff.*CC 74/);
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', String(before)); // learning does not move it
  // Learn ends where it began: the MIDI button says Learning, and its panel offers Done in place of MIDI Learn.
  await expect(midiButton(page)).toHaveAttribute('data-learning', 'true');
  await expect(midiButton(page)).toContainText('Learning');
  await expect(learnBar(page)).toContainText(/Esc.*MIDI.*Done/);
  await expect(learnBar(page).getByRole('button')).toHaveCount(0);
  await openMidi(page);
  await expect(midiPanel(page).getByRole('button', { name: 'MIDI Learn' })).toHaveCount(0);
  await expect(midiPanel(page).getByRole('button', { name: /Quick Setup/ })).toHaveCount(0);
  await midiPanel(page).getByRole('button', { name: 'Done' }).click();
  await expect(learnBar(page)).toBeHidden();
  await expect(midiButton(page)).not.toHaveAttribute('data-learning', /./);
  await expect(midiButton(page)).toContainText('1'); // the Controller count is back

  await play(page, ...times(10, cc(74, 1)));
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', String(before + 10));
  await expect(cutoff(page).locator('..')).toHaveAttribute('data-mapped', 'true');

  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toContainText(/Cutoff.*CC 74.*Relative/);
  await page.reload();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toContainText(/Cutoff.*CC 74/); // kept
});

test('a removed Mapping stops driving its Parameter', async ({ page }) => {
  await startLearn(page);
  await cutoff(page).click();
  await play(page, ...times(4, cc(74, 1)));
  await page.keyboard.press('Escape'); // Escape also ends Learn
  await expect(learnBar(page)).toBeHidden();
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: 'Remove Cutoff Mapping' }).click();
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toHaveCount(0);
  const before = await cutoff(page).getAttribute('aria-valuenow');
  await play(page, ...times(5, cc(74, 1)));
  await page.waitForTimeout(200);
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', before!);
});

test('an Action learns from a pad: the pad then toggles Hold and no longer plays a Note', async ({ page }) => {
  const hold = page.getByRole('button', { name: 'Hold' });
  await startLearn(page);
  await hold.click(); // selects Hold for Learn, without toggling it
  await expect(hold).toHaveAttribute('aria-pressed', 'false');
  await play(page, [0x99, 36, 100], [0x89, 36, 0]); // pad on channel 10
  await expect(learnBar(page)).toContainText(/Hold.*Note C2/);
  await page.keyboard.press('Escape');

  await play(page, [0x99, 36, 100], [0x89, 36, 0]);
  await expect(hold).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('group', { name: 'Piano' }).locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.waitForTimeout(2100); // past the time for tapping a Hold rhythm: the next press switches it off
  await play(page, [0x99, 36, 100], [0x89, 36, 0]);
  await expect(hold).toHaveAttribute('aria-pressed', 'false');
});

test('the Activity Monitor shows the last message received', async ({ page }) => {
  await openMidi(page);
  const monitor = midiPanel(page).getByRole('status', { name: 'MIDI activity' });
  await expect(monitor).toContainText(/nothing received/i);
  await play(page, cc(7, 100, 2));
  await expect(monitor).toContainText('ch 2 · CC 7 · 100');
  await play(page, [0x90, 64, 120]);
  await expect(monitor).toContainText('ch 1 · Note E4 · 120');
});

test('a knob shows when hardware moves it, and when Pickup is still waiting for the knob to reach it', async ({ page }) => {
  await startLearn(page);
  await cutoff(page).click();
  await play(page, cc(20, 10), cc(20, 11), cc(20, 12), cc(20, 13)); // an Absolute knob, far below Cutoff
  await page.keyboard.press('Escape');
  const knob = cutoff(page).locator('..');
  await play(page, cc(20, 14));
  await expect(knob).toHaveAttribute('data-midi', 'waiting');
  await play(page, cc(20, 127)); // swept past the value: picked up
  await expect(knob).toHaveAttribute('data-midi', 'moved');
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', '100');
  await expect(knob).not.toHaveAttribute('data-midi', /./, { timeout: 2000 }); // the flash fades
});

test('a Waveform learns from an encoder: two clicks step to the next shape, as they appear on screen', async ({ page }) => {
  const picker = page.getByRole('radiogroup', { name: 'Osc 1 Waveform' });
  await expect(picker.getByRole('radio', { name: 'Saw' })).toHaveAttribute('aria-checked', 'true');
  await startLearn(page);
  await picker.getByRole('radio', { name: 'Sine' }).click(); // selects the picker, without changing it
  await expect(learnBar(page)).toContainText(/Osc 1 Waveform/);
  await expect(picker.getByRole('radio', { name: 'Saw' })).toHaveAttribute('aria-checked', 'true');
  await play(page, ...times(4, cc(2, 1)));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600); // the encoder at rest, then turned again
  await play(page, ...times(2, cc(2, 1)));
  await expect(picker.getByRole('radio', { name: 'Square' })).toHaveAttribute('aria-checked', 'true');
  await play(page, ...times(4, cc(2, 127)));
  await expect(picker.getByRole('radio', { name: 'Triangle' })).toHaveAttribute('aria-checked', 'true');
  await expect(picker).toHaveAttribute('data-mapped', 'true');
});

test('an LFO Waveform learns from an encoder, as the Oscillator’s does', async ({ page }) => {
  const picker = page.getByRole('radiogroup', { name: 'LFO 1 Waveform' });
  await expect(picker.getByRole('radio', { name: 'Sine' })).toHaveAttribute('aria-checked', 'true');
  await startLearn(page);
  await picker.getByRole('radio', { name: 'Square' }).click(); // selects the picker, without changing it
  await expect(learnBar(page)).toContainText(/LFO 1 Waveform/);
  await expect(picker.getByRole('radio', { name: 'Sine' })).toHaveAttribute('aria-checked', 'true');
  await play(page, ...times(4, cc(3, 1)));
  await expect(learnBar(page)).toContainText(/LFO 1 Waveform.*CC 3/);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600); // the encoder at rest, then turned again
  await play(page, ...times(2, cc(3, 1)));
  await expect(picker.getByRole('radio', { name: 'Triangle' })).toHaveAttribute('aria-checked', 'true');
  await play(page, ...times(4, cc(3, 1)));
  await expect(picker.getByRole('radio', { name: 'Saw', exact: true })).toHaveAttribute('aria-checked', 'true');
  await play(page, ...times(2, cc(3, 127)));
  await expect(picker.getByRole('radio', { name: 'Square' })).toHaveAttribute('aria-checked', 'true');
  await expect(picker).toHaveAttribute('data-mapped', 'true');
});

test('an LFO’s Destination learns from an encoder: it steps through the list as the arrows do', async ({ page }) => {
  const lfo2 = page.getByRole('group', { name: 'LFO 2', exact: true });
  const destination = lfo2.getByRole('button', { name: /Destination:/ });
  await expect(destination).toHaveAccessibleName('LFO 2 Destination: Pitch');
  await startLearn(page);
  await destination.click(); // selects the selector, without opening its menu
  await expect(learnBar(page)).toContainText(/LFO 2 Destination/);
  await expect(lfo2.getByRole('menu')).toHaveCount(0);
  await play(page, ...times(4, cc(5, 1)));
  await expect(learnBar(page)).toContainText(/LFO 2 Destination.*CC 5/);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600); // the encoder at rest, then turned again
  await play(page, ...times(2, cc(5, 1)));
  await expect(destination).toHaveAccessibleName('LFO 2 Destination: Osc 2 Pitch');
  await play(page, ...times(4, cc(5, 1)));
  await expect(destination).toHaveAccessibleName('LFO 2 Destination: Pulse Width');
  await play(page, ...times(2, cc(5, 127)));
  await expect(destination).toHaveAccessibleName('LFO 2 Destination: Detune');
  await expect(lfo2.locator('.destination-picker')).toHaveAttribute('data-mapped', 'true');
  // LFO 1's own selector is not moved by it.
  await expect(page.getByRole('group', { name: 'LFO 1', exact: true }).getByRole('button', { name: /Destination:/ })).toHaveAccessibleName('LFO 1 Destination: Cutoff');
});

test('a Controller moving a knob on a hidden tab brings that tab into view', async ({ page }) => {
  const mapping = (id: string, number: number) => ({
    control: { kind: 'cc', channel: 1, number },
    target: { kind: 'param', id },
    mode: 'relative-twos',
  });
  await page.evaluate((m) => localStorage.setItem('limpide.mappings', JSON.stringify(m)), [mapping('osc2PulseWidth', 4), mapping('pulseWidth', 9)]);
  await page.reload();
  const tabs = page.getByRole('tablist', { name: 'Oscillator' });
  await expect(tabs.getByRole('tab', { name: 'Osc 1' })).toHaveAttribute('aria-selected', 'true');
  await play(page, cc(4, 1));
  await expect(tabs.getByRole('tab', { name: /Osc 2/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('group', { name: 'Osc 2' }).getByRole('slider', { name: 'Pulse Width' })).toBeVisible();
  await play(page, cc(9, 1)); // and back, for an Osc 1 knob
  await expect(tabs.getByRole('tab', { name: 'Osc 1' })).toHaveAttribute('aria-selected', 'true');
});

test('each Action does its own job from its own pad: Next and Previous Preset, Freeze, Snapshot, Hold (none swapped)', async ({ page }) => {
  const pad = (note: number) => [[0x99, note, 100], [0x89, note, 0]];
  const learn = async (target: () => Promise<void>, note: number, name: RegExp) => {
    await startLearn(page);
    await target();
    await play(page, ...pad(note));
    await expect(learnBar(page)).toContainText(name);
    await page.keyboard.press('Escape');
    await expect(learnBar(page)).toBeHidden();
  };
  const display = page.getByRole('button', { name: 'Display' });
  const inDisplay = (name: string) => async () => {
    if ((await display.getAttribute('aria-expanded')) !== 'true') await display.click();
    await page.getByRole('region', { name: 'Viewer controls' }).getByRole('button', { name, exact: true }).click();
  };
  await learn(() => page.getByRole('button', { name: 'Next Preset' }).click(), 36, /Next Preset/);
  await learn(() => page.getByRole('button', { name: 'Previous Preset' }).click(), 37, /Previous Preset/);
  await learn(inDisplay('Freeze'), 38, /Freeze/);
  await learn(inDisplay('Snapshot'), 39, /Snapshot/);
  await learn(() => page.getByRole('button', { name: 'Hold' }).click(), 40, /Hold/);
  if ((await display.getAttribute('aria-expanded')) === 'true') await display.click();

  const patchName = page.getByRole('button', { name: /^Patch: / });
  await expect(patchName).toHaveAttribute('aria-label', 'Patch: Init');
  await play(page, ...pad(36));
  await expect(patchName).toHaveAttribute('aria-label', 'Patch: Pure Sine'); // the next one
  await play(page, ...pad(37));
  await expect(patchName).toHaveAttribute('aria-label', 'Patch: Init'); // back
  await play(page, ...pad(38));
  await expect(page.locator('main')).toHaveAttribute('data-frozen', 'true');
  await play(page, ...pad(38));
  await expect(page.locator('main')).not.toHaveAttribute('data-frozen');
  await expect(display).not.toHaveAttribute('data-active');
  await play(page, ...pad(39));
  await expect(display).toHaveAttribute('data-active', 'true'); // a Snapshot is held
  await expect(page.getByRole('button', { name: 'Hold' })).toHaveAttribute('aria-pressed', 'false');
  await play(page, ...pad(40));
  await expect(page.getByRole('button', { name: 'Hold' })).toHaveAttribute('aria-pressed', 'true');
});
