# 55: App.tsx split by concern, its glue tested

**What to build:** `src/ui/App.tsx` is 963 lines (27 `useState`, 17 `useRef`, 19 `useEffect`) and changed in 70 of 206 commits; it is the least tested code: swapping the MIDI Next and Previous Preset actions (`App.tsx:417`) passes every unit, engine and e2e test ([review 8](../reviews/2026-10-26/8-oss-sceptic.md), [review 9](../reviews/2026-10-26/9-ts-react-webaudio.md), [review 10](../reviews/2026-10-26/10-methodology.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** to do. **Before the LinkedIn post:** no

- [ ] A test for each MIDI Action (Next and Previous Preset, Hold, octave) that fails when they are swapped
- [ ] Hooks by concern (the session and audio start, MIDI and Learn, the Patch library, the Demo and Song, the keyboard), each with the state it owns; `App` composes them
- [ ] No behaviour change: the full suite green before and after, commit by commit
- [ ] A linter that catches what the review found (a duplicate import, three `eslint-disable` comments for an ESLint that isn't installed): ESLint with the React hooks rules, or Biome, in CI
