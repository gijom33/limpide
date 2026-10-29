# 77: The Viewer settings in one store

**What to build:** What the Viewers read every frame is put together in the app's main component from four mechanisms (a reducer for Freeze, the Snapshot, the axes and the Amp Tap's source; two loose states for the Scope's cycles and the Timeline's length; the saved overlays; the Ideal Reference computed from the Patch), bundled again into a reference on every render. One Viewer settings store outside React holds them all. Candidate 5 of the architecture review of 2026-10-28, chosen by the owner.

It also fixes a bug found while grilling it: the Ideal Reference was recomputed only when Osc 1's Waveform, its Pulse Width, or the Osc 1 or Sub level changed, so Osc 2's marks ignored Osc 2's Waveform, Pulse Width, tuning and level until one of those moved (confirmed in the app: Osc 2 raised to 100 % with a Note held left the Ideal's 24 marks as they were; a nudge of Osc 1 then made them 48).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** One store per page for the Viewer settings, read by the render loop and subscribed to by React, with the Ideal Reference derived from the Patch inside it (fixing its Osc 2 bug) and the Amp Tap's source handed to the engine.

**Current behavior:**
- Freeze, the Snapshot, the axes and the Amp Tap's source live in a React reducer whose dispatch is passed to the MIDI hook and the Space key; the cycles and the Timeline's length in two React states; the overlays in a third, saved by an effect; the Amp Tap's source reaches the engine through an effect.
- The Ideal Reference is computed in the main component when four of the Patch's values change, though it reads ten.
- A reference bundles them all for the render loop on every render.

**Desired behavior:**
- One Viewer settings store per page, made beside the Patch store: a read for the render loop, a subscription for React, and the reducer's actions (extended to the cycles, the Timeline's length and the overlays) as its one way to change.
- Only the overlays are saved, as today; a new page starts from them. Freeze and the Snapshot are never saved.
- The Amp Tap's source reaches the engine as soon as it changes.
- The Ideal Reference follows every change to the Patch, Osc 2's included.

**Key interfaces:**
- The Viewer settings store: its read, its actions, its subscription
- The settings the Viewers read every frame (unchanged in shape)

**Acceptance criteria:**
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, no Playwright test changed
- [ ] No Viewer setting kept in React state; no dispatch passed between hooks
- [ ] Node tests: only the overlays are saved; a new store starts from the saved overlays; the Amp Tap's source reaches the engine at once; the Ideal Reference follows Osc 2's level and tuning

**Out of scope:**
- Saving any other Viewer setting (decision 3)
- The theme and the letter keys, which are not Viewer settings

## Decisions (grilling, 2026-10-28, decided by the owner)

1. One Viewer settings store outside React, beside the Patch store, holding every setting the Viewers read; the render loop reads it, React subscribes, the Amp Tap's source reaches the engine from it. Theme and letter keys stay out.
2. The Ideal Reference is derived in the store from the Patch store.
3. Only the overlays are remembered across a reload, as today.
4. The reducer's actions, extended, are the one way to change the settings; nobody passes a dispatch around.
5. The reducer's and the overlays' tests stay; four node tests are added; the Playwright suite passes unchanged.
6. The Ideal Reference's Osc 2 bug is fixed here, with a test: the issue's one visible change.

Claude's calls, open to the owner:

7. The store recomputes the Ideal Reference on every change to the Patch, rather than on a list of the values it reads, so no list can fall behind what it reads again.
8. Built in the session that grilled it, test-first, not pushed.
