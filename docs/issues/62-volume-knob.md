# 62: A Volume knob in the Amp

**What to build:** From the owner (2026-10-27): "Couldn't we have a volume button knob in the amp section? Wouldn't it also help visualize the tremolo effect?"

**Blocked by:** none

**Status:** done (2026-10-27)

## Decisions (grilling, 2026-10-27, decided by the owner)

1. **Where:** right of the Amp's Envelope faders (the owner's own placement: there is room), a big knob, played live.
2. **Range:** 0 to 100 %, default 100 % for Init and every Preset, so nothing sounds different; in dB with Maths on.
3. **Its ring:** an LFO on Volume draws its reach on it, from Volume × (1 − Depth) up to Volume, with a live dot.
4. **Where it acts:** after the Amp Envelope, before the Amp Tap ([ADR-0011](../adr/0011-the-amp-tap-after-volume.md)).

- [x] `volume` in the Patch (`level`, default 1), the model's `effectiveVolume`, its ring's `volumeReach`; tests
- [x] The engine: the tremolo's per-Voice gain rests at the knob's level, each LFO's swing scaled with it; an engine test (the sound and the Amp Tap halve at 50 %, the Filter Tap does not)
- [x] The knob, its tooltip, its ring, dB in the Maths layer, a Quick Setup step after the Amp Envelope
- [x] CONTEXT.md, the PRD, ADR-0011
