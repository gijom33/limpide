import { expect, type Page, test } from '@playwright/test';
import { cc, midiButton, midiPanel, openMidi, play, times, withFakeController } from './fakeMidi';
import { frames, openDisplay } from './helpers';

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
  // Learn ends where it began: the MIDI button shows it learning (Learning, Learn or Lrn, whichever fits: issue 188),
  // and its panel offers Done in place of MIDI Learn.
  await expect(midiButton(page)).toHaveAttribute('data-learning', 'true');
  await expect(midiButton(page).locator('[data-form]:not([hidden])')).toHaveText(/^(Learning|Learn|Lrn)$/);
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
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', '3.56 kHz'); // ten semitones up from 2 kHz (issue 160)
  await expect(cutoff(page).locator('..')).toHaveAttribute('data-mapped', 'true');

  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toContainText(/Cutoff.*CC 74.*Relative/);
  await page.reload();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toContainText(/Cutoff.*CC 74/); // kept
});

test('a Mapping learned with the wrong mode is changed in the MIDI panel, and the knob then answers (issue 186)', async ({ page }) => {
  await startLearn(page);
  await cutoff(page).click();
  await play(page, cc(74, 1)); // one click of an encoder, read as a fader nudged off the bottom
  await expect(learnBar(page)).toContainText(/Cutoff.*CC 74/);
  await page.keyboard.press('Escape');
  await openMidi(page);
  const mode = midiPanel(page).getByRole('radiogroup', { name: 'Cutoff mode' });
  await expect(mode.getByRole('radio', { name: 'Absolute, with Pickup' })).toHaveAttribute('aria-checked', 'true');
  await play(page, ...times(10, cc(74, 1)));
  await frames(page); // the messages handled, and drawn, as they come
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', '2.00 kHz'); // Absolute at 1 of 127: Pickup waits
  await mode.getByRole('radio', { name: 'Relative' }).click();
  await expect(mode.getByRole('radio', { name: 'Relative' })).toHaveAttribute('aria-checked', 'true');
  await play(page, ...times(10, cc(74, 1)));
  await expect(cutoff(page)).toHaveAttribute('aria-valuetext', '3.56 kHz'); // ten semitones up from 2 kHz
  await page.reload();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('radiogroup', { name: 'Cutoff mode' }).getByRole('radio', { name: 'Relative' })).toHaveAttribute('aria-checked', 'true');
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
  await frames(page); // the messages handled, and drawn, as they come
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

test('an Action learns a toggle button as Toggle and a momentary one as Momentary, and each fires once a press (issue 147)', async ({ page }) => {
  const hold = page.getByRole('button', { name: 'Hold', exact: true });
  const patchName = page.getByRole('button', { name: /^Patch: / });
  const mappings = midiPanel(page).getByRole('list', { name: 'Mappings' });
  await startLearn(page);
  await hold.click();
  await play(page, cc(49, 127)); // a toggle: one message a press, nothing on letting go
  await expect(learnBar(page)).toContainText(/Hold.*CC 49/);
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await play(page, cc(50, 127), cc(50, 0)); // a momentary button: pressed, let go
  await expect(learnBar(page)).toContainText(/Next Preset.*CC 50/);
  await expect(hold).toHaveAttribute('aria-pressed', 'false'); // learning fired nothing
  await expect(patchName).toHaveAttribute('aria-label', 'Patch: Init');
  await page.keyboard.press('Escape');

  await openMidi(page);
  await expect(mappings).toContainText(/Hold.*CC 49 · Toggle/);
  await expect(mappings).toContainText(/Next Preset.*CC 50 · Momentary/);
  await play(page, cc(49, 0)); // the toggle's next press
  await expect(hold).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(2100); // past the time for tapping a Hold rhythm
  await play(page, cc(49, 127)); // and the one after
  await expect(hold).toHaveAttribute('aria-pressed', 'false');
  await play(page, cc(50, 127), cc(50, 0));
  await expect(patchName).toHaveAttribute('aria-label', 'Patch: Pure Sine'); // one step, not two
});

test('a toggle and a momentary button learned on LFO 1 Sync each flip it once a press (issue 223)', async ({ page }) => {
  const sync = page.getByRole('button', { name: 'LFO 1 Sync', exact: true });
  const mappings = midiPanel(page).getByRole('list', { name: 'Mappings' });
  await expect(sync).toHaveAttribute('aria-pressed', 'false');
  // A toggle: one message a press.
  await startLearn(page);
  await sync.click();
  await play(page, cc(51, 127));
  await expect(learnBar(page)).toContainText(/LFO 1 Sync.*CC 51/);
  await page.keyboard.press('Escape');
  await expect(sync).toHaveAttribute('aria-pressed', 'false'); // learning switched nothing
  await openMidi(page);
  await expect(mappings).toContainText(/LFO 1 Sync.*CC 51 · Toggle/);
  await play(page, cc(51, 0)); // the toggle's next press, its light going off
  await expect(sync).toHaveAttribute('aria-pressed', 'true');
  await play(page, cc(51, 127));
  await expect(sync).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');

  // A momentary button learned in its place: pressed, let go.
  await startLearn(page);
  await sync.click();
  await play(page, cc(52, 127), cc(52, 0));
  await expect(learnBar(page)).toContainText(/LFO 1 Sync.*CC 52/);
  await page.keyboard.press('Escape');
  await expect(sync).toHaveAttribute('aria-pressed', 'false');
  await openMidi(page);
  await expect(mappings).toContainText(/LFO 1 Sync.*CC 52 · Momentary/);
  await play(page, cc(52, 127));
  await expect(sync).toHaveAttribute('aria-pressed', 'true');
  await play(page, cc(52, 0)); // its release leaves it
  await play(page, cc(52, 127), cc(52, 0));
  await expect(sync).toHaveAttribute('aria-pressed', 'false');
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

test('a message redraws the Activity line alone: no other part of the page renders again (issues 217 and 238)', async ({ page }) => {
  // React tells a developer tool of each commit; this stand-in for one notes, for every component that rendered, the
  // first element it draws. Set before the page loads, then the page loaded again.
  await page.addInitScript(() => {
    const rendered: Element[] = [];
    const visit = (fiber: Fiber) => {
      const before = fiber.alternate;
      if (COMPONENTS.includes(fiber.tag) && (before === null || fiber.flags & PERFORMED_WORK)) {
        let host: Fiber | null = fiber;
        while (host && host.tag !== HOST) host = host.child;
        if (host) rendered.push(host.stateNode as Element);
      }
      if (before && fiber.child === before.child) return; // a subtree passed over, unchanged
      for (let child = fiber.child; child; child = child.sibling) visit(child);
    };
    type Fiber = { tag: number; flags: number; alternate: Fiber | null; child: Fiber | null; sibling: Fiber | null; stateNode: unknown };
    // React's own numbers: function, class, forwardRef, memo and simple memo components; an element; work performed.
    const COMPONENTS = [0, 1, 11, 14, 15];
    const HOST = 5;
    const PERFORMED_WORK = 1;
    Object.assign(window, {
      rendered,
      __REACT_DEVTOOLS_GLOBAL_HOOK__: {
        supportsFiber: true,
        renderers: new Map(),
        inject: () => 1,
        checkDCE: () => {},
        onCommitFiberRoot: (_: number, root: { current: Fiber }) => visit(root.current),
        onCommitFiberUnmount: () => {},
        onPostCommitFiberRoot: () => {},
      },
    });
  });
  await page.reload();
  await expect(midiButton(page)).toContainText('1');
  await openMidi(page);
  const monitor = midiPanel(page).getByRole('status', { name: 'MIDI activity' });
  await play(page, [0xd0, 127]); // the first press is heard once: the Timeline starts drawing what it moves
  await expect(monitor).toContainText('Aftertouch · 100 %');
  const outside = await page.evaluate(async () => {
    const rendered = (window as unknown as { rendered: Element[] }).rendered;
    await new Promise(requestAnimationFrame);
    rendered.length = 0;
    const midi = window as unknown as { playMidi(bytes: number[]): void };
    for (let value = 0; value < 50; value++) {
      midi.playMidi([0xd0, value]);
      await new Promise((r) => setTimeout(r, 0));
    }
    for (let i = 0; i < 2; i++) await new Promise(requestAnimationFrame);
    const line = document.querySelector('[role="status"][aria-label="MIDI activity"]');
    return { lines: rendered.filter((el) => el === line).length, others: rendered.filter((el) => el !== line).map((el) => el.outerHTML.slice(0, 80)) };
  });
  expect(outside.others).toEqual([]);
  expect(outside.lines).toBeGreaterThan(0);
  await expect(monitor).toContainText('Aftertouch · 39 %'); // the last, 49 of 127
});

test('a knob shows when hardware moves it, and while Pickup waits for the knob to reach it, until it does (issue 255)', async ({ page }) => {
  await startLearn(page);
  await cutoff(page).click();
  await play(page, cc(20, 10), cc(20, 11), cc(20, 12), cc(20, 13)); // an Absolute knob, far below Cutoff
  await page.keyboard.press('Escape');
  const knob = cutoff(page).locator('..');
  await play(page, cc(20, 14));
  await expect(knob).toHaveAttribute('data-pickup', 'up'); // its dashed ring
  await expect(cutoff(page)).toHaveAccessibleDescription(/^Pickup: turn your Controller’s knob up to this value to take it over\./);
  await page.waitForTimeout(600); // a time: past Learn's 500 ms settle, Pickup still waits
  await expect(knob).toHaveAttribute('data-pickup', 'up'); // still waiting, the knob still short of it
  await play(page, cc(20, 127)); // swept past the value: picked up
  await expect(knob).toHaveAttribute('data-midi', 'moved');
  await expect(knob).not.toHaveAttribute('data-pickup', /./);
  await expect(cutoff(page)).not.toHaveAccessibleDescription(/Pickup/);
  await expect(cutoff(page)).toHaveAttribute('aria-valuenow', '100');
  await expect(knob).not.toHaveAttribute('data-midi', /./, { timeout: 2000 }); // the flash fades
});

test('the tempo, while Pickup waits for its knob, says so in its description, as a knob does (issue 268)', async ({ page }) => {
  const bpm = page.getByRole('spinbutton', { name: 'Tempo' });
  await startLearn(page);
  await bpm.click();
  await play(page, cc(21, 10), cc(21, 11), cc(21, 12), cc(21, 13)); // an Absolute knob, far below 120 BPM
  await page.keyboard.press('Escape');
  await play(page, cc(21, 14));
  await expect(bpm).toHaveAttribute('data-pickup', 'up'); // its dashed ring
  await expect(bpm).toHaveAccessibleDescription(/^Pickup: turn your Controller’s knob up to this value to take it over\./);
  await play(page, cc(21, 127)); // swept past the value: picked up
  await expect(bpm).not.toHaveAttribute('data-pickup', /./);
  await expect(bpm).not.toHaveAccessibleDescription(/Pickup/);
  await expect(bpm).toHaveAttribute('aria-valuenow', '240');
});

test('a Mapping learned on the bend wheel comes back after a reload (issue 255)', async ({ page }) => {
  await startLearn(page);
  await cutoff(page).click();
  await play(page, ...[0, 32, 64, 96].map((msb) => [0xe0, 0, msb])); // the wheel pushed up from the bottom
  await expect(learnBar(page)).toContainText('Mapped Cutoff ← ch 1 · Pitch bend');
  await page.keyboard.press('Escape');
  await page.reload();
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' })).toContainText(/Cutoff.*ch 1 · Pitch bend/);
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
  await expect(midiButton(page)).toContainText('1'); // connected again: a message sent before is lost
  const tabs = page.getByRole('tablist', { name: 'Oscillator' });
  await expect(tabs.getByRole('tab', { name: 'Osc 1' })).toHaveAttribute('aria-selected', 'true');
  await play(page, cc(4, 1));
  await expect(tabs.getByRole('tab', { name: /Osc 2/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('group', { name: 'Osc 2' }).getByRole('slider', { name: 'Pulse Width' })).toBeVisible();
  await play(page, cc(9, 1)); // and back, for an Osc 1 knob
  await expect(tabs.getByRole('tab', { name: 'Osc 1' })).toHaveAttribute('aria-selected', 'true');
});

// Issue 201: a Relative knob's click steps a Mixer fader as a press does, in the unit it reads.
test('a Relative knob steps a Mixer fader by 1 % outside the Synth Geek Layer, by 0.5 dB inside it (issue 201)', async ({ page }) => {
  const mapping = { control: { kind: 'cc', channel: 1, number: 6 }, target: { kind: 'param', id: 'mixOsc1' }, mode: 'relative-twos' };
  await page.evaluate((m) => localStorage.setItem('limpide.mappings', JSON.stringify([m])), mapping);
  await page.reload();
  await expect(midiButton(page)).toContainText('1'); // connected again: a message sent before is lost
  await page.getByRole('tab', { name: 'Mixer' }).click();
  const osc1 = page.getByRole('slider', { name: 'Osc 1', exact: true });
  await play(page, cc(6, 127));
  await expect(osc1).toHaveAttribute('aria-valuetext', '99 %');
  await openDisplay(page);
  await page.getByRole('button', { name: 'Geek' }).click();
  await page.keyboard.press('Escape');
  await expect(osc1).toHaveAttribute('aria-valuetext', '99 %'); // the layer moves nothing
  await play(page, cc(6, 1));
  await expect(osc1).toHaveAttribute('aria-valuetext', '100 %'); // 0 dB, the half-dB Grid's next
  await play(page, cc(6, 127));
  await expect(osc1).toHaveAttribute('aria-valuetext', '94 %'); // −0.5 dB
});

test('each Action does its own job from its own pad: Next and Previous Preset, Freeze, Snapshot, Hold, Tap Tempo (none swapped; Tap Tempo since issue 255)', async ({ page }) => {
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
  await learn(() => page.getByRole('button', { name: 'Tap Tempo', exact: true }).click(), 41, /Tap Tempo/);
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
  // Tap Tempo's pad, twice about 0.4 s apart: the tempo follows the taps, timed on the page's clock (as below), and
  // nothing else moves.
  const bpm = page.getByRole('spinbutton', { name: 'Tempo' });
  const gap = await page.evaluate(async () => {
    const { playMidi } = window as unknown as { playMidi(bytes: number[]): void };
    const at: number[] = [];
    for (let i = 0; i < 2; i++) {
      at.push(performance.now());
      playMidi([0x99, 41, 100]);
      playMidi([0x89, 41, 0]);
      if (i === 0) await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return (at[1] - at[0]) / 1000;
  });
  await expect.poll(async () => Math.abs(Number(await bpm.getAttribute('aria-valuenow')) - 60 / gap), `${gap} s apart`).toBeLessThanOrEqual(1);
  await expect(patchName).toHaveAttribute('aria-label', 'Patch: Init');
  await expect(page.getByRole('button', { name: 'Hold' })).toHaveAttribute('aria-pressed', 'true');
});

test('the tempo learns a knob and Tap Tempo a pad; a knob on an LFO’s Rate turns its note value while Sync is on (issue 112)', async ({ page }) => {
  const bpm = page.getByRole('spinbutton', { name: 'Tempo' });
  const rate = page.getByRole('slider', { name: 'LFO 1 Rate' });
  await startLearn(page);
  await bpm.click();
  await expect(learnBar(page)).toContainText(/Tempo/);
  await play(page, ...times(4, cc(30, 1)));
  await expect(learnBar(page)).toContainText(/Tempo.*CC 30/);
  await page.getByRole('button', { name: 'Tap Tempo', exact: true }).click();
  await play(page, [0x99, 38, 100], [0x89, 38, 0]);
  await expect(learnBar(page)).toContainText(/Tap Tempo.*Note D2/);
  await rate.click();
  await play(page, ...times(4, cc(31, 1)));
  await expect(learnBar(page)).toContainText(/LFO 1 Rate.*CC 31/);
  await page.keyboard.press('Escape');

  await play(page, ...times(5, cc(30, 1))); // a BPM a click (issue 193)
  await expect(bpm).toHaveAttribute('aria-valuenow', '125');
  await page.getByRole('button', { name: 'LFO 1 Sync' }).click();
  await expect(rate).toHaveAttribute('aria-valuetext', /^1\/4, /);
  await play(page, ...times(2, cc(31, 1))); // a note value for every two clicks
  await expect(rate).toHaveAttribute('aria-valuetext', /^1\/8 D, /);
  await page.getByRole('button', { name: 'LFO 1 Sync' }).click();
  await expect(rate).toHaveAttribute('aria-valuetext', /Hz$/);
  // The pad mapped to Tap Tempo, twice about half a second apart: the tempo follows the taps as they came. The page's
  // clock times them as Tap Tempo does, since a busy machine wakes a 500 ms timer late (60 ms late is 107 BPM, issue
  // 177): the BPM is checked against the gap that was played, not the one asked for.
  const gap = await page.evaluate(async () => {
    const { playMidi } = window as unknown as { playMidi(bytes: number[]): void };
    const at: number[] = [];
    for (let i = 0; i < 2; i++) {
      at.push(performance.now());
      playMidi([0x99, 38, 100]);
      playMidi([0x89, 38, 0]);
      if (i === 0) await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return (at[1] - at[0]) / 1000;
  });
  // Polled, since the page may draw the new tempo a frame after the second tap.
  await expect.poll(async () => Math.abs(Number(await bpm.getAttribute('aria-valuenow')) - 60 / gap), `${gap} s apart`).toBeLessThanOrEqual(1);
});

// Issue 252: in Learn the page keeps room for the bar below its last control, as for a docked card, so LFO 2's Depth
// and Rate values (the lowest, under the bar's middle) and every other control scroll clear of it.
for (const width of [861, 1100, 1440]) {
  test(`in MIDI Learn at ${width} × 900, the page scrolls every value and control clear of the bar (issue 252)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await startLearn(page);
    // The room is the bar's measured height and its 16 px: there before the page is scrolled.
    await expect.poll(() => page.locator('main').evaluate((main) => parseFloat(getComputedStyle(main).marginBottom))).toBeGreaterThan(40);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const under = await page.evaluate(() => {
      const bar = document.querySelector('.learn-bar')!.getBoundingClientRect();
      return [...document.querySelectorAll('main .knob-value, main [data-learn]')]
        .filter((e) => {
          const box = e.getBoundingClientRect();
          return box.width > 0 && box.left < bar.right && box.right > bar.left && box.top < bar.bottom && box.bottom > bar.top;
        })
        .map((e) => e.closest('[aria-label]')?.getAttribute('aria-label') ?? e.textContent);
    });
    expect(under).toEqual([]);
  });
}
