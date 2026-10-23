import { nearestNote, noteToFrequency } from '../music/pitch';
import { PARAMS } from '../patch/patch';
import { ACTIONS, CHOICE_LABELS, type Control, type Mapping, type Target } from './mappings';
import type { MidiMessage } from './parser';

const noteName = (note: number) => nearestNote(noteToFrequency(note)).name;

/** "CC 74 · ch 1", "Note C2 · ch 10". */
export const describeControl = ({ kind, channel, number }: Control) =>
  `${kind === 'cc' ? `CC ${number}` : `Note ${noteName(number)}`} · ch ${channel}`;

export const describeTarget = (target: Target) =>
  target.kind === 'param' ? PARAMS[target.id].label : target.kind === 'choice' ? CHOICE_LABELS[target.id] : ACTIONS[target.id];

export const describeMode = (mode: Mapping['mode']) =>
  mode === 'absolute' ? 'Absolute, with Pickup' : mode === 'trigger' ? 'Press' : 'Relative';

/** The Activity Monitor's line: "CC 7 · 100 · ch 2", "Note E4 · 120 · ch 1". */
export function describeMessage(message: MidiMessage): string {
  if (message.type === 'cc') return `CC ${message.controller} · ${message.value} · ch ${message.channel}`;
  const velocity = message.type === 'noteOn' ? ` · ${Math.round(message.velocity * 127)}` : ' · off';
  return `Note ${noteName(message.note)}${velocity} · ch ${message.channel}`;
}

/** Targets as one string, for the page's data attributes: "param:cutoff", "action:hold". */
export const targetKey = (target: Target) => `${target.kind}:${target.id}`;
