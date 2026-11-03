import { expect, test } from '@playwright/test';
import { midiButton, midiPanel, openMidi, withFakeController } from './fakeMidi';
import { openDisplay } from './helpers';
import { FIRST_VISIT } from './startState';

// Issue 51: a sound made and changed without the mouse, and every control named for a screen reader.

const patchName = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^Patch: / });

test('a radio group is one Tab stop, and the arrows move its choice', async ({ page }) => {
  await page.goto('/');
  const waveform = page.getByRole('radiogroup', { name: 'Osc 1 Waveform' });
  const saw = waveform.getByRole('radio', { name: 'Saw' });
  await expect(saw).toHaveAttribute('aria-checked', 'true');
  await expect(waveform.locator('[role="radio"][tabindex="0"]')).toHaveCount(1); // the chosen one only
  await saw.focus();
  await page.keyboard.press('ArrowRight');
  const next = waveform.locator('[role="radio"][aria-checked="true"]');
  await expect(next).not.toHaveAccessibleName('Saw');
  await expect(next).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(saw).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('End');
  await expect(waveform.getByRole('radio').last()).toHaveAttribute('aria-checked', 'true');
});

test('Home, End, Page Up and Page Down on a knob', async ({ page }) => {
  await page.goto('/');
  const resonance = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Resonance' });
  await resonance.focus();
  await page.keyboard.press('End');
  await expect(resonance).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('Home');
  await expect(resonance).toHaveAttribute('aria-valuenow', '0');
  await page.keyboard.press('PageUp');
  await expect(resonance).toHaveAttribute('aria-valuenow', '10');
  await page.keyboard.press('PageDown');
  await expect(resonance).toHaveAttribute('aria-valuenow', '0');
});

// Issue 160: a press is a step in the control's own unit, landing on round values: a semitone, a time step, 1 %, 0.5 dB
// (a Mixer fader's in the Synth Geek Layer, issue 201).
test('the arrows step each knob and fader in its own unit, Shift finer and Page coarser (issue 160)', async ({ page }) => {
  await page.goto('/');
  const cutoff = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' });
  await expect(cutoff).toHaveAttribute('aria-valuetext', '2.00 kHz');
  await cutoff.press('ArrowUp');
  await expect(cutoff).toHaveAttribute('aria-valuetext', '2.12 kHz'); // a semitone
  await cutoff.press('ArrowDown');
  await cutoff.press('Shift+ArrowUp');
  await expect(cutoff).toHaveAttribute('aria-valuetext', '2.01 kHz'); // 10 cents
  await cutoff.press('Shift+ArrowDown');
  await cutoff.press('PageUp');
  await expect(cutoff).toHaveAttribute('aria-valuetext', '4.00 kHz'); // an octave

  const attack = page.getByRole('slider', { name: 'Amp Attack', exact: true });
  await expect(attack).toHaveAttribute('aria-valuetext', '10.0 ms');
  for (const ms of ['11.0', '12.0', '14.0']) {
    await attack.press('ArrowUp');
    await expect(attack).toHaveAttribute('aria-valuetext', `${ms} ms`);
  }
  for (let i = 0; i < 3; i++) await attack.press('ArrowDown');
  await attack.press('PageUp');
  await expect(attack).toHaveAttribute('aria-valuetext', '20.0 ms'); // double

  const sustain = page.getByRole('slider', { name: 'Amp Sustain', exact: true });
  await sustain.press('ArrowUp');
  await expect(sustain).toHaveAttribute('aria-valuetext', '71 %');
  await sustain.press('ArrowDown');
  await sustain.press('PageUp');
  await expect(sustain).toHaveAttribute('aria-valuetext', '80 %');
});

test('in the Synth Geek Layer the Mixer’s faders step by dB, to −∞ below the lowest step (issue 160)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Mixer' }).click();
  const readout = (name: string) =>
    page.locator('.knob', { has: page.getByRole('slider', { name, exact: true }) }).locator('.knob-value > span').first();
  await expect(readout('Osc 1')).toHaveText('0.0 dB');
  await page.getByRole('slider', { name: 'Osc 1', exact: true }).press('ArrowDown');
  await expect(readout('Osc 1')).toHaveText('−0.5 dB');
  await page.getByRole('slider', { name: 'Osc 1', exact: true }).press('PageDown');
  await expect(readout('Osc 1')).toHaveText('−6.0 dB');
  const osc2 = page.getByRole('slider', { name: 'Osc 2', exact: true });
  await expect(readout('Osc 2')).toHaveText('−∞ dB');
  await osc2.press('ArrowUp');
  await expect(readout('Osc 2')).toHaveText('−40.0 dB'); // the lowest step
  await osc2.press('ArrowUp');
  await expect(readout('Osc 2')).toHaveText('−39.5 dB');
  await osc2.press('ArrowDown');
  await osc2.press('ArrowDown');
  await expect(readout('Osc 2')).toHaveText('−∞ dB');
});

// Issue 201: outside the Synth Geek Layer a Mixer fader reads % and steps by it; switching the layer moves nothing.
test('the Mixer’s faders step in the unit they read: % outside the Synth Geek Layer, dB inside it (issue 201)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Mixer' }).click();
  const fader = (name: string) => page.getByRole('slider', { name, exact: true });
  const readout = (name: string) => page.locator('.knob', { has: fader(name) }).locator('.knob-value > span').first();
  const osc1 = fader('Osc 1');
  await expect(osc1).toHaveAttribute('aria-valuetext', '100 %');
  await osc1.press('ArrowDown');
  await expect(osc1).toHaveAttribute('aria-valuetext', '99 %');
  await expect(osc1).toHaveAttribute('aria-valuenow', '99'); // the fader, and the sound, at 99 %
  await osc1.press('PageDown');
  await expect(osc1).toHaveAttribute('aria-valuetext', '90 %'); // a round 10 %
  // A wheel's notch steps as a press does.
  await osc1.evaluate((dial) => dial.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true })));
  await expect(osc1).toHaveAttribute('aria-valuetext', '91 %');
  const ring = fader('Ring');
  await ring.press('ArrowUp');
  await expect(ring).toHaveAttribute('aria-valuetext', '1 %');

  // The layer switched on: the readout turns to dB, the fader and the sound stay where they were.
  await openDisplay(page);
  await page.getByRole('button', { name: 'Geek' }).click();
  await page.keyboard.press('Escape');
  await expect(readout('Osc 1')).toHaveText('−0.8 dB'); // 91 %
  await expect(osc1).toHaveAttribute('aria-valuetext', '91 %');
  await expect(osc1).toHaveAttribute('aria-valuenow', '91');
  // The next press lands on the half-dB Grid; Ring still steps by the percent.
  await osc1.press('ArrowUp');
  await expect(readout('Osc 1')).toHaveText('−0.5 dB');
  await osc1.evaluate((dial) => dial.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true })));
  await expect(readout('Osc 1')).toHaveText('−1.0 dB'); // a wheel's notch as a press
  await osc1.press('ArrowUp');
  await ring.press('ArrowUp');
  await expect(ring).toHaveAttribute('aria-valuetext', '2 %');

  // Off again: the readout back in %, nothing moved, and the next press a whole percent.
  await openDisplay(page);
  await page.getByRole('button', { name: 'Geek' }).click();
  await page.keyboard.press('Escape');
  await expect(readout('Osc 1')).toHaveText('94 %'); // −0.5 dB is 94.4 %
  await osc1.press('ArrowUp');
  await expect(osc1).toHaveAttribute('aria-valuetext', '95 %');
});

test('closing a panel puts the focus back on the button that opened it', async ({ page }) => {
  await page.goto('/');
  await patchName(page).click();
  await page.keyboard.press('Escape');
  await expect(patchName(page)).toBeFocused();
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Pure Sine' }).click();
  await expect(patchName(page)).toBeFocused(); // a Preset loaded
  await openDisplay(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Display' })).toBeFocused();
});

test('Import file is a button the keyboard reaches', async ({ page }) => {
  await page.goto('/');
  await patchName(page).click();
  const importButton = page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Import file' });
  await importButton.focus();
  await expect(importButton).toBeFocused();
});

test('the new Preset is announced after Next Preset, and with its about line when picked in the panel (issues 109, 153)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Next Preset' }).click();
  await expect(page.locator('.patch-bar [role="status"]')).toHaveText('Pure Sine');
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Init', exact: true }).click();
  await expect(page.locator('.patch-bar [role="status"]')).toHaveText(/^Init\. The plain starting point/);
});

test('the × of a Preset’s description is next after Next Preset for the keyboard (issue 153)', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Safari tabs to buttons only when its settings ask it to');
  await page.goto('/');
  await patchName(page).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Init', exact: true }).click();
  await page.keyboard.press('Tab'); // from the name, back under the focus after the pick, to Next Preset
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close the Preset’s description' })).toBeFocused();
});

test('sliders that share a label have distinct names: the Envelopes’ stages, the LFOs’ Rate and Depth', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Filter Attack', 'Amp Attack', 'Filter Release', 'Amp Release', 'LFO 1 Rate', 'LFO 2 Rate', 'LFO 1 Depth', 'LFO 2 Depth', 'Osc 1 Octave']) {
    await expect(page.getByRole('slider', { name, exact: true }), name).toHaveCount(1);
  }
  // Each Oscillator's Octave is on its own tab (issue 90).
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  await expect(page.getByRole('slider', { name: 'Osc 2 Octave', exact: true })).toHaveCount(1);
});

test('the Viewers are images with names, the LFO plots say what they show', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Oscillator Scope', 'Filter Spectrum', 'Amp Scope', 'Envelope Timeline']) {
    await expect(page.getByRole('img', { name, exact: true }), name).toHaveCount(1);
  }
  await expect(page.getByRole('img', { name: /^LFO 1: Sine, 2\.00 Hz, Depth 0 %, on Cutoff$/ })).toHaveCount(1);
});

test('the Timeline key’s entries are reached by Tab, named, and described, their tooltip shown on focus (issue 67)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('slider', { name: 'Filter Envelope Amount' }).press('ArrowUp'); // its key entry shows only then
  const names = ['Cutoff', 'Filter Envelope', 'Amp Envelope']; // the key's order (issue 63)
  for (const name of names) {
    const entry = page.locator('.timeline-key').getByRole('img', { name, exact: true });
    await expect(entry, name).toHaveAttribute('tabindex', '0');
    await expect(entry, name).toHaveAccessibleDescription(/(\w+\W+){6,}/);
  }
  // By Tab from the section's heading tip: each entry in turn, its tooltip shown.
  await page.locator('.timeline-key').getByRole('img', { name: names[0] }).focus();
  await page.keyboard.press('Shift+Tab');
  for (const name of names) {
    await page.keyboard.press('Tab');
    await expect(page.locator('.timeline-key').getByRole('img', { name, exact: true })).toBeFocused();
    await expect(page.getByRole('tooltip').locator('visible=true').locator('strong')).toHaveText(name);
  }
});

test('the letter keys can be turned off in Display, and stay off', async ({ page }) => {
  await page.goto('/');
  const piano = page.getByRole('group', { name: 'Piano' });
  await openDisplay(page);
  await page.getByRole('radio', { name: 'Letter keys off' }).click();
  await page.keyboard.press('Escape');
  await page.keyboard.down('a');
  await page.waitForTimeout(200);
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.up('a');
  await page.reload();
  await page.keyboard.down('a');
  await page.waitForTimeout(200);
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.up('a');
  await openDisplay(page);
  await page.getByRole('radio', { name: 'Letter keys play Notes' }).click();
  await page.keyboard.press('Escape');
  await page.keyboard.down('a');
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(1);
  await page.keyboard.up('a');
});

test.describe('a first visit', () => {
  test.use({ storageState: FIRST_VISIT });
  test('closing the welcome puts the focus on the Demo button, not the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('dialog', { name: 'Limpide' }).getByRole('button', { name: 'Close About' }).click();
    await expect(page.getByRole('button', { name: 'Demo', exact: true })).toBeFocused();
  });
});

test('a greyed-out control tells a screen reader why it does nothing now, and stops saying so once it acts (issue 104)', async ({ page }) => {
  await page.goto('/');
  const why = /^No effect/;
  // Pulse Width on a Saw: still described by its tooltip, the reason first.
  const width = page.getByRole('group', { name: 'Osc 1' }).getByRole('slider', { name: 'Pulse Width' });
  await expect(width).toHaveAccessibleDescription(/^No effect unless Osc 1's Waveform is Pulse\. Pulse Width/);
  await page.getByRole('radiogroup', { name: 'Osc 1 Waveform' }).getByRole('radio', { name: 'Pulse' }).click();
  await expect(width).not.toHaveAccessibleDescription(why);
  await expect(width).toHaveAccessibleDescription(/^Pulse Width/);

  // The Filter Envelope at Amount 0.
  const attack = page.getByRole('slider', { name: 'Filter Attack', exact: true });
  await expect(attack).toHaveAccessibleDescription(/^No effect while the Filter Envelope Amount and Osc 2's Env Amount are 0\./);
  await page.getByRole('slider', { name: 'Filter Envelope Amount' }).press('ArrowUp');
  await expect(attack).not.toHaveAccessibleDescription(why);

  // An LFO's Rate at Depth 0.
  const rate = page.getByRole('slider', { name: 'LFO 1 Rate', exact: true });
  await expect(rate).toHaveAccessibleDescription(/^No effect while LFO 1's Depth is 0\./);
  await page.getByRole('slider', { name: 'LFO 1 Depth', exact: true }).press('ArrowUp');
  await expect(rate).not.toHaveAccessibleDescription(why);

  // Glide with more than one Voice.
  const glide = page.getByRole('slider', { name: 'Glide', exact: true });
  await expect(glide).not.toHaveAccessibleDescription(why);
  await page.getByRole('radiogroup', { name: 'Voices' }).getByRole('radio', { name: '4' }).click();
  await expect(glide).toHaveAccessibleDescription(/^No effect with more than one Voice\./);

  // A silent Osc 2's Waveform and tuning, which wake up once it is mixed in.
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  const detune = page.getByRole('slider', { name: 'Osc 2 Detune', exact: true });
  await expect(detune).toHaveAccessibleDescription(/^No effect while Osc 2 is silent\./);
  await expect(page.getByRole('radiogroup', { name: 'Osc 2 Waveform' })).toHaveAccessibleDescription(/^No effect while Osc 2 is silent\./);
  // The Sub's choices, without a tooltip of their own, say it too.
  await page.getByRole('tab', { name: /Sub & Noise/ }).click();
  await expect(page.getByRole('radiogroup', { name: 'Sub Octave' })).toHaveAccessibleDescription('No effect while the Sub is silent.');
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await page.getByRole('slider', { name: 'Osc 2', exact: true }).press('ArrowUp');
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  await expect(detune).not.toHaveAccessibleDescription(why);
  await expect(page.getByRole('radiogroup', { name: 'Osc 2 Waveform' })).not.toHaveAccessibleDescription(why);
});

// Issue 189 (review 6): whatever closes gives the focus back to what opened it, never to the page.
test.describe('closing gives the focus back to what opened it (issue 189)', () => {
  test('Escape from inside the MIDI panel', async ({ page }) => {
    await withFakeController(page);
    await openMidi(page);
    await midiPanel(page).getByRole('combobox', { name: 'Aftertouch' }).focus();
    await page.keyboard.press('Escape');
    await expect(midiPanel(page)).toBeHidden();
    await expect(midiButton(page)).toBeFocused();
  });

  test('Quit on a Tutorial’s card, to the Tutorial button', async ({ page }) => {
    await page.goto('/');
    const tutorialButton = page.getByRole('button', { name: 'Tutorial', exact: true });
    await tutorialButton.click();
    await page.getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: /^Tutorial: Bass/ }).click();
    const card = page.getByRole('region', { name: /^Tutorial: / });
    await expect(card.getByRole('button', { name: 'Start' })).toBeFocused();
    await card.getByRole('button', { name: 'Quit the tutorial' }).press('Enter');
    await expect(card).toBeHidden();
    await expect(tutorialButton).toBeFocused();
  });

  test('Close on the Tour’s card, to About’s button', async ({ page }) => {
    await page.goto('/');
    const about = page.getByRole('button', { name: 'About', exact: true });
    await about.click();
    await page.getByRole('button', { name: 'Take the Tour' }).click();
    const card = page.getByRole('region', { name: 'Tour' });
    await expect(card.getByRole('button', { name: 'Next' })).toBeFocused();
    await card.getByRole('button', { name: 'Close the Tour' }).press('Enter');
    await expect(card).toBeHidden();
    await expect(about).toBeFocused();
  });

  test('Done on the Tour’s last card, to About’s button', async ({ page }) => {
    await page.goto('/');
    const about = page.getByRole('button', { name: 'About', exact: true });
    await about.click();
    await page.getByRole('button', { name: 'Take the Tour' }).click();
    const card = page.getByRole('region', { name: 'Tour' });
    while (await card.getByRole('button', { name: 'Next' }).isVisible()) await card.getByRole('button', { name: 'Next' }).press('Enter');
    await card.getByRole('button', { name: 'Done' }).press('Enter');
    await expect(card).toBeHidden();
    await expect(about).toBeFocused();
  });

  test('Escape on the Demo’s parts, to the Demo button', async ({ page }) => {
    await page.goto('/');
    const demo = page.getByRole('button', { name: 'Demo', exact: true });
    await demo.focus();
    await page.keyboard.press('Enter');
    const bar = page.getByRole('region', { name: 'Demo', exact: true });
    await bar.getByRole('button', { name: /^Play from part 1,/ }).focus();
    await page.keyboard.press('Escape');
    await expect(demo).toHaveAttribute('aria-pressed', 'false');
    await expect(demo).toBeFocused();
  });

  test('Enter after typing a BPM, to the BPM', async ({ page }) => {
    await page.goto('/');
    const bpm = page.getByRole('spinbutton', { name: 'Tempo' });
    await bpm.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.type('96');
    await page.keyboard.press('Enter');
    await expect(bpm).toHaveAttribute('aria-valuenow', '96');
    await expect(bpm).toBeFocused();
  });
});

test('a header panel closes once the focus leaves it (issue 189)', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('region', { name: 'Viewer controls' }).getByRole('button').first().focus();
  await patchName(page).focus();
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(patchName(page)).toBeFocused(); // Escape later no longer pulls the focus back to Display
});

// Walking the page backwards, each stop is checked clear of the sticky header (and the phone's strip), which slides
// back in as the page scrolls up: a phone, and a laptop's window at 200 % zoom (720 × 450 CSS px).
for (const [where, viewport] of [
  ['a phone', { width: 393, height: 852 }],
  ['200 % zoom', { width: 720, height: 450 }],
] as const) {
  test.describe(`Shift+Tab on ${where} (issue 189)`, () => {
    test.use({ viewport, reducedMotion: 'reduce' });
    test('never leaves the focus under the header', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'Safari tabs to buttons only when its settings ask it to');
      await page.goto('/');
      await page.getByRole('button', { name: 'LFO 2 Sync' }).focus();
      const covered: string[] = [];
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press('Shift+Tab');
        const stop = await page.evaluate(async () => {
          const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
          await frame();
          await frame();
          await frame();
          const focused = document.activeElement as HTMLElement;
          if (focused.closest('header, .section-strip')) return null;
          const box = focused.getBoundingClientRect();
          const at = document.elementFromPoint(box.left + box.width / 2, box.top + Math.min(box.height / 2, 8));
          const name = focused.getAttribute('aria-label') ?? focused.textContent?.trim() ?? focused.tagName;
          return { name, under: !!at?.closest('header, .section-strip') };
        });
        if (!stop) break;
        if (stop.under) covered.push(stop.name);
      }
      expect(covered).toEqual([]);
    });
  });
}

test('a Tutorial’s card goes to its Step’s control, and Escape there comes back to the card (issue 189)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
  await page.getByRole('group', { name: 'Tutorials' }).getByRole('button', { name: /^Tutorial: Bass/ }).click();
  const card = page.getByRole('region', { name: /^Tutorial: / });
  await card.getByRole('button', { name: 'Start' }).click();
  await card.getByRole('button', { name: 'Go to the control' }).click();
  const ringed = page.locator('[data-tutorial]:not(.section-strip button)');
  await expect.poll(() => ringed.evaluate((e) => e.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Escape');
  await expect(card.getByRole('button', { name: 'Next' })).toBeFocused();
});

test('Tap’s tempo is announced (issue 189)', async ({ page }) => {
  await page.goto('/');
  const tap = page.getByRole('button', { name: 'Tap', exact: true });
  await tap.focus();
  await tap.evaluate(async (button) => {
    for (let i = 0; i < 4; i++) {
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }));
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  });
  const bpm = await page.getByRole('spinbutton', { name: 'Tempo' }).getAttribute('aria-valuenow');
  expect(bpm).not.toBe('120');
  await expect(page.getByRole('status').filter({ hasText: /BPM/ })).toHaveText(`Tempo ${bpm} BPM`);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 } });
  test('the tempo button’s name holds the BPM it shows (issue 189)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByRole('button', { name: /^Tempo/ })).toHaveAccessibleName('Tempo: 120 BPM');
  });
});

test('with the Synth Geek Layer on, a knob’s readout is part of its description (issue 189)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.goto('/');
  const resonance = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Resonance' });
  await expect(resonance).toHaveAccessibleDescription(/Q \d+\.\d\d/);
});
