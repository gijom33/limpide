import type { KeyValueStorage } from '../app/storage';
import { C16 } from './c16';
import type { Control, ControllerId, Mapping } from './mappings';

/**
 * What Limpide knows of one known Controller, a Controller with a built-in layout: the TempoPAD C16's is in
 * `c16.ts`. The rest of the MIDI code asks this module, never the Controller itself (issue 149).
 */
export interface KnownController {
  id: ControllerId;
  /** Its short name, as the MIDI panel gives it: "C16 layout", "Print C16 card", "C16 only". */
  label: string;
  /** Whether a connected input is one, by the name it gives. */
  named(name: string): boolean;
  /** Its built-in layout, every Mapping tagged with its id, so it answers this Controller alone. */
  layout(): Mapping[];
  /** Where it is recorded that its layout came in once, and what is recorded once today's layout is in place. */
  applied: { key: string; version: string };
  /** Stored Mappings brought to today's layout from an earlier one, given what was recorded; null: nothing to bring. */
  upgrade(stored: readonly Mapping[], recorded: string | null): readonly Mapping[] | null;
  /** The Section, by its place on the page, a control of its layout plays (undefined: none): the page follows its banks. */
  section(control: Control): number | undefined;
  /** A control's place on it, by its bank's letter, its kind and its own name ("B", "knob", "K1"); undefined for a control it has not. */
  place(control: Control): { bankLetter: string; kind: PlaceKind; name: string } | undefined;
  /** How many banks it has: a place taken on all of them is "every bank's". */
  banks: number;
  /** The share of a Grid step a Relative message of more than one step (a fast turn) counts for, signed. */
  fastTurnStep: number;
}

/** What a place on a known Controller is: what its Mapping does is said by it (a knob turns, a fader moves). */
export type PlaceKind = 'knob' | 'fader' | 'button';

/** One record per tag: a tag added to the Mapping's list without its Controller does not compile. */
const KNOWN: Record<ControllerId, KnownController> = { c16: C16 };

/** Which known Controller a connected input is, by the name it gives; undefined for any other Controller. */
export const knownController = (name: string): KnownController | undefined =>
  Object.values(KNOWN).find((known) => known.named(name));

/** The known Controllers among the inputs connected, by their names, each once (two C16s are one layout). */
export const knownAmong = (names: readonly string[]): KnownController[] =>
  Object.values(KNOWN).filter((known) => names.some((name) => known.named(name)));

/**
 * A known Controller seen on more than one port at once (issue 185): a C16 on USB and on Bluetooth, each message
 * arriving on both. It is followed on the first connected (`names` in the order they connected); the others are set
 * aside, so a toggle does not flip on and back off, nor a knob move double.
 */
export interface DoubledPorts {
  known: KnownController;
  followed: string;
  aside: string[];
}

/** The known Controllers connected on more than one port, by the inputs' names in the order they connected. */
export const doubledPorts = (names: readonly string[]): DoubledPorts[] =>
  knownAmong(names).flatMap((known) => {
    const [followed, ...others] = names.filter((name) => known.named(name));
    // Two ports giving one name cannot be told apart by it: neither is set aside.
    const aside = others.filter((name) => name !== followed);
    return aside.length ? [{ known, followed, aside }] : [];
  });

/** The inputs whose messages are set aside: a known Controller's ports other than the one followed. */
export const setAside = (names: readonly string[]): Set<string> => new Set(doubledPorts(names).flatMap((d) => d.aside));

/** A known Controller by its tag. */
export const knownById = (id: ControllerId): KnownController => KNOWN[id];

/** The known Controller a Mapping answers alone (its layout's); undefined when it is no layout's, answering every Controller or, with `except`, every one but that. */
export const answeredBy = (mapping: Mapping): KnownController | undefined => (mapping.device ? KNOWN[mapping.device] : undefined);

/**
 * Whether a Mapping answers a message from an input: a layout's Mapping its own Controller only, any other every
 * Controller (ADR-0017), but the one it was learned away from (issue 255). `from` is the input's known Controller,
 * undefined for any other.
 */
export const answers = (mapping: Mapping, from: KnownController | undefined) =>
  mapping.device ? mapping.device === from?.id : !mapping.except || mapping.except !== from?.id;

/**
 * A known Controller's layout, taken: recorded as in place, so it never comes in by itself again, and returned for
 * the Mapping store (the MIDI panel's button puts it back, replacing every Mapping).
 */
export function takeLayout(id: ControllerId, storage: KeyValueStorage): Mapping[] {
  const known = KNOWN[id];
  storage.setItem(known.applied.key, known.applied.version);
  return known.layout();
}

/**
 * What the Mappings become as the inputs connected change: a known Controller's layout comes in by itself the first
 * time one is plugged in while nothing is mapped (after that, a person who removed it meant to: ADR-0009); a layout
 * stored before today's is brought up to date, once. Null when the Mappings stay as they are.
 */
export function pluggedIn(names: readonly string[], stored: readonly Mapping[], storage: KeyValueStorage): readonly Mapping[] | null {
  let mappings = stored;
  for (const known of knownAmong(names)) {
    const recorded = storage.getItem(known.applied.key);
    if (recorded === known.applied.version) continue;
    if (!mappings.length && recorded === null) mappings = takeLayout(known.id, storage);
    else {
      mappings = known.upgrade(mappings, recorded) ?? mappings;
      storage.setItem(known.applied.key, known.applied.version);
    }
  }
  return mappings === stored ? null : mappings;
}
