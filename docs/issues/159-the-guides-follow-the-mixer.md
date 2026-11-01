# 159: The Guides and a trace beyond them

**What to build:** The owner's bug (inbox, 2026-10-31), with a screenshot of the night branch's Oscillator and Filter Scopes, both Oscillators up and the Resonance at Q 1.32: "Wave goes outside of guides with resonance or simply by adding oscillators." A bug of v1's polish ([131](./131-v1.md)).

What the Guides are: dashed lines at the Nominal Level, one Oscillator's peak (0.5, −6 dB below full scale, CONTEXT.md), on every Scope. Their tip says: "A trace inside them has only lost energy; one beyond them has been boosted by Resonance." Beyond them with Resonance is as designed (the headroom is there for it). Beyond them with two sources up is not Resonance: the Mixer adds the sources, so Osc 1 and Osc 2 at full reach about twice one Oscillator's peak, and the tip's "boosted by Resonance" is then untrue. The Oscillator Scope, which shows the Mixer's output before any Filter, goes beyond the Guides too, where nothing has been boosted at all.

**Blocked by:** the owner's answer below

**Status:** needs-info · bug

## Questions for the owner

1. **What should the Guides mark?**
   - (a) **The level the Mixer sends:** the Guides move with the Mixer, at the sum of the sources' levels (one Oscillator at full: where they are now; both at full: twice as far out, up to full scale). On the Oscillator Scope the trace then stays inside them; on the Filter and Amp Scopes only Resonance takes it beyond, as the tip says. The tip's words stay true.
   - (b) **One Oscillator, as now:** the Guides stay put and the tip changes to say what is true: "Dashed lines at one Oscillator's full level. Two sources together go beyond them, and so does a trace boosted by Resonance."

   Claude's recommendation: (a). The Guides then answer the question a learner asks on the Filter Scope (did the Filter boost anything?), and the Oscillator Scope shows the Mixer's sum filling its Guides. (b) is the smaller change but leaves "beyond the Guides" meaning two different things.
