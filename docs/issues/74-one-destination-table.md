# 74: One table for what an LFO does to each Destination

**What to build:** For each LFO Destination, how far full Depth takes it, how much room it has before an end, and which knobs carry its ring are answered by one table, not by a constant and a switch in each module that asks. Today the Pulse Width's room rule is written three times (the engine, the rings, the Effective value), the Resonance's three times, and seven separate constants are re-imported by four modules; issue 68's four new Destinations touched nine files. Candidate 2 of the architecture review of 2026-10-28, chosen by the owner. Nothing seen or heard changes.

**Blocked by:** none

**Status:** done (2026-10-28). One law per LFO Destination, read by the model, the engine, the rings and the Effective value; the seven constants, the three copies of each room rule and the rings' hand-written lists are gone. Nothing seen or heard changed: the engine's browser tests and the Playwright suite pass untouched.

## Agent Brief

**Category:** enhancement
**Summary:** One law per LFO Destination (its amount at full Depth, its room, its knobs), read by the model, the engine, the rings and the Effective value, so a Destination's arithmetic is written once.

**Current behavior:**
- Each Destination's amount at full Depth is its own constant, in a unit that differs by reader (the model's Pitch in semitones, the engine's in cents).
- The Pulse Width's room (its distance to the narrowest and widest pulse) and the Resonance's (to 0 and 1) are written out where the model, the engine and the rings each compute a swing.
- The knobs that carry a modulation ring are a hand-written list, beside a hand-written table of each knob's reach function.
- The Effective value of a knob is a switch with a branch per Destination.

**Desired behavior:**
- One law per Destination, keyed so the type checker refuses a Destination without one: its amount at full Depth in its knobs' unit (semitones for Pitch and Osc 2 Pitch, cents for Detune, a fraction for Pulse Width, octaves for Cutoff, 0–1 for Resonance and Volume), its room from a knob's value where it has an end, and the knobs whose ring shows it.
- The Patch module keeps each Destination's id, name, stage and the knob the Timeline draws it on; readers see one lookup with both.
- The five Destinations an LFO swings evenly around the knob (Pitch, Osc 2 Pitch, Detune, Pulse Width, Resonance) share one reach and one Effective value, computed from their law. Cutoff (in octaves, with the Filter Envelope, Velocity and Key Track) and Volume (dipping from the knob) keep their own named functions, reading their amount from the law.
- The engine takes its amounts and rooms from the laws; its wiring of each Destination to the audio graph stays its own (ADR-0003).
- The knobs that carry a ring are every knob a law names.

**Key interfaces:**
- The laws, and the swing of a Destination from a knob's value
- The Destination lookup by id
- A knob's Effective value, and its reach for an even Destination
- The set of knobs that carry a ring

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green; no engine browser test or Playwright test changed
- [x] No module outside the laws computes a Pulse Width's or a Resonance's room, and no per-Destination amount constant remains
- [x] A table-driven unit test over every even Destination: full Depth on one LFO swings it the law's amount each way, both LFOs together stay within its room, and its knob's Effective value follows
- [x] The knobs that carry a ring are derived, and a test pins them to today's seven

**Out of scope:**
- The engine's audio wiring per Destination
- A new Destination, or any change to an amount or a room
- Any visible or audible change

## Decisions (grilling, 2026-10-28, decided by the owner)

1. A row per Destination holds its amount at full Depth, its room and its knobs; the engine reads its amounts and rooms from the rows and keeps its own wiring.
2. The five even Destinations share a generic reach and Effective value; Cutoff and Volume keep their named functions, with their amounts in the rows.
3. The laws live on the modulation side, keyed by every Destination so the type checker forces a row; the Patch module keeps id, name and stage; readers use one lookup.
4. The knobs that carry a ring are derived from the rows: Pulse Width's on both Oscillators. The Timeline keeps Osc 1's Pulse Width scale.
5. A table-driven test over the even rows; the existing reach, Effective value and model tests stay as the safety net, none pruned.
6. Nothing seen or heard changes: every existing test passes.

Claude's calls, open to the owner:

7. No ADR: the table carries out ADR-0003 (the model mirrors the audio graph) without a new decision. CONTEXT.md is unchanged: Destination and Depth are already there, and a law's room is code, not a domain word.
8. Built in the session that grilled it, test-first, committed as it goes, not pushed, as issue 73 was.
9. The four reach helpers that become one line over the generic reach (Pulse Width, Resonance, Osc 2 Pitch, Detune) go, since the rings call the generic one and a function only tests reach is dead (CODING_STANDARDS). Their test cases keep their values and expectations and call the generic reach instead: the one place decision 5 is bent.

## How it was built

- **The laws** (`src/modulation/modulationModel.ts`): `LFO_LAWS`, one `LfoLaw` per Destination (`perDepth` in its knobs' unit, an optional `room(value)`, `knobs`), checked with `satisfies Record<LfoDestination, LfoLaw>`. `destinationSwings(patch, destination, value)` gives each LFO's swing by the law; `lfoOffset` takes the LFOs' values and a knob's value instead of an amount and a room. `lfoSwings` stays as the primitive the law calls. The pulse's narrowest and widest are private to the law.
- **The lookup** (`src/modulation/destinations.ts`): `DESTINATIONS` joins each `LFO_DESTINATIONS` row with its law. `destinationOf(knob)` and `MODULATED` (the ring-carrying knobs) are derived from the laws' `knobs`. `effectiveValue` keeps the model's Cutoff and Volume and swings every other knob evenly by its law; the Resonance now takes that generic path, the same formula as the model's.
- **The reach** (`src/modulation/reach.ts`): `evenReach(patch, knob)` replaces the Pulse Width, Resonance, Semitone and Detune helpers; the rings call it for every knob but the Cutoff and the Volume. Their tests in `reach.test.ts` call it with the same values and expectations (decision 9).
- **The engine** (`src/engine/synthEngine.ts`): its PWM, LFO gains, Resonance and tremolo read `destinationSwings` and convert to the nodes' units (cents for the pitches and the Cutoff); its wiring is unchanged.
- **The test**: `destinations.test.ts` runs every even Destination through its law (swing, Effective value, reach, both LFOs within the room), checks the rooms near the ends, and pins the ring-carrying knobs to the seven of before.

