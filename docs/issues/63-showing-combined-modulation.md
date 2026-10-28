# 63: Showing combined modulation on one control

**What to build:** From the owner's inbox line (2026-10-27): "Need to find a better way to represent the effect of the two LFOs when set on set knob and the combined effect of filter envelop with LFO." Today a modulated control has one ring (issue 20): the whole range its active sources reach right now, with a live dot, and hovering or focusing one source brightens only its share. With both LFOs on one Destination, or the Filter Envelope and an LFO on the Cutoff, the ring shows their sum but not who does what, nor how they move together over time.

**Blocked by:** none

**Status:** done (2026-10-28). The prototype was stopped (decided by the owner) and the owner's final design built straight on main.

## Decisions (grilling, 2026-10-27 and 2026-10-28, decided by the owner)

1. **Both:** the control shows who does what (each source's share at a glance, without hovering) and how they combine over time.
2. **Every ring-carrying knob:** one design for all of them (Cutoff, Resonance, both Pulse Widths, Osc 2 Semitone and Detune, Volume).
3. **A prototype first:** a throwaway branch with the candidates side by side, playing the Filter Envelope and both LFOs on the Cutoff.
4. **Who does what, two candidates:** (a) nested bands, one thin ring per source, its own reach from the knob's value in its own colour (Filter Envelope orange, LFO 1 blue, LFO 2 light blue), the outermost the combined range as today; (c) today's ring plus a small coloured tick at each source's furthest point. One ring cut into coloured segments is left out: overlapping sources cannot be split fairly.
5. **Over time, two candidates shown apart:** (a) a fading trail behind the dot on the ring, about the last second; (b) a trace in the Timeline for the knob pointed at or focused, beside the Effective Cutoff. Both together only if each earns its place.
6. **No layout moves:** the rings fit in the room each knob takes now; on small knobs the bands get thinner (about 1.5 px) instead of wider.
7. **Velocity and Key Track get no band:** fixed per Note, they stay folded into the combined ring, and hovering their knob still lights up their share.
8. **Hover singles a source out:** pointing at or focusing a source's control brightens its band or tick and dims the others.
9. **Reduced motion:** the trail goes, as the dot already does; the bands, ticks and Timeline trace stay.
10. **The Timeline follows the knob:** pointing at or focusing another modulated knob turns the right-hand scale to its unit and draws its trace instead of the Effective Cutoff; leaving it goes back to the Cutoff. The prototype tries Cutoff and Pulse Width.
11. **On touch:** the Timeline follows the last modulated knob touched or moved, until another.
12. **The prototype is the real app:** on a `prototype/` branch, a small switch bar at the top for bands, ticks, trail and Timeline trace, applied to every knob at once, with a patch preloaded that has the Filter Envelope and both LFOs on the Cutoff.

## Decisions (the prototype, 2026-10-28, decided by the owner)

The owner liked none of the first candidates: bands, ticks, the trail and the Timeline following a knob all went. What replaced them, on the prototype branch `prototype/combined-modulation` (kept as a primary source, never merged):

13. **One ring for both LFOs together**, from the knob's value, in the LFOs' blue.
14. **The Filter Envelope's own ring**, in orange, the outermost (first drawn inside the LFOs' ring in the Cutoff's light orange; the owner moved it out and to orange).
15. **Both LFOs the same blue**, LFO 1's: a must.
16. **The Timeline plots the LFOs added together** while both share a Destination, with an LFOs entry in blue in its key.
17. **Both rings thicker** than today's ring, touching.
18. **Last asked, not built:** the Filter Envelope's ring in white, on top of the knob's value arc, so the LFOs' ring is always the blue outer ring.

What came out of the prototype onto main, at the owner's word: the Timeline's Amp Envelope is the Envelope alone (no tremolo ripple), its key says Cutoff (not Effective Cutoff) and runs Filter Envelope, Cutoff, Amp Envelope, and the Filter Envelope shows only while its Amount is set. A Volume line was added and taken away again.

- [x] Grill: what the person should read off the control (each source's reach, their sum, their motion), where (the ring, the Timeline, the LFO plots), and on which controls
## Decisions (the final design, 2026-10-28, decided by the owner)

19. **Both LFOs the same blue**, LFO 1's, everywhere (their knobs, plots and rings).
20. **The blue outer ring is the LFOs' reach**, both together when both aim at one Parameter; 3.5 wide, so it reads as heavy as the white ring.
21. **The Filter Envelope's ring is white**, thin (2.5), drawn on the knob's own thick track, from the Cutoff to where the Envelope takes it.
22. **Pointing at an LFO's controls lights nothing** on the rings; the Filter Envelope's controls dim the blue ring, Velocity's and Key Track's light their share.
23. **The live dot rides a ring:** with neither ring (Velocity or Key Track alone moving the Cutoff, as in Tremolo Keys), no dot.
24. **The Timeline draws only what moves:** the Amp Envelope always (the Envelope alone, no tremolo ripple); the Filter Envelope while its Amount is set; the Cutoff while the Filter Envelope or an LFO moves it; each other Destination an active LFO moves, once, on its knob's scale, with the knob's setting faint and dashed. No text inside the plot but the Cutoff's scale.
25. **A moved Parameter's line is in its stage's colour**, broken: the Cutoff dotted, what LFO 1 moves dashed, what LFO 2 alone moves dash-dotted.
26. **The key** lists what LFO 1 moves, what LFO 2 moves, the Cutoff, the Filter Envelope, then the Amp Envelope, each swatch drawn as its line; "Env" on screen for Envelope, the whole word for a screen reader.

Claude's calls, open to the owner: the Pulse Width line follows Osc 1's Pulse Width (the LFO moves both); Velocity and Key Track alone don't bring the Cutoff line.

How it was built: `src/modulation/lfoTargets.ts` (what the active LFOs move, and where it is at a moment), `timelineShows` and `linePattern` in `src/viewers/timeline.ts` (the key reads the same), `engine.patchAt` for the Patch at each moment, the rings in `src/ui/modulationRing.tsx`. Tests: `lfoTargets.test.ts`, and the Timeline's and rings' e2e specs.

- [x] A prototype of the candidates, on its own branch (stopped by the owner)
- [x] Build the owner's final design
