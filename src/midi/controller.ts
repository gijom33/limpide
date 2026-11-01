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
  upgrade?(stored: readonly Mapping[], recorded: string | null): readonly Mapping[] | null;
  /** The Section, by its place on the page, a control of its layout plays: the page follows its banks. */
  section?(control: Control): number | undefined;
  /** The share of a Grid step a Relative message of more than one step (a fast turn) counts for, signed. */
  fastTurnStep?: number;
}

/** One record per tag: a tag added to the Mapping's list without its Controller does not compile. */
const KNOWN: Record<ControllerId, KnownController> = { c16: C16 };

/** Which known Controller a connected input is, by the name it gives; undefined for any other Controller. */
export const knownController = (name: string): KnownController | undefined =>
  Object.values(KNOWN).find((known) => known.named(name));

/** The known Controllers among the inputs connected, by their names, each once (two C16s are one layout). */
export const knownAmong = (names: readonly string[]): KnownController[] =>
  Object.values(KNOWN).filter((known) => names.some((name) => known.named(name)));

/** The known Controller a Mapping answers alone (its layout's); undefined when it answers every Controller. */
export const answeredBy = (mapping: Mapping): KnownController | undefined => (mapping.device ? KNOWN[mapping.device] : undefined);

/**
 * Whether a Mapping answers a message from an input: a layout's Mapping its own Controller only, any other every
 * Controller (ADR-0017). `from` is the input's known Controller, undefined for any other.
 */
export const answers = (mapping: Mapping, from: KnownController | undefined) => !mapping.device || mapping.device === from?.id;

/** A known Controller's built-in layout, recorded as in place: the MIDI panel's button puts it back, replacing every Mapping. */
export function builtInLayout(id: ControllerId, storage: KeyValueStorage): Mapping[] {
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
    if (!mappings.length && recorded === null) mappings = builtInLayout(known.id, storage);
    else {
      mappings = known.upgrade?.(mappings, recorded) ?? mappings;
      storage.setItem(known.applied.key, known.applied.version);
    }
  }
  return mappings === stored ? null : mappings;
}
