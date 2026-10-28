# 70: Code tidy-ups after 1.14

**What to build:** The code smells the 1.13.0 and 1.14.0 reviews sent to the inbox (2026-10-28), gathered into one pass (decided by the owner, grilling of 2026-10-28, question 13). Nothing visible changes.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** Remove dead modulation-reach code, de-duplicate the Cutoff rings and the Timeline's line drawing, and rename leftovers, with no visible change.

**Current behavior:**
- `cutoffReach` is called by the app only for the Patch at rest (no Note sounding). Its branch for a sounding Note (Velocity and Key Track as a fixed shift) and the per-source `shares` it returns, all but the Filter Envelope's, are reached only by its own unit tests. The rings no longer read the LFOs' shares either (`lfoCutoffReach` and the Volume reach still compute them).
- The Cutoff knob's modulation rings (Filter Envelope, Velocity, Key Track) each repeat the same show/hide and set-path steps.
- The Timeline's line-drawing helper takes five positional arguments, and the dash state it keeps per line (so dashes stay pinned to time) gains an entry for every line key ever drawn and is never pruned; it has no test.
- The Spectrum's Ideal Reference marks are circles, squares and triangles since issue 61, but their code still calls them rings (`frozenRings`, `ringCount`, `RING_GAP`, the `data-ideal-rings` attribute).
- The Tutorial's `'action'` Step kind is special-cased in several places (the Tutorial model, its state hook and its card), and an action Step's `since` is typed `unknown`.
- The modulation destinations module imports the `Modulation` type from the synth engine, which itself imports the modulation modules (type only, but a cycle).

**Desired behavior:**
- Reach functions return only what a caller reads: no branch or field that only a test reaches. Their tests cover what the app uses.
- The Cutoff rings share one way of drawing a ring (shown or hidden, its path), used by every ring.
- The Timeline's line helper takes a named options object; its dash state forgets lines that are no longer drawn, and a unit test pins dashes to time across two frames and shows a dropped line's state going.
- The Ideal Reference marks are named marks, not rings, in code and in the DOM attribute (tests updated to the new name).
- The `'action'` Step kind is handled where Steps are defined, so the other places ask one question of a Step instead of checking its kind; `since` has a real type.
- No import cycle between the modulation modules and the engine: the shared type lives where both can import it.

**Key interfaces:**
- `cutoffReach`, `lfoCutoffReach` and the Volume reach, and the `Reach` type's `shares`
- The `modulated(...)` result the Cutoff rings draw from (`envelope`, `velocity`, `keyTrack`)
- The Timeline's `line()` and `dashed()` helpers and their dash state
- The Tutorial's `Step` type
- The `Modulation` type

**Acceptance criteria:**
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, with no screenshot or behaviour test changed except for renamed selectors
- [ ] No production code path is reached only by tests in the reach module (checked by reading the callers)
- [ ] The Timeline's dash state has a unit test, and its size stays bounded when lines come and go
- [ ] `grep -rn -i 'ring' ` over the Spectrum's code finds no name for the Ideal's marks
- [ ] No module under the modulation folder imports from the engine

**Out of scope:**
- Any visible change to the rings, the Timeline, the Spectrum or the Tutorials
- The LFO Destinations list (issue 68)
- The Timeline's knob-setting line and the Demo's stop rules (issue 71)
