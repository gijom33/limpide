# 75: The players share a Transport

**What to build:** The Demo, the Song, a Tutorial's Listen and the Hold rhythm each hand Notes to the engine ahead of the audio clock with a scheduler of their own: the stop sequence is written three times, the lit keys twice, and the choice between closing the Gate and releasing one Note (which hangs on the Patch's Voices) three times. Listen borrows the Demo's player with four of its inputs switched off. One Transport plays Notes for all of them; each player keeps only what makes it itself. Candidate 3 of the architecture review of 2026-10-28, chosen by the owner. Nothing heard or seen changes.

**Blocked by:** none

**Status:** done (2026-10-28). One Transport plays the Demo's, the Song's, Listen's and the Hold rhythm's Notes; the players end every Note by releasing it; the Demo, the Song and Listen share one value for what plays. Nothing heard or seen changed: the Playwright suite passes untouched.

**Since then:** the stop closes the Gate once, now: the engine's Note Off reaches the Notes already handed over on any number of Voices, which the second Gate off just past the look-ahead did not on several (issue 101, 2026-10-30).

## Agent Brief

**Category:** enhancement
**Summary:** One Transport hands every player's Notes to the engine on a look-ahead, lights the piano's keys and stops the same way; the engine's release ends a Note on any number of Voices; the Demo, the Song and Listen share one "what plays by itself".

**Current behavior:**
- Three schedulers each run a timer, hand Notes over a look-ahead, and stop by closing the Gate now and again just past the look-ahead.
- Each player asks the Patch's Voices to choose between closing the Gate (one Voice) and releasing the Note (several).
- The Demo and the Song each work out which keys to light.
- Listen plays a Tutorial's phrase through the Demo's player, as 64 parts, started again at their end.
- The Demo, the Song and Listen each keep a stop and a playing state; each start stops the other two.

**Desired behavior:**
- One Transport: given a source of Notes (each with its Velocity, start and end), it asks for those due before the look-ahead horizon on every tick, hands each Note's start then its end to the engine (a chord's starts before any of its ends), lights the keys of the Notes sounding (where the player shows them), and stops: the Gate closed now and just past the look-ahead, the keys cleared, nothing more handed over. A source may say it is over (the Demo's track), or ask for an earlier tick (the Demo's part switch).
- Each player passes its own look-ahead and tick: 0.15 s and 40 ms for the Demo, the Song and Listen, 0.1 s and 25 ms for the Hold rhythm.
- The players end every Note by releasing it; the engine's release closes the Gate on one Voice when the Note is the one sounding, as it already does, and an engine test pins that.
- The Demo keeps its parts, its Preset loads on the bar line, its breath, its knob moves and its octave; the Song its loop and the piano's octave; the Hold rhythm its taps and the Notes held; Listen its phrase on a loop, with the Demo's breath at each pass's end, played by its own small player.
- The Demo, the Song and Listen share one value saying which plays, or none; starting one stops the one playing; a Tutorial sets it to none. The Hold rhythm stays Hold's.

**Key interfaces:**
- The Transport: its start (a host with the clock, the engine's Note calls and the keys; a source; the timing) and the stop it returns
- A source of Notes: the Notes due before a horizon, or that it is over
- The players' hosts, which lose the Voices and the choice of Note end

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, no Playwright test changed
- [x] No player asks for the Voices to end a Note (the Hold rhythm still asks them to choose what it plays); no player writes a timer, a look-ahead loop or the stop sequence of its own
- [x] The Transport's tests: Notes handed over ahead of the clock and not before, a chord's starts before its ends, starts and ends in time order, the lit keys, the end of a source, the stop
- [x] An engine test: on one Voice, releasing the Note sounding closes the Gate, and releasing one it has moved on from does not; a chord on one Voice ends with its last Note
- [x] The players' own tests keep their expectations, with Note ends as releases

**Out of scope:**
- The Demo's stop rule (what a person does that stops it), the review's candidate 7
- Any change to what plays or when

## Decisions (grilling, 2026-10-28, decided by the owner)

1. One Transport for the Demo, the Song, Listen and the Hold rhythm; each keeps only what makes it itself, and Listen gets its own player.
2. The engine owns how a Note ends on one Voice; the players stop asking for the Voices; an engine test pins it, in place of the players' three.
3. Each player keeps its timing, passed to the Transport.
4. One value for what plays by itself among the Demo, the Song and Listen; the Hold rhythm stays Hold's.
5. Tests move to where the behaviour lives, with their expectations; nothing heard or seen changes.
6. The Demo's stop rule is out of scope.

Claude's calls, open to the owner:

7. The Transport pulls: on each tick it asks the source for the Notes due before the horizon, each with its start and end, so the Song's octave and the Hold rhythm's held Notes are read when a Note is due, as today.
8. The engine needs no change for decision 2: its release already closes the Gate on one Voice for the Note sounding. The new engine test pins it before the players rely on it.
9. Listen loops its phrase without end instead of starting again after 64 passes, which put a lead-in's gap and a pass without its breath every 64 passes (a few minutes in).
10. No ADR (ADR-0007's Note Off and release stay as they are); CONTEXT.md unchanged, the Transport being code, not a domain word. Built here, test-first, not pushed.

## How it was built

- **The Transport** (`src/play/transport.ts`): `startTransport(host, source, { lookahead, tick })`. A `Source` is asked on each tick for the Notes due before the horizon and hands them to `play`, each a `Played` (note, Velocity, `on`, `off`); it returns `'end'` when over, or a shorter wait in ms. The Transport groups a chord's starts before its ends, lights the keys through `onNotes` where the host has it, and on stop closes the Gate now and past the look-ahead. Tests: `transport.test.ts`.
- **The phrase loop** (`loopPhrase` in `src/demo/phrase.ts`): a phrase on a loop as a source, with an optional breath before each pass's end and a transposition read as each Note falls due. The Song is the loop with the piano's octave; Listen (`startPhraseLoop` in `src/demo/player.ts`) is the loop with the Demo's lead-in and breath, and the piano on the phrase's octave.
- **The Demo** (`startDemo`): its parts, Preset loads, breath, knob moves and octave make a source; it hands a part's Notes to `play` before the next part's Preset loads, so they keep their own sound (issue 60).
- **The Hold rhythm** (`startRhythm`): its taps make a source; it still asks the Voices to choose what a tap plays.
- **The release on one Voice**: no engine change; the engine test "on one Voice, releasing the Note sounding closes the Gate…" pins it. The players' tests on choosing a Note's end are gone; their other tests keep their expectations with releases for ends.
- **What plays** (`usePlayers`): one `playing` value ('demo', 'song', 'listen' or none) and one stop; `play(kind, start)` stops what plays first. A Tutorial calls `stopAll`.

Since then (2026-10-28, the code review of issues 73 to 79): decision 9, Listen looping without end, kept by the owner.
