# 159: The Guides and a trace beyond them

**What to build:** The owner's bug (inbox, 2026-10-31), with a screenshot of the night branch's Oscillator and Filter Scopes, both Oscillators up and the Resonance at Q 1.32: "Wave goes outside of guides with resonance or simply by adding oscillators." A bug of v1's polish ([131](./131-v1.md)).

What the Guides are: dashed lines at the Nominal Level, one Oscillator's peak (0.5, −6 dB below full scale, CONTEXT.md), on every Scope. Their tip says: "A trace inside them has only lost energy; one beyond them has been boosted by Resonance." Beyond them with Resonance is as designed (the headroom is there for it). Beyond them with two sources up is not Resonance: the Mixer adds the sources, so Osc 1 and Osc 2 at full reach about twice one Oscillator's peak, and the tip's "boosted by Resonance" is then untrue. The Oscillator Scope, which shows the Mixer's output before any Filter, goes beyond the Guides too, where nothing has been boosted at all.

**Blocked by:** none

**Status:** ready-for-agent · bug

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
- [ ] One Oscillator at full: the Guides where they are today
- [ ] Osc 1 and Osc 2 at full, Resonance at 0: the Oscillator and Filter Scopes' traces inside their Guides (an engine or viewer test, with the overshoot's allowance)
- [ ] The same with Resonance up: the Filter Scope's trace beyond them
- [ ] The Guides capped at full scale; never at zero
- [ ] The tip and CONTEXT.md updated; every test passes in Linux's fonts too

**Out of scope:**
- Any change to a sound or the Mixer's levels

## Questions for the owner

1. **Answered (2026-10-31): (a).** **What should the Guides mark?**
   - (a) **The level the Mixer sends:** the Guides move with the Mixer, at the sum of the sources' levels (one Oscillator at full: where they are now; both at full: twice as far out, up to full scale). On the Oscillator Scope the trace then stays inside them; on the Filter and Amp Scopes only Resonance takes it beyond, as the tip says. The tip's words stay true.
   - (b) **One Oscillator, as now:** the Guides stay put and the tip changes to say what is true: "Dashed lines at one Oscillator's full level. Two sources together go beyond them, and so does a trace boosted by Resonance."

   Claude's recommendation: (a). The Guides then answer the question a learner asks on the Filter Scope (did the Filter boost anything?), and the Oscillator Scope shows the Mixer's sum filling its Guides. (b) is the smaller change but leaves "beyond the Guides" meaning two different things.
