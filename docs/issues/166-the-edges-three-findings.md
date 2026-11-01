# 166: The edges' three findings

**What to build:** Issue [116](./116-patches-at-the-edges.md)'s sweep of Patches at the edges (built on night/2026-10-31) found three faults it marks in its test, each left for the owner. The owner's answers, 2026-10-31 ("ok on all questions"), to fix all three. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** [116](./116-patches-at-the-edges.md), whose sweep marks these faults and turns green when they are fixed

**Status:** ready-for-agent · bug

## Decisions

Decided by the owner, 2026-10-31 (Claude's recommendations, accepted):

1. **Resonance never below its floor:** an LFO on Resonance cannot take the Filter's Q below its lowest setting, however it swings, in every Filter Mode. Talking Filter, whose band-pass now goes through everything for the low half of each LFO 2 cycle, is retuned so it still talks (its LFO settings), checked by profile 15; its sound changes, so the owner hears it before the release.
2. **The Cutoff's ends agree:** the sound's Effective Cutoff stops at 20 Hz and 20 kHz, as the model and the Response Curve already do, so a high-pass pushed past the top no longer plays silence the Curve does not show (ADR-0003).
3. **The Ideal's sidebands bounded:** under heavy FM the Ideal computes only sidebands below the top of hearing and above its quietest drawn level, with a hard cap of a few thousand, so the first frame after a Patch change stays within the draw budget; the Spectrum looks the same.

## Agent Brief

**Category:** bug
**Summary:** Fix the three faults issue 116's sweep found: Q below zero under an LFO, the Cutoff passing its range in the sound, and the Ideal's first frame under heavy FM.

**Current behavior:** (1) An LFO on Resonance in a band-pass or notch Mode swings Q below zero: a notch goes silent and a band-pass passes everything (Talking Filter plays the low half of each LFO 2 cycle unfiltered, +13 dB above 4 kHz). (2) The model holds the Effective Cutoff within 20 Hz–20 kHz while the engine's Filter goes past it. (3) With FM driving an Osc 1 richer than a Sine, the Ideal works out up to 17,000 sidebands and the first frame after a Patch change takes 17–80 ms.

**Desired behavior:** (1) Q stays at or above its floor under any modulation; Talking Filter is retuned to keep its character. (2) The engine clamps the Effective Cutoff to the model's range. (3) The Ideal's sidebands are bounded by audibility, its quietest drawn level and a cap, so the first frame keeps within three times Init's plus 1 ms. The sweep's marked expectations for these three become ordinary passing checks.

**Key interfaces:**
- The engine's Filter and how modulation reaches its Q and Cutoff
- The model's Effective Cutoff and Response Curve
- The Ideal Reference's FM sidebands
- The edge sweep's marked expectations; Talking Filter's Preset

**Acceptance criteria:**
- [ ] The sweep passes with the three faults' marks removed
- [ ] Talking Filter keeps its vowels (profile 15's check), and the owner has heard it
- [ ] The engine and model tests pass; the Spectrum's draw-cost test passes under heavy FM
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Other Presets' sounds
