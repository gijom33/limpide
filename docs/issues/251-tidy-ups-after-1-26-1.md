# 251: tidy-ups after 1.26.1

**What to build:** The 1.26.1 code review's leftovers (2026-11-07), the judgement calls not fixed before the release, all in 248's crossfade and 250's modulation record. Nothing a person sees. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; released in 1.27.0

## The items

1. **A Filter side is a bare number,** and "the other side" is written out six times: a small type, or one helper.
2. **The crossfade's state is five loose values** (the side heard, the fade's start and share, the latest fade's number, the Mode waiting, whether it has settled, the Slope): one object, its rules beside it.
3. **Two `fadeTo`s,** the engine's and a Voice's, with different contracts: names that say which; and a side's state split between the shared side and each Voice's, kept in step by its index, in one place.
4. **The record's slide lookup takes its field names as a tuple,** for two callers: two plain lookups, or one that takes what it reads.
5. **A render quantum written as 128** in the engine's tests beside the engine's own constant: the one constant.

**Added in triage (2026-11-07, from the 1.26.2 code review):**

6. **A change of Mode given a time ahead of the clock** settles the fade then, unwiring a side still heard: none of the app's callers does so, but the early settle could wait on the clock too.
7. **A Mode waiting since inside the 10 ms** still starts its fade from a clock read in the fade's end, which an offline render may have run past: the path that clicked in 1.26.1's statistics run, now reached only from inside the fade.
8. **The click has no test of its own** that fails without 1.26.2's fix: one, if a render can be made to show it every time.

## Agent Brief

**Category:** enhancement
**Summary:** Five small tidy-ups, and three notes on the fade's timing, from 1.26.1's review in the crossfade and the modulation record: the Filter side's type, the fade's state as one object, two functions' names, a lookup's tuple of field names, and one render-quantum constant.

**Current behavior:** As the items above say.

**Desired behavior:**
- Each item as it says; nothing heard or seen changes.
- Items 6 to 8: the fade settled and started only from times the audio clock has reached, and a test that clicks without it, if one can be made to.
- Tests: 248's and 244's kept passing as they are, among them the change of Mode just after a fade, before it settles.

**Out of scope:** the fade's length or shape (248's calls 1 and 2).

## How it was built

Built at night (2026-11-07) on night/2026-11-07, test-first where there was behaviour to test.

**What was built.**

- **Items 1 to 3.** A Filter side is now the shared side itself, not a number. "The other side" is one helper. Each Voice's side holds the shared side it plays, so the two are linked where they are made, not kept in step by an index. The crossfade is one object: the side heard, the fade's start and share, the latest fade's number, whether it has settled, the Mode waiting and the Slope, with its rules beside them. The engine's fade is `beginFade`. A Voice's is two steps, `wireForFade` and `rampShares`, and its `settle` is `settleOn`.
- **Item 4.** The record's slide lookup takes the unit it reads, Hz or semitones. Each pitch kept is a slide in each unit, where it goes and where it starts from.
- **Item 5.** The engine's tests use its own render-quantum constant. The two 128s left in them are a buffer's length and a rounding to 1/128 s, not render quanta.
- **Item 6.** A fade settles early only once the audio clock has passed its end, not when a change is given a time past the end. A new test gives aftertouch a time 15 ms ahead, halfway through a fade from the low-pass to the band-pass at 80 % Resonance. Before the fix it stepped 1.36 times the wave's own steepest step. Now it passes.
- **Item 7, narrowed, not closed.** A Mode waiting since inside the fade still starts its fade from a clock read at the fade's end. Every Voice is now wired for the fade before the clock is read. After that read, only the ramps are written, so less work comes between the read and the writes. Closing it fully would need the waiting fade to be written by the clock alone. With two sides that cannot be done: the side faded out has to take its new Mode once it is silent, and a filter's Mode cannot be scheduled. An offline render does not wait for the page, so on a heavily loaded machine that path can still click. The app's real-time sound does not have this problem.
- **Item 8.** A test now holds up every write made while the render runs, until the render is 20 ms past it, as a heavily loaded machine might. A change in the gap after a fade then clicks every time without 1.26.2's fix: 3.6 to 5.5 times the wave's own step over five runs. With the fix it passes, as that change is faded in at once.

Nothing else heard or seen changes. 248's and 244's tests pass as they were, among them the change of Mode just after a fade, before it settles. 248's every-pair test passed three runs in three, run alone.

**Claude's calls, open to the owner:**

1. **Item 7 is narrowed, not closed** (as above). Closing it would take a third Filter side, so that a waiting Mode never has to wait. That would change 248's call 3, and it is no tidy-up.
2. **A change given a time ahead of the clock, inside a fade, now waits like any other change made during a fade.** It then fades in when the fade ends, which may be earlier than the time it was given. None of the app's callers gives a Mode change a time ahead of the clock, so it was not given its own time to wait for.
3. **Item 8's test holds up the browser's ramp writes itself,** to stand in for a loaded machine. It is the only way found to make a render show the click every time.

**To try in the app:** nothing should sound or look different. The same as 248's:

- Init, a Note held, Resonance at 80 %: switch between every Mode. No tick, only the change of tone.
- Click the Mode picker quickly several times with a Note held: the last Mode clicked is the one heard, without a tick.
- Hold a Note with Glide on, and with Key Track up: the slide and the Cutoff's tracking are as before.
