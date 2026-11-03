/**
 * The shorter forms a label takes where its full one would run to a second line ("One line, shorter words" in the
 * design principles, issue 156): each name's forms on screen, longest first, the last at worst a few letters. The
 * name itself (CONTEXT.md's) stays the label's tooltip and its accessible name. A name not listed has one form: itself.
 * Which form shows is chosen by measuring the room it has (`useOneLine`), never by the layout's name.
 */
const FORMS: Record<string, readonly string[]> = {
  // The Envelopes are short on screen already (the owner, 2026-10-28), shorter still where the room runs out.
  'Filter Envelope': ['Filter Env', 'F Env', 'FE'],
  'Amp Envelope': ['Amp Env', 'A Env', 'AE'],
  // The LFO Destinations, in the Timeline's key and on their pickers.
  'Osc 2 Pitch': ['Osc 2 Pitch', 'O2 Pitch', 'O2P'],
  Detune: ['Detune', 'Det'],
  'Pulse Width': ['Pulse Width', 'PW'],
  Cutoff: ['Cutoff', 'Cut'],
  Resonance: ['Resonance', 'Res'],
  Volume: ['Volume', 'Vol'],
  // The MIDI button's word while MIDI Learn is on, in the MIDI word's room, so the button never widens (issue 188).
  Learning: ['Learning', 'Learn', 'Lrn'],
  // The Preset groups' names, in the Patches panel's narrow column (whole in the category pills above it).
  'Keys & Organs': ['Keys & Organs', 'Keys & Org', 'Keys'],
  'Plucks & Mallets': ['Plucks & Mallets', 'Plucks'],
  'Strings, Brass & Choir': ['Strings, Brass & Choir', 'Str & Brass', 'Strings'],
  'Movement & Effects': ['Movement & Effects', 'Move & FX', 'FX'],
};

/** How many steps of shortening a label can take: its longest form, then each shorter one. */
export const SHORTENING_STEPS = Math.max(...Object.values(FORMS).map((forms) => forms.length));

/** A name's forms on screen, longest first. */
export const screenForms = (name: string): readonly string[] => FORMS[name] ?? [name];

/** A name's form at a step of shortening, 0 its longest; past its shortest, its shortest. */
export const formAt = (name: string, step: number): string => {
  const forms = screenForms(name);
  return forms[Math.min(step, forms.length - 1)];
};
