import { nearestNote, noteToFrequency } from '../music/pitch';
import { PARAMS } from '../patch/patch';
import { ACTIONS, CHOICE_LABELS, type Control, type Mapping, type Target } from './mappings';
import type { MidiMessage } from './parser';

const noteName = (note: number) => nearestNote(noteToFrequency(note)).name;

/** "ch 1 · CC 74", "ch 10 · Note C2": from the most general to the most particular, as MIDI monitors do. */
export const describeControl = ({ kind, channel, number }: Control) =>
  `ch ${channel} · ${kind === 'cc' ? `CC ${number}` : `Note ${noteName(number)}`}`;

export const describeTarget = (target: Target) =>
  target.kind === 'param' ? PARAMS[target.id].label : target.kind === 'choice' ? CHOICE_LABELS[target.id] : ACTIONS[target.id];

export const describeMode = (mode: Mapping['mode']) =>
  mode === 'absolute' ? 'Absolute, with Pickup' : mode === 'trigger' ? 'Press' : 'Relative';

/** The Activity Monitor's line, channel first: "ch 2 · CC 7 · 100", "ch 1 · Note E4 · 120". */
export function describeMessage(message: MidiMessage): string {
  if (message.type === 'cc') return `ch ${message.channel} · CC ${message.controller} · ${message.value}`;
  const velocity = message.type === 'noteOn' ? ` · ${Math.round(message.velocity * 127)}` : ' · off';
  return `ch ${message.channel} · Note ${noteName(message.note)}${velocity}`;
}

/** Targets as one string, for the page's data attributes: "param:cutoff", "action:hold". */
export const targetKey = (target: Target) => `${target.kind}:${target.id}`;
