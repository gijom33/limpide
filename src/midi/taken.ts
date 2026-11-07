import { answeredBy } from './controller';
import { describeControl, describeTarget, targetKey } from './describe';
import type { Mapping } from './mappings';

/** What a taken Mapping's control did, said of one control or of several: "turns", "turn". */
const VERBS = { turn: 'turns', move: 'moves', fire: 'fires', switch: 'switches' } as const;
type Verb = keyof typeof VERBS;

/** A button fires an Action and switches a choice; a fader moves; a knob turns. */
const verbOf = (mapping: Mapping, name?: string): Verb =>
  mapping.target.kind === 'action'
    ? 'fire'
    : mapping.mode === 'trigger' || mapping.mode === 'toggle' || mapping.control.kind === 'note'
      ? 'switch'
      : name?.startsWith('F')
        ? 'move'
        : 'turn';

/**
 * What the Mappings a learned one replaced no longer do, for the Learn bar (issue 255): a known Controller's place by
 * its bank and name ("bank B’s K1 no longer turns Cutoff"), the same place taken on every bank said once ("every bank’s
 * M4 no longer fires Hold"), a person's own Mapping by its control. Empty when nothing was taken.
 */
export function describeTaken(took: readonly Mapping[]): string {
  // Each place's Mappings with the same target gathered, its banks in order; an own Mapping alone.
  const groups = new Map<string, { mapping: Mapping; name?: string; banks: string[]; of: number }>();
  took.forEach((mapping, i) => {
    const known = answeredBy(mapping);
    const place = known?.place(mapping.control);
    const key = known && place ? `${known.id} ${place.name} ${targetKey(mapping.target)}` : `own ${i}`;
    const group = groups.get(key) ?? { mapping, name: place?.name, banks: [], of: known?.banks ?? 0 };
    if (place) group.banks.push(place.bank);
    groups.set(key, group);
  });
  return [...groups.values()]
    .map(({ mapping, name, banks, of }) => {
      const verb = verbOf(mapping, name);
      const plural = banks.length > 1 && banks.length < of;
      const who = !name
        ? describeControl(mapping.control)
        : banks.length === of
          ? `every bank’s ${name}`
          : `${plural ? 'banks' : 'bank'} ${banks.join(' and ')}’s ${name}`;
      return `${who} no longer ${plural ? verb : VERBS[verb]} ${describeTarget(mapping.target)}`;
    })
    .join('; ');
}
