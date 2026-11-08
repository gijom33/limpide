import { expect, type Page, test } from '@playwright/test';
import { cc, midiPanel, openMidi, play, playOn, times, withFakeController } from './fakeMidi';
import { frames } from './helpers';

// MIDI Learn beside the C16 layout, and a C16 left in its factory settings (issue 255).

const C16 = 'Synido TempoPAD C16';
const KEYS = 'Arturia KeyStep 37';
const learnBar = (page: Page) => page.getByRole('status', { name: 'MIDI Learn' });
const slider = (page: Page, name: string) => page.getByRole('slider', { name, exact: true });
const positionOf = (page: Page, name: string) => slider(page, name).getAttribute('aria-valuenow');

test('Learn says which C16 place it took, and a C16 knob it took turns nothing the wrong way after (issue 255)', async ({ page }) => {
  await withFakeController(page, [C16, KEYS]); // the C16's layout comes in by itself
  await openMidi(page);
  await midiPanel(page).getByRole('button', { name: 'MIDI Learn' }).click();

  // The keyboard's mod wheel (CC 1, bank A's K1 on the C16) learned for the Cutoff (bank B's K1).
  await slider(page, 'Cutoff').click();
  await playOn(page, KEYS, cc(1, 10), cc(1, 11), cc(1, 12), cc(1, 13));
  await expect(learnBar(page)).toContainText(
    'Mapped Cutoff ← ch 1 · CC 1; bank A’s K1 no longer turns Osc 1 Octave; bank B’s K1 no longer turns Cutoff',
  );
  // The keyboard's knob on channel 2, which the C16 does not share, learned for the Resonance (bank B's K2).
  await slider(page, 'Resonance').click();
  await playOn(page, KEYS, ...[20, 21, 22, 23].map((v) => cc(74, v, 2)));
  await expect(learnBar(page)).toContainText('Mapped Resonance ← ch 2 · CC 74; bank B’s K2 no longer turns Resonance');
  // A pad learned for Hold, which M4 fires on every bank.
  await page.getByRole('button', { name: 'Hold', exact: true }).click();
  await playOn(page, KEYS, [0x99, 36, 100], [0x89, 36, 0]);
  await expect(learnBar(page)).toContainText('Mapped Hold ← ch 10 · Note C2; every bank’s M4 no longer fires Hold');
  await page.keyboard.press('Escape');
  await expect(learnBar(page)).toBeHidden();

  // The C16's knobs it took, turned up, move nothing: neither their old target nor the new one, backwards or not. Its
  // K1's CC is the mod wheel's, so the C16's values, swept end to end, would catch the Cutoff were it not kept out.
  const positions = async () => ({
    cutoff: await positionOf(page, 'Cutoff'),
    resonance: await positionOf(page, 'Resonance'),
    octave: await positionOf(page, 'Osc 1 Octave'),
    depth: await positionOf(page, 'LFO 1 Depth'), // what an unmapped CC 1, the mod wheel's, turns
  });
  const before = await positions();
  await playOn(page, C16, ...times(3, cc(1, 65)), cc(1, 0), cc(1, 127), ...times(3, cc(9, 65)), ...times(3, cc(10, 65)), ...times(2, cc(58, 127)));
  await frames(page); // the messages handled, and drawn, as they come
  expect(await positions()).toEqual(before);
  await expect(page.getByRole('button', { name: 'Hold', exact: true })).toHaveAttribute('aria-pressed', 'false');

  // The keyboard's mod wheel drives the Cutoff, swept past it (Pickup).
  await playOn(page, KEYS, cc(1, 0), cc(1, 127));
  await expect(slider(page, 'Cutoff')).toHaveAttribute('aria-valuenow', '100');
  await openMidi(page);
  await expect(midiPanel(page).getByRole('list', { name: 'Mappings' }).getByRole('listitem').filter({ hasText: /^Cutoff/ })).toContainText(
    'ch 1 · CC 1 · not the C16',
  );
});

test('a C16 whose knobs send positions is told, in the MIDI panel, to set them to Relative #1 (issue 255)', async ({ page }) => {
  await withFakeController(page, C16);
  const notice = 'The C16’s knobs are sending positions, so a knob below its middle only turns a control down, and above it only up: in the C16’s companion editor, set every knob to Relative #1.';
  await play(page, cc(9, 65), cc(9, 63)); // Relative #1, as the card says
  await openMidi(page);
  await expect(midiPanel(page)).not.toContainText(notice);
  await play(page, ...[40, 41, 42, 43, 44].map((v) => cc(9, v))); // bank B's K1 in its factory settings
  await expect(midiPanel(page)).toContainText(notice);
});
