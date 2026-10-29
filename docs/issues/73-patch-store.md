# 73: A Patch store outside React

**What to build:** The Patch being played lives in one store outside React, which hands every change to the engine and the Note input at once, before React hears of it. Today eight kinds of writer (a knob by hand, the pickers, the LFO controls, a Controller, the Demo, a Tutorial, a load, a Program change) keep React's Patch, a reference to it and the engine in step by hand, across three hooks. Candidate 1 of the architecture review of 2026-10-28, chosen by the owner. Nothing visible changes.

**Blocked by:** none

**Status:** done (2026-10-28). The Patch lives in a store made beside the audio session; the engine and the Note input hear each change before React; the Demo's knobs listen for a hand's or a Controller's changes. Nothing visible changed: the Playwright suite passes untouched.

## Agent Brief

**Category:** enhancement
**Summary:** Replace the Patch's React state and its reference with one store per page, which applies each change to the engine synchronously, autosaves the Last session and reports who made each change.

**Current behavior:**
- The Patch is React state, mirrored in a reference that MIDI messages and the players read and write between renders.
- A change by hand or from a Controller reaches the engine one render later, through an effect; the Demo's changes reach it at once and then again through that effect.
- The Demo's rule "a knob turned by hand keeps its value until the Demo's next Preset" keeps a set of Parameters that the hand path and the MIDI path each write into.
- The Patch's name, the Patch it was loaded as ("changed" compares against it), the start (a Share link, else the Last session, else Init) and the autosave live in a React hook.

**Desired behavior:**
- One Patch store per page, made once beside the audio session (React's StrictMode builds first state twice, so building the store has no side effect on the address or on other state).
- The store holds the Patch, its name, its baseline and whether it has changed. It starts from a Share link, else the Last session, else Init, and autosaves the Last session a moment after the start and after each change, as today.
- Every change goes to one function given to the store at creation, which applies the Patch to the engine and sets the Note input's Voices, synchronously and before React is told.
- Three writes: change the Patch with any of the Patch module's pure functions, saying who made the change; load a Patch under a name; step to the next or previous Preset (twice before a render steps twice). A read and a subscription, which React reads through `useSyncExternalStore`.
- Each change is reported with who made it: a hand, a Controller, the Demo, a Tutorial or a load. The Demo keeps its own "turned by hand" rule by listening: a change by a hand or a Controller marks the Parameters it moved.
- The Share link is cleared from the address once the page has started, as today, never while the store is built.

**Key interfaces:**
- The Patch store: its read (the Patch, name, changed), its three writes, its subscription and the change it reports (the Patch before and after, who made it)
- The audio session, which makes the store and gives it the engine's side
- The players', the MIDI hook's, the Hold hook's and the Tutorial hook's inputs, which take the store or its writes instead of a Patch reference and setters

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, with no Playwright test changed
- [x] No Patch reference written outside the store; the engine's `applyPatch` called only by the store's apply
- [x] Node tests over a fake apply and fake storage: the engine hears a change before subscribers, whoever made it; a Controller's move reaches the engine without a render; two Preset steps before a render step twice; a load resets "changed" and a change sets it; the Last session is autosaved after a pause, not on every change; the start is a Share link, else the Last session, else Init; the Demo skips a knob turned by hand (a Controller's turn included) until its next Preset

**Out of scope:**
- The players' shared scheduling and which one plays (the review's candidate 3)
- The Viewer settings (the review's candidate 5)
- The named Patches in the library, which stay their own module
- Any visible change

## Decisions (grilling, 2026-10-28, decided by the owner)

1. The store owns the Patch now, its name, its baseline, the autosave of the Last session and the start. The library of named Patches stays separate and is used for the autosave.
2. The "turned by hand" rule stays with the Demo. The store only reports who made each change.
3. The engine and the Note input get each change synchronously, through one function given at creation, before React.
4. The writes are three: change with a pure Patch function, load under a name, step a Preset. Plus a read and a subscription; React stops keeping its own copy and the Patch reference goes.
5. Nothing visible changes: the Playwright suite passes unchanged.
6. One store per page, made beside the audio session, with no side effect while it is built; clearing the Share link stays a step after the page has started.
7. The seven node tests of the acceptance criteria.
8. Recorded as [ADR-0013](../adr/0013-the-patch-lives-outside-react.md).
9. CONTEXT.md stays domain-only: no entry for the store.
10. Built in the session that grilled it, test-first, committed as it goes, not pushed.

Claude's calls, open to the owner:

11. The Demo finds what a person turned by comparing the Patch before and after their change, Parameters only. A knob pushed against its stop, which changes nothing, no longer counts as turned; it has no value for the Demo to override anyway.
12. The engine keeps its guard against two Patches at the same instant: with every change applied at once, a knob drag can send two inside one audio render quantum.

## How it was built

- **The store** (`src/patch/patchStore.ts`): `createPatchStore({ start, library, apply })` returns `get()` (`{ patch, name, changed }`, the same object until the next change, as `useSyncExternalStore` needs), `change(edit, by)`, `load(name, patch)`, `step(delta)` and `subscribe(listener)`, whose listener gets `{ before, after, by }`. Each write calls `apply`, then sets the read, then restarts the 300 ms autosave, then tells the listeners. Tests: `patchStore.test.ts`.
- **The start**: the store applies its start Patch and schedules the first autosave as it is made, as the old effects did on mount; the one-per-page session is what keeps React's double build from doing it twice. Choosing the start (a Share link, else the Last session, else Init) stays `initialPatch`, already tested in `presets.test.ts`. Clearing the Share link from the address stays an effect in `App`.
- **The session** (`src/app/session.ts`): `getAudioSession(storage)` makes the library, the start, the engine, the Note input and the store, whose `apply` is the engine's `applyPatch` and the Note input's `setVoices`. It carries `patches`, `library` and `shared`. The `applyPatch` effect in `App` is gone.
- **The Demo's knobs** (`src/demo/demoKnobs.ts`): `createDemoKnobs(store)`, made each time the Demo starts and stopped with it: `newPart(preset?)` forgets what was turned and loads the part, `turn(id, value)` changes the Patch as `'demo'` unless a hand or a Controller moved that Parameter since. Tests: `demoKnobs.test.ts`.
- **The hooks**: `usePatchState` is deleted. `usePlayers`, `useMidi` and `useHold` read the store from the session; `useTutorialState` takes it and writes as `'tutorial'`. The rings' and the Pitch marker's context reads the Patch through a function, not a reference. `App` changes the Patch by hand through one `edit` helper.

Since then (2026-10-28, the code review of issues 73 to 79): the store chooses its own start from the page's address and the library (`createPatchStore({ hash, library, apply })`, with `shared`), as decision 1 said it owns the start; `patchStore.test.ts` tests a Share link, the Last session and Init. [ADR-0014](../adr/0014-the-stores-are-built-once-with-their-effects.md) corrects ADR-0013's "building it has no side effect".
