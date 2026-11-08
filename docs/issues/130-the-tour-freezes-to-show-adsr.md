# 130: The Tour freezes the Viewers to show the Envelope

**What to build:** The owner's idea (inbox, 2026-10-31): "During tour, we could use tricks such as viewer freeze to explain ADSR." So the Tour stops the picture at the right moment, and the person sees the shape of a Note's Amp Envelope (Attack, Decay, Sustain, Release) instead of chasing it as it scrolls by.

What exists already: Freeze stops every Viewer on its frame while the sound plays on (PRD story 39; the Space bar, or Freeze in the Display menu). The Tour's Amp card ([128](./128-how-a-synth-works.md)) turns only Attack and Release, on the Amp Scope and the Amp Spectrum, and says nothing of Decay and Sustain. The Envelope Timeline draws a Note's Amp Envelope over the last few seconds, but the Tour shows it only on the LFO card.

**Blocked by:** none (the Tour, [128](./128-how-a-synth-works.md), came out in 1.18.0)

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; tried by the owner: "Yes but on small screen, we shoukd show both the settings and viewer. If it cannot fit screen we should show each in turn by scrolling." That went to [206](./206-the-tour-shows-the-control-and-the-viewer.md)

## Decisions

Decided by the owner in a grilling, 2026-10-31 (Claude's recommendations, each accepted; the questions below kept as asked):

1. **On the Amp card,** with the Envelope Timeline added to its Viewers; no fifth card.
2. **All four stages:** the card turns Attack, then Decay, then Sustain, then Release. A Note takes the lengths set when its key goes down or up, so each change is made before a Note plays; this answers the 1.18.0 fact-check's finding below.
3. **The freeze:** once a changed Note's Release has faded, the Tour freezes the Viewers for about three seconds, and the card names the stage just changed on the frozen Timeline ("up: Attack"); after the last stage, all four, left to right ("up: Attack; down to a level: Decay; held: Sustain; let go: Release"). Then the picture runs again. The sound never stops: Freeze stops only the picture.
4. **The person's own Freeze** (Space, or Display's Freeze) during the card is theirs for the rest of the card, and the Tour stops freezing on its own. The Tour lets go of its own Freeze when the card changes or the Tour ends.
5. **No other trick for now:** a Snapshot of a short Attack kept while the Tour lengthens it would show both shapes at once, but one trick per card is easier to follow.

## Agent Brief

**Category:** enhancement
**Summary:** The Tour's Amp card turns all four stages of the Amp Envelope, one per Note, and freezes the Viewers once each Note has faded so the person sees the shape it drew.

**Current behavior:** The Amp card turns Attack, then Release, over a repeated phrase, on the Amp Scope and the Amp Spectrum; it says nothing of Decay and Sustain. A Note takes its lengths when its key goes down or up, so with the knobs' taper few Notes get the longest Attack while the move plays (0.8 s once in 48 s), and the Envelope Timeline is not shown on this card.

**Desired behavior:** The Amp card shows the Envelope Timeline beside the Amp Scope and Spectrum. It changes one stage at a time (Attack, Decay, Sustain, Release), each set before a Note plays so the Note carries it, and brings each back. After each changed Note's Release has faded, the Tour freezes every Viewer for about three seconds while the sound plays on, and the card names that stage on the frozen Timeline; after the last stage it names all four, left to right. Then the picture runs again and the next change comes. If the person freezes or unfreezes themselves during the card, the Tour stops freezing for the rest of that card; the Tour's own Freeze is let go whenever the card changes or the Tour ends. The card's words say what it now does, in the Tour's voice, and pass the fact-checker.

**Key interfaces:**
- The Tour's card data (its Viewers, phrase, tempo and moves) and the Tour card that plays it
- Freeze (the Display state the Space bar and Display's Freeze set)
- The Envelope Timeline Viewer and how the Tour brings Viewers into view
- The Tour's existing rule for a control the person grabs (the Tour lets go of it)

**Acceptance criteria:**
- [ ] ~~The Amp card shows the Envelope Timeline with the Amp Scope and Spectrum, at every width the Tour supports (from 2 × 2 up; on a phone, the Timeline alone: see How it was built)~~ (not checked at the time)
- [x] Each of the four stages is changed before a Note plays, and that Note's shape on the Timeline shows the change
- [x] After each changed Note fades, every Viewer freezes for about three seconds while the sound plays on, and the card names the stage; after the last, all four
- [x] Space during the card freezes or unfreezes as always, and the Tour freezes no more on that card
- [x] Leaving the card or the Tour lets go of the Tour's Freeze; a Freeze the person set is left as it is
- [x] The card's words pass the fact-checker (profile 13): no claim the engine does not make true
- [ ] ~~The Tour's e2e spec covers the freeze and the person's own; every test passes in Linux's fonts too (covered, and passing in Chromium and WebKit here; Linux's fonts are GitHub's run)~~ (not checked at the time)

**Out of scope:**
- A Snapshot trick, or a fifth card
- Rewriting the other cards' words ([129](./129-words-fun-to-read.md))

## How it was built

- **The Amp card's four passes:** at 60 BPM, one Note (C3) per stage, each pass 7 s. The synth turns the stage over the first second (Attack to 0.6 s, Decay to 1 s, Sustain to 30 %, Release to 1 s), the ring on its fader; the Note goes down half a second later and carries the change; at 3.2 s, at least 0.15 s after the Note's Release has faded, every Viewer freezes for 3 s; then the stage goes back and the next one turns. Each Note, onset to fade, fits in the 2 s the Envelope Timeline shows by default, with room before its onset. The moves, the phrase and the freezes come from one list of the four stages, so they cannot drift apart.
- **The frozen picture:** the card's line under its words shows the Viewers' own Frozen badge and the stage ("up: Attack"); after the Release pass, all four, left to right. A screen reader hears "Frozen: up: Attack" from a live region of its own. While the picture runs, the line says "The picture freezes once each Note has faded."; every line takes the same place, so the card keeps one height. On a phone the line shows with the card folded.
- **The person's Freeze (decision 4):** a Freeze or unfreeze the synth did not make (Space, Display's Freeze, a Controller's button), or Freeze already on as the card came up, is the person's: the synth freezes no more on that card and the line's word on what is coming goes. The synth lets go of its own Freeze when the card changes or the Tour ends, never of theirs.
- **The words:** the card says each of the four stages in plain words (profile 16), that the synth changes one before each Note and puts it back, that the Filter has an Envelope of its own with the same four stages whose Amount sets how far it moves the Cutoff, and that the Timeline shows the shape each Note drew once it has faded. Fact-checked against the engine: the Envelope's curves (Attack 95 % by its time, Release e⁻⁶ by its), Notes held 85 % of their step, the phrase's lead-in, Init's Filter Envelope Amount (0), and that no Note sounds during a freeze (so the card does not say the sound plays on while frozen).
- **Claude's calls, let stand by the owner in 1.20.0:**
  1. **The stages one at a time, each given back** before the next is turned (the brief's "brings each back"), rather than kept so the last Note carries all four. The Release pass's Note still shows all four stages for the last freeze, Init's Attack being a sharp rise.
  2. **On a phone the Timeline alone is brought into view.** It is far below the Amp's Viewers there (about 670 px from the Amp Scope's top to the Timeline's foot, with about 530 px between the header and the card), so all three cannot be in view at once; the Timeline goes first, as the freeze is about it. From 2 × 2 up all three are.
  3. **The person's Timeline length is left alone.** The passes fit the default 2 s; someone who chose 1 s sees the end of each shape only. The Tour could set it for the card and give it back, but it is a remembered Display setting.
  4. **The Filter Envelope sentence** answers the second half of profile 16's comment (it arrives unannounced in the Bass); one sentence, no move of its own.
  5. **The card's clock counts from the phrase's first beat** (the phrase loop's 0.3 s lead-in) on every card, so the stages and freezes fall where the Notes are; the other cards' moves start 0.3 s later than before, which no one can see.
- **Tests:** `src/tutorial/tour.test.ts`: four Notes, the moves' cycle as long as the phrase; each stage alone changed from half a second before its Note to its fade, far enough to see; the freezes after each fade (by 0.15 s), each onset on a 2 s Timeline, about 3 s long, the picture running a second before the next Note, naming the stage and then all four; no other card freezes. `e2e/tour.spec.ts`: the Attack set before the Note, the freeze and its name, the unfreeze, the Decay next and its freeze; Space during the Tour's freeze unfreezes, and no freeze follows through the next pass; the person's Freeze outlasts the Tour's window; Next, Back and Close let go of the Tour's Freeze and leave the person's; the layouts with the Timeline on the Amp card. Red first for each.
- **Tests run:** `npx tsc`, `npm run lint`, the tutorial, viewers and demo unit tests (219 passed); the Tour spec and the design audit in Chromium and WebKit (80 passed). Linux's fonts are GitHub's run.
- **The code review** (Standards and Spec), fixed: the phrase written by hand beside the timings it must match (now from one stage list), a freeze 0.1 s after the Release's fade (now 0.15 s or more), "Frozen: up: Attack" with two colons (now a badge), the summary decided in two files, the line's word on what is coming left up once Freeze was the person's, a live region that only toggled visibility, the Freeze hand inside the effect (now a helper), and issue 128 not saying the Amp card changed. Noted, not changed: the Tour times its moves on the page's clock and the Notes play on the sound's, set together as the card comes up; they could drift apart only if the sound's clock paused.
- **To try:** take the Tour (About) to the Amp card and watch the Timeline: the Attack fader moves, a slow-rising Note, then the picture freezes with "up: Attack" under the card's words, and runs again; then the Decay, the Sustain, and after the Release all four named. Press Space (not on a button) during a freeze: it unfreezes, and the Tour freezes no more on that card. Try it on a phone too.
- 2026-11-02, since ([190](./190-tutorials-after-review-16-again.md)): the frozen line names the stage first, "Frozen: Decay, the fall to a steady level" ("Attack, the rise", "Sustain, that level held"), and after the Release all four by name, "Attack; Decay; Sustain; Release". The Amp card no longer says what the Amp Scope shows.
- 2026-11-02, since ([206](./206-the-tour-shows-the-control-and-the-viewer.md)): where the Amp's faders and the Timeline do not fit together (a phone, a window about 800 px tall), the page shows each in turn: the fader as it turns and goes back, the Timeline through the Note and its freeze. Call 2 above holds for the Viewers' phase only.

## Questions for the owner

1. **Where?** On the Amp card, or a card of its own, "Amp Envelope", after Amp? Claude's recommendation: the Amp card, which already speaks of Attack and Release, with the Envelope Timeline added to its Viewers. A fifth card would make the Tour longer for one idea.
2. **What does the Tour freeze, and when?** Claude's recommendation: the phrase plays one long Note; when its Release has faded, the Tour freezes the Viewers for about three seconds, and the card names the four stages on the frozen Timeline, left to right ("up: Attack; down to a level: Decay; held: Sustain; let go: Release"). Then the picture runs again and the next Note plays. The sound itself never stops: Freeze stops only the picture.
3. **Decay and Sustain too?** Claude's recommendation: yes. The card turns Attack, then Decay, then Sustain, then Release, each frozen once its new shape is drawn, so the person sees each knob change one stage of the shape.
4. **The person's own Freeze:** pressing Space during the Tour freezes or unfreezes as always. Claude's recommendation: like a control the person grabs, their Freeze is theirs for the rest of the card, and the Tour stops freezing on its own. The Tour lets go of its Freeze when the card changes or the Tour ends.
5. **Other tricks?** A Snapshot (the faint A/B trace) of a short Attack, kept while the Tour lengthens it, so both shapes are seen on the Amp Scope at once. Claude's recommendation: not now. One trick per card is easier to follow; this one can come later.

## Comments

- 2026-10-31, from the 1.18.0 fact-check (inbox): the Amp card says the synth lengthens the Attack, then the Release, but a Note takes the length set when its key goes down or up; with the knobs' taper few Notes get the longest (0.8 s once in 48 s). The card's words or its timing are reworked here, with the freeze. Triage, Claude's call, let stand by the owner in 1.19.0.
- 2026-10-31, from profile 16's first review: Decay and Sustain are never explained anywhere, and the Filter Envelope arrives unannounced in the Bass; this card's four stages are where a newcomer first meets them, so its words say each in plain words. Triage, Claude's call, let stand by the owner in 1.20.0.

**Since then (2026-11-07, [250](./250-tidy-ups-after-1-26.md))**: of Next, Back and Close letting go of the Tour's Freeze, the browser spec keeps Close; the rest are the Shows' unit tests.
