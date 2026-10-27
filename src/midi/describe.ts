import { nearestNote, noteToFrequency } from '../music/pitch';
import { PARAMS, paramName } from '../patch/patch';
import { PITCH_BEND } from './controlSurface';
import { ACTIONS, CHOICE_LABELS, type Control, type Mapping, type Target } from './mappings';
import type { MidiMessage } from './parser';

const noteName = (note: number) => nearestNote(noteToFrequency(note)).name;

/** "ch 1 · CC 74", "ch 10 · Note C2": from the most general to the most particular, as MIDI monitors do. */
export const describeControl = ({ kind, channel, number }: Control) =>
  `ch ${channel} · ${kind === 'note' ? `Note ${noteName(number)}` : number === PITCH_BEND ? 'Pitch bend' : `CC ${number}`}`;

/** A target by its short name, where a group beside it already says where it is (Quick Setup's "Osc 2 · Detune"). */
export const describeTargetShort = (target: Target) => (target.kind === 'param' ? PARAMS[target.id].label : describeTarget(target));

export const describeTarget = (target: Target) =>
  // A Parameter by its full name ("Filter Envelope Amount", "LFO 2 Depth"), so a Mapping never leaves it unclear (issue 52).
  target.kind === 'param' ? paramName(target.id) : target.kind === 'choice' ? CHOICE_LABELS[target.id] : ACTIONS[target.id];

const MODE_LABELS: Record<Mapping['mode'], string> = {
  absolute: 'Absolute, with Pickup',
  'relative-twos': 'Relative',
  'relative-centred': 'Relative',
  detect: 'Turn it once to set it up',
  trigger: 'Press',
  toggle: 'Press',
};
export const describeMode = (mode: Mapping['mode']) => MODE_LABELS[mode];

/** The Activity Monitor's line, channel first: "ch 2 · CC 7 · 100", "ch 1 · Note E4 · 120". */
export function describeMessage(message: MidiMessage): string {
  if (message.type === 'cc') return `ch ${message.channel} · CC ${message.controller} · ${message.value}`;
  if (message.type === 'pitchBend') return `ch ${message.channel} · Pitch bend · ${message.value > 0 ? '+' : ''}${Math.round(message.value * 100)} %`;
  if (message.type === 'program') return `ch ${message.channel} · Program ${message.program + 1}`;
  const velocity = message.type === 'noteOn' ? ` · ${Math.round(message.velocity * 127)}` : ' · off';
  return `ch ${message.channel} · Note ${noteName(message.note)}${velocity}`;
}

/** Targets as one string, for the page's data attributes: "param:cutoff", "action:hold". */
export const targetKey = (target: Target) => `${target.kind}:${target.id}`;
