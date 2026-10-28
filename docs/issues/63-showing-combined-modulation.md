# 63: Showing combined modulation on one control

**What to build:** From the owner's inbox line (2026-10-27): "Need to find a better way to represent the effect of the two LFOs when set on set knob and the combined effect of filter envelop with LFO." Today a modulated control has one ring (issue 20): the whole range its active sources reach right now, with a live dot, and hovering or focusing one source brightens only its share. With both LFOs on one Destination, or the Filter Envelope and an LFO on the Cutoff, the ring shows their sum but not who does what, nor how they move together over time.

**Blocked by:** none

**Status:** to grill. The answer is something to see, so the grilling will likely want a prototype (stacked rings, split arcs, a trace over time) before a choice; Claude's call, open to the owner.

- [ ] Grill: what the person should read off the control (each source's reach, their sum, their motion), where (the ring, the Timeline, the LFO plots), and on which controls
- [ ] A prototype of the candidates, on its own branch
- [ ] Build the one chosen
