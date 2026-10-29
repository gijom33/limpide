# 75: The players share a Transport

**What to build:** The Demo, the Song, a Tutorial's Listen and the Hold rhythm each hand Notes to the engine ahead of the audio clock with a scheduler of their own: the stop sequence is written three times, the lit keys twice, and the choice between closing the Gate and releasing one Note (which hangs on the Patch's Voices) three times. Listen borrows the Demo's player with four of its inputs switched off. One Transport plays Notes for all of them; each player keeps only what makes it itself. Candidate 3 of the architecture review of 2026-10-28, chosen by the owner. Nothing heard or seen changes.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

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
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, no Playwright test changed
- [ ] No player asks for the Voices; no player writes a timer, a look-ahead loop or the stop sequence of its own
- [ ] The Transport's tests: Notes handed over ahead of the clock and not before, a chord's starts before its ends, starts and ends in time order, the lit keys, the end of a source, the stop
- [ ] An engine test: on one Voice, releasing the Note sounding closes the Gate, and releasing one it has moved on from does not; a chord on one Voice ends with its last Note
- [ ] The players' own tests keep their expectations, with Note ends as releases

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
