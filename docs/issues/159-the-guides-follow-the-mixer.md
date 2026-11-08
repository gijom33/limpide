# 159: The Guides and a trace beyond them

**What to build:** The owner's bug (inbox, 2026-10-31), with a screenshot of the night branch's Oscillator and Filter Scopes, both Oscillators up and the Resonance at Q 1.32: "Wave goes outside of guides with resonance or simply by adding oscillators." A bug of v1's polish ([131](./131-v1.md)).

What the Guides are: dashed lines at the Nominal Level, one Oscillator's peak (0.5, −6 dB below full scale, CONTEXT.md), on every Scope. Their tip says: "A trace inside them has only lost energy; one beyond them has been boosted by Resonance." Beyond them with Resonance is as designed (the headroom is there for it). Beyond them with two sources up is not Resonance: the Mixer adds the sources, so Osc 1 and Osc 2 at full reach about twice one Oscillator's peak, and the tip's "boosted by Resonance" is then untrue. The Oscillator Scope, which shows the Mixer's output before any Filter, goes beyond the Guides too, where nothing has been boosted at all.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-10-31) on night/2026-10-31 and released; tried by the owner: "Looks good."

## Decisions

1. **The Guides follow the Mixer:** they mark the level the Mixer sends, the sum of its sources' levels, so only Resonance takes a trace beyond them. Decided by the owner, 2026-10-31 ("Yes, follow the Mixer"), on question 1 below.

Claude's call, open to the owner:

2. **The sum:** every source the Mixer has (Osc 1, Osc 2, Ring, the Sub, the Noise) at its fader's level, added, and never beyond full scale. One Oscillator at full gives today's Guides; nothing up leaves them at the Nominal Level, not at zero, so they never vanish.
3. **The Amp Scope** keeps whatever rule it has today relative to the Volume, with the Mixer's sum in place of one Oscillator's level.
4. **They move smoothly** with a fader, as a value does, and stand still with reduced motion asked for (they jump).
5. **The words:** the tip keeps "a trace inside them has only lost energy; one beyond them has been boosted by Resonance", now true, and adds that they sit at what the Mixer sends; CONTEXT.md's Nominal Level says the Guides mark the Mixer's level, the Nominal Level being where one Oscillator puts them.

## Agent Brief

**Category:** bug
**Summary:** The Scopes' Guides mark one Oscillator's level, so two sources together go beyond them and the tip blames Resonance; the Guides move to the Mixer's summed level.

**Current behavior:** Every Scope's Guides stand at the Nominal Level (0.5), one Oscillator's peak. With two or more sources up, the Mixer's sum goes beyond them on the Oscillator Scope and on the Filter and Amp Scopes, with no Resonance, and the tip says a trace beyond them has been boosted by Resonance.

**Desired behavior:** The Guides stand at the sum of the Mixer's sources' levels (decision 2), capped at full scale, on every Scope (the Amp's as decision 3 says), moving with the faders. On the Oscillator Scope the trace stays inside them (but for the band-limited waves' small overshoot at their edges, which the tests allow for); on the Filter Scope a trace beyond them means Resonance. The tip and CONTEXT.md say so.

**Key interfaces:**
- The Scope Viewers' Guides and where their level comes from
- The Mixer's levels in the Patch
- The Guides' tip and CONTEXT.md's Nominal Level

**Acceptance criteria:**
- [x] One Oscillator at full: the Guides where they are today
- [x] Osc 1 and Osc 2 at full, Resonance at 0: the Oscillator and Filter Scopes' traces inside their Guides (an engine or viewer test, with the overshoot's allowance)
- [x] The same with Resonance up: the Filter Scope's trace beyond them
- [x] The Guides capped at full scale; never at zero
- [ ] ~~The tip and CONTEXT.md updated; every test passes in Linux's fonts too (the words updated; Linux's fonts are for GitHub's run, not run here)~~ (not checked at the time)

**Out of scope:**
- Any change to a sound or the Mixer's levels

## How it was built (2026-10-31, on night/2026-10-31)

**What was built:**
- **The Guides' level** (`src/viewers/guides.ts`): the Mixer's five levels added, each scaled by the Nominal Level as the engine scales it, up to full scale; the Nominal Level with nothing up. The Viewer settings store works it out from the Patch on every change, as it does the Ideal Reference. The Mixer's five levels are listed once in the Patch, for the Guides and Quick Setup.
- **Pink Noise at its own peak.** Pink Noise is kept at white's RMS, so its loop peaks near 2.2, more than twice an Oscillator's. Counted at its fader alone, it took the Oscillator Scope's trace beyond the Guides with no Resonance (found by the code review). The Guides count the Noise at its colour's peak (white 1, pink 2.2); the sound is unchanged.
- **Every Scope** draws its Guides there and glides them to a new level (a 35 ms time constant, there in about a fifth of a second); with reduced motion asked for they jump. While frozen they hold the level of the frozen trace, as the Note does.
- **The words:** the tip now says the Guides stand at the level the Mixer sends and move with its faders, and keeps the Resonance sentence. CONTEXT.md's Nominal Level is where one Oscillator puts the Guides, and the Guides have their own entry.
- **Tests:** the store's level (one Oscillator, two, every source, pink Noise, the cap, nothing up); the glide; the engine's Oscillator and Filter Taps inside the Guides with Osc 1 and Osc 2 at full and no Resonance (saw, square and triangle, three Cutoffs, both Slopes, detuned or not: at most 7 % past, the allowance 15 %); white and pink Noise with the Sub inside them; the Filter Tap 2.6 times beyond them at full Resonance; an end-to-end check that Osc 2's fader moves every Scope's Guides from 0.5 to full scale; the tip's words. `npx tsc`, the lint, every unit test, the engine browser tests and the Playwright specs touched (overlays, tooltips, Quick Setup, LIMITING) pass. One full engine run failed one test and passed whole on the rerun: a load flake.

**Claude's calls, open to the owner:**
1. **Decisions 2 to 5 as written**, with the Noise at its peak (above): a fader barely up puts the Guides close to the centre line, and the last step down to nothing sends them back out to the Nominal Level.
2. **Capped at full scale,** so three or more sources at full can still go beyond them on the Oscillator Scope; there the margin beyond full scale shows how far.
3. **The Amp Scope** follows the same level, the Volume ignored as before (decision 3). A chord, on the Amp Tap's every-Voice source, still goes beyond them: the Guides are one Voice's, as they were.
4. **The glide's speed,** 35 ms, quick enough to follow a drag.

**What to try:** switch the Guides on (Display), hold a Note and raise Osc 2's fader: the Guides glide out to full scale and the Oscillator Scope's trace fills them without crossing. Turn up Resonance: only the Filter Scope's trace goes beyond. Try the Noise on pink, and a fader barely up.

## Questions for the owner

1. **Answered (2026-10-31): (a).** **What should the Guides mark?**
   - (a) **The level the Mixer sends:** the Guides move with the Mixer, at the sum of the sources' levels (one Oscillator at full: where they are now; both at full: twice as far out, up to full scale). On the Oscillator Scope the trace then stays inside them; on the Filter and Amp Scopes only Resonance takes it beyond, as the tip says. The tip's words stay true.
   - (b) **One Oscillator, as now:** the Guides stay put and the tip changes to say what is true: "Dashed lines at one Oscillator's full level. Two sources together go beyond them, and so does a trace boosted by Resonance."

   Claude's recommendation: (a). The Guides then answer the question a learner asks on the Filter Scope (did the Filter boost anything?), and the Oscillator Scope shows the Mixer's sum filling its Guides. (b) is the smaller change but leaves "beyond the Guides" meaning two different things.
