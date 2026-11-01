import { expect, test } from '@playwright/test';
import { c16Layout, sharedButtons } from '../src/midi/c16';
import { C16_CARD_MARGIN, pdfPages } from '../src/ui/c16CardPdf';
import { midiPanel, openMidi, withFakeController } from './fakeMidi';

// The C16 card (issue 145): the layout on one page to print and keep beside the C16, built from the layout's data.

test('shows every place of the C16 layout, bank by bank, each button marked Momentary or Toggle (issue 145)', async ({ page }) => {
  await page.goto('/#c16-card');
  const banks = page.getByRole('region', { name: /^Bank [A-D]: / });
  await expect(banks).toHaveCount(4);
  await expect(banks.first()).toHaveAccessibleName('Bank A: Oscillators');
  // 24 places a bank, four strips of six: 2 knobs, a fader, 3 buttons; those the layout drives are named, the others free.
  const places = page.getByRole('listitem');
  await expect(places).toHaveCount(4 * 24);
  await expect(places.filter({ hasNotText: /free$/ })).toHaveCount(new Set(c16Layout().map((m) => m.control.number)).size);
  await expect(places.filter({ hasText: /Momentary|Toggle/ })).toHaveCount(4 * 12);
  const nextOnB = page.getByRole('region', { name: 'Bank B: Filter' }).getByRole('listitem').filter({ hasText: 'M2' });
  await expect(nextOnB).toContainText('Next Preset');
  await expect(nextOnB).toContainText('CC 64');
  await expect(nextOnB).toContainText('Momentary');
  // Legato under Glide on bank C's R2, a toggle (issue 119).
  const legato = page.getByRole('region', { name: 'Bank C: Amp' }).getByRole('listitem').filter({ hasText: /^R2 / });
  await expect(legato).toContainText('Legato');
  await expect(legato).toContainText('Toggle');
  // Each LFO's Sync beside its Retrigger on bank D's R row, toggles (issue 112).
  const bankD = page.getByRole('region', { name: 'Bank D: LFO & Envelopes' }).getByRole('listitem');
  for (const [place, what] of [['R1', 'LFO 1 Retrigger'], ['R2', 'LFO 1 Sync'], ['R3', 'LFO 2 Retrigger'], ['R4', 'LFO 2 Sync']]) {
    const cell = bankD.filter({ hasText: new RegExp(`^${place} `) });
    await expect(cell, place).toContainText(what);
    await expect(cell, place).toContainText('Toggle');
  }
  // Its foot lists the buttons the layout has the same on every bank (issue 148).
  const shared = sharedButtons().map((s) => `${s.name} ${s.place.label}`).join(', ');
  await expect(page.locator('.c16-card-foot')).toContainText(`On every bank: ${shared}. Free places stay Toggle,`);
});

test('prints on one landscape page, A4 or Letter (issue 145)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Only Chromium prints to PDF');
  await page.goto('/#c16-card');
  await expect(page.getByRole('region', { name: /^Bank [A-D]: / })).toHaveCount(4);
  for (const format of ['A4', 'Letter']) {
    const pdf = await page.pdf({ format, landscape: true, printBackground: true, margin: C16_CARD_MARGIN });
    expect(pdfPages(pdf), format).toBe(1);
  }
});

test('is offered in the MIDI panel while a C16 is connected, in a new tab (issue 145)', async ({ page }) => {
  await withFakeController(page, 'Synido TempoPAD C16');
  await openMidi(page);
  const link = midiPanel(page).getByRole('link', { name: 'Print C16 card' });
  await expect(link).toHaveAttribute('href', '#c16-card');
  await expect(link).toHaveAttribute('target', '_blank');
});
