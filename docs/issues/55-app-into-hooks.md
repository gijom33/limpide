# 55: App.tsx split by concern, its glue tested

**What to build:** `src/ui/App.tsx` is 963 lines (27 `useState`, 17 `useRef`, 19 `useEffect`) and changed in 70 of 206 commits; it is the least tested code: swapping the MIDI Next and Previous Preset actions (`App.tsx:417`) passes every unit, engine and e2e test ([review 8](../reviews/2026-10-26/8-oss-sceptic.md), [review 9](../reviews/2026-10-26/9-ts-react-webaudio.md), [review 10](../reviews/2026-10-26/10-methodology.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-27)

- [x] A test for each MIDI Action (Next and Previous Preset, Hold, octave) that fails when they are swapped
- [x] Hooks by concern (the session and audio start, MIDI and Learn, the Patch library, the Demo and Song, the keyboard), each with the state it owns; `App` composes them
- [x] No behaviour change: the full suite green before and after, commit by commit
- [x] A linter that catches what the review found (a duplicate import, three `eslint-disable` comments for an ESLint that isn't installed): ESLint with the React hooks rules, or Biome, in CI

How it was done: `App` (1146 lines with the Tutorials and the Demo card) is 590, most of it the page's markup. It composes six hooks in `src/ui/hooks/`, each owning its state: `usePatchState` (the Patch, its name and library, autosave), `useHold`, `useKeys` (the computer keyboard, Space to Freeze), `usePlayers` (the Demo, the Song and a Tutorial's Listen: one plays at a time), `useTutorialState` and `useMidi` (Mappings, Learn, Quick Setup, the C16). The hooks call each other only through what `App` hands them (the Demo ends a Tutorial through `onDemoStart`). The Actions test is in `e2e/midiLearn.spec.ts`; swapping Next and Previous fails it.

Since then (2026-10-28, [issue 73](./73-patch-store.md)): `usePatchState` is gone. The Patch, its name and the autosave live in a store made beside the audio session, outside React ([ADR-0013](../adr/0013-the-patch-lives-outside-react.md)).

The linter is Biome 2.5 (`npm run lint`, `biome.json`), not ESLint: typescript-eslint needs the TypeScript compiler's JavaScript API, which TypeScript 7 no longer ships. Its recommended rules plus the hooks rules as errors; off are the style rules this code disagrees with (non-null assertions, assignments in arrow bodies, callbacks returning values). Biome has no duplicate-import rule, but its import organising merges duplicates, and `biome check` fails on imports it would change. CI runs `tsc` and the lint before the tests. Each deliberate dependency list carries its reason in a `biome-ignore`. The Tutorial Step's `then` became `note`: an object with a `then` can be taken for a promise.
