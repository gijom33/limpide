# 244: the modulation record out of the engine

**What to build:** From the architecture review of 2026-11-05 (its second candidate, picked by the owner). The Modulation's formulas are pure and tested on their own, but what feeds them is not: the record the engine keeps to answer "what was playing at time t" (the Gates and their dips, the pitches and their Glide, the Patches over time, the bend, aftertouch and its glide, the Tempo, trimming old records, a pause's carry) lives as about fifteen closures inside the engine's one long function, beside the audio nodes. Its seven readers (the Tap Viewers, the rings, the Pitch marker, the LFO plot, Bead, the Scope, the Timeline) can only be tested through a real browser playing sound, and each recent modulation issue (219, 216, 185, 166, 102) edited the sound and the record side by side there. One module holds the record; the engine keeps the nodes and records into it. Nothing heard or seen changes. Upkeep in v1 ([131](./131-v1.md)), decided by the owner.

**Blocked by:** [238](./238-tidy-ups-after-1-24.md) (its tidy-ups edit the same code: the engine's memos, its wake, 216's pause)

**Status:** done (2026-11-06). Built (2026-11-05) on night/2026-11-05 and merged into main on 2026-11-06, approved by the owner: "All issues seem tobe implemeted fine", then "Merge the night"; released in 1.26.0

## Decisions

Decided by the owner, 2026-11-05 ("Agreed.", "write up"):

1. **A reshaping only:** every sound, Viewer, ring and Bead move stays as it is; any oddity found is its own question, not a silent fix (Q1).
2. **In v1, as upkeep,** for a night shift, after 238 (Q2).
3. **All of the record moves:** the Gates and dips, the pitches and Glide, the Patches over time, the bend, aftertouch and its glide, the Tempo, the trimming, and how a pause in a long silence carries on (216). The engine keeps only the audio nodes and records into the module as it plays (Q3).
4. **The record's tests run without a browser:** about 99 of the engine's 188 browser tests ask the record, and become fast unit tests on the module; the browser keeps one check per feature that the sound and the record still agree, as [ADR-0003](../adr/0003-modulation-model-mirrors-the-audio-graph.md) wants (Q4).

Claude's calls, open to the owner:

5. **No new ADR:** it follows ADR-0003, whose model was meant to be pure; nor a glossary word, being code only.
6. **The readers ask the engine as today;** the module's own shape is the builder's.

## Why

Asked by the owner before the write-up, Claude's answer in short:

- **Tests in a fraction of a second, not a minute:** the engine's browser tests take 59 s (measured 2026-11-05, 382 runs); the pure modulation tests take 0.3 s for 109. Builders run them after every small step.
- **Fewer flaky tests:** a test on a record of times and values gives the same answer on any machine, where sound in a browser depends on its timing (as on GitHub's WebKit, 232 and 240).
- **One place for modulation work:** a change to what the Viewers show sits apart from the audio code.
- **A wrong reading found faster:** the record can be checked alone.
- **The cost:** a night's work on code that works, a risk of a subtle slip in what the Viewers show (the agreement checks are there for it), and a gain that grows with the modulation work still to come.

## Agent Brief

**Category:** enhancement
**Summary:** The record the engine keeps of what it played moves into a module of its own, tested without a browser; the engine keeps the audio nodes.

**Current behavior:** The engine schedules the audio nodes and, in the same closure, keeps every record its readers ask about: the Gates with their dips, the pitches with Glide, the Patches over time, bends, aftertouch with its glide, the Tempo, the trimming by age, the settled point, a pause's carry. Its answers (the Modulation, the fundamental, the Patch and an LFO's swing at a time) can only be tested with a real audio context in the browser.

**Desired behavior:**
- One module holds the record and answers every "at time t" question the engine answers today; it owns the trimming and a pause's carry.
- The engine records into it as it schedules the nodes, and keeps only the nodes; its readers ask the engine exactly as before.
- Every sound, Viewer, ring, marker and Bead move is unchanged; the browser tests that check them pass as they are.
- Tests: the record's behaviour (Glide slides, dips, aftertouch's glide, trimming, the settled point, the pause's carry, the Patch and Tempo over time) as node unit tests on the module; the engine's browser tests keep one check per feature that the sound and the record agree, the rest moved.

**Out of scope:** any change heard or seen; the Modulation's formulas (already their own); the engine's nodes and scheduling beyond what the move needs.

## How it was built

Built on `night/2026-11-05`, on top of 238 and the night's other issues:

- **One module, the record** (`src/engine/modulationRecord.ts`), which touches no audio: the newest Note's Gates with their dips and All Sound Off's cut, its pitches with their Glide (and the Note Key Track follows), the Patches in force, the bend, aftertouch and its glide, each LFO's clock, the tempo, the trimming by age (30 s) and count (4096), the settled point and a pause's carry. It answers the Modulation, the fundamental, an LFO's swing and the Patch at a time, and the settled point.
- **The engine records into it** as it schedules the nodes (a Gate, a pitch, a Patch, a bend, a pressure, a Rate change or restart on an LFO's clock, the tempo, a pause's end) and answers its readers from it; their calls are as before. A Voice's own Gate history, which says whether a Note dips first, is the module's Gate history too. The engine is 170 lines shorter.
- **Tests:** 30 node unit tests on the module (0.1 s), checked against deliberate slips in it (a pause carried the wrong way, no trimming, aftertouch not gliding, a Patch at the same moment kept twice, a Gate's start level lost, the Velocity read from a Gate off): each slip fails some. The ten engine browser tests that asked the record alone, with no sound rendered, moved there. Every other engine browser test passes as it was. `tsc`, the lint, the engine's browser tests (545) and the Playwright specs of the record's readers (the rings, the Pitch marker, the LFO plots, the Envelopes' Timeline, the pause, the tempo and MIDI clock, the mascot, the Viewer controls) pass in Chromium and WebKit.
- **The review** (standards and spec, since the night's 243) found no change heard or seen; its notes are made: the engine shares the record's `append` rather than a copy, the record exports only what is read, each test names the issue its behaviour came from, and issue 102 says where its model test now lives.

Claude's calls, open to the owner:

1. **The browser keeps every test that holds the sound to the record, not one per feature.** Of the engine's 188 browser tests, 63 ask the record, not 99 as the write-up counted, and 52 of those also measure the sound: cutting them down to one per feature would drop checks on the sound, which decision 1 and the brief ("the browser tests that check them pass as they are") keep. Only the 10 that asked the record alone moved; a later pass can thin the agreement checks where they repeat.
2. **Kept in the browser, though they ask the record alone:** the cut recorded by All Sound Off, what the mascot reads (a Note into a Release struck after its dip), and the Timeline's past staying put while knobs turn: each is the one check that the engine records that feature into the record, which the module's tests cannot see.
3. **The LFOs' clocks are the record's, and the engine moves them itself** (a Rate change, a restart, a pull onto the beat), since each move goes with a move of the oscillators; the record owns their trimming and a pause's carry.
4. **Which Voice leads, when a Note glides and the newest Note's listeners stay in the engine:** they decide what is played, not what was.

To try in the app (nothing should look or sound different):

- Play a few Notes with Glide up and an LFO on Pitch: the Pitch marker slides and wobbles, the Timeline draws the Envelopes as before, and Freeze holds its past still.
- Set an LFO on the Cutoff with Sync on, leave the page silent until the sound pauses, then play: the LFO plot, the rings and the beat carry on where they were.
- Press aftertouch on a keyboard (or bend): the ring and the Pitch marker move as before.

**Since then (2026-11-07, [250](./250-tidy-ups-after-1-26.md))**: the record writes its own LFO clocks; the engine asks it to (its call 3 said the engine moved them itself).
