# 166: The edges' three findings

**What to build:** Issue [116](./116-patches-at-the-edges.md)'s sweep of Patches at the edges (built on night/2026-10-31) found three faults it marks in its test, each left for the owner. The owner's answers, 2026-10-31 ("ok on all questions"), to fix all three. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** [116](./116-patches-at-the-edges.md), whose sweep marks these faults and turns green when they are fixed

**Status:** done (2026-11-02). Built (2026-10-31) on night/2026-10-31 and released; tried by the owner: "Talking filter alternate a voicy sound and a bip: That's wrong." Talking Filter's sound went to [205](./205-talking-filter-talks.md); its other two findings (the Cutoff's ends, the first frame under FM) stand

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
- [x] The sweep passes with the three faults' marks removed
- [ ] ~~Talking Filter keeps its vowels (profile 15's check), and the owner has heard it~~ (not checked at the time)
- [x] The engine and model tests pass; the Spectrum's draw-cost test passes under heavy FM
- [ ] ~~Every test passes in Linux's fonts too~~ (not checked at the time)

**Out of scope:**
- Other Presets' sounds

## How it was built

**1. Resonance never below its floor.** The sound now moves each Filter stage's Q along the curve the model's Resonance takes, not along a straight line between the swing's ends. Both LFOs' swings of the Resonance meet in one WaveShaper whose curve (`qSwing` in `filterDesign.ts`) turns the swing into what it adds to the Q; it is worked out again only when the Filter Mode, the Slope, the Resonance or the LFOs' Depths change. (Since [219](./219-aftertouch-glides.md), the curve is `resonanceCurve`, over the Resonance itself, and is made again only when the Mode or the Slope changes.) A low-pass's or high-pass's Q is in dB, already a straight line, so those sound exactly as before (Resonance Swell and Breathing Pad included). A band-pass's or notch's Q now runs from 0.5 to 20 and no further: a notch never goes silent, a band-pass never lets everything through.

**2. The Cutoff's ends agree.** Each Filter stage now sits at 20 Hz, and its detune carries the cents above it: the knob's Cutoff, the Filter Envelope, Velocity, Key Track and both LFOs, summed, then held between 20 Hz and 20 kHz by a three-point WaveShaper whose corners lie on its points, so it is exact. A high-pass pushed past the top passes what is above 20 kHz, as the Response Curve draws, instead of nothing.

**3. The Ideal's sidebands bounded.** The Viewers ask the Ideal for FM's and Ring's partials only up to the Harmonic that reaches 20 kHz, the top of the Spectrum, from the Note's fundamental. Under FM it then keeps the 1,024 loudest sidebands, worked out from at most four times as many, Osc 1's Harmonics taken from the lowest up; with Osc 2 a whole number of octaves off Osc 1, its cycle is worked out from at most 32,768 samples. The heaviest Ideal timed tonight now takes 3 to 6 ms in Chromium; the worst took 350 ms on C4 before (a square swung hard by a Sine three octaves under it, which its Filter Envelope lowers further). Every Preset with FM or Ring draws the same below 20 kHz on C2 to C7, to a thousandth of each level.

**The sweep's marks, now ordinary checks:** the band-pass test passes without `it.fails`; the answer "finding (issue 116)" is gone; the notch's silence control takes a notch's Q below zero by hand, and a new check has the LFO'd notch sounding; the frame test answers no slow frame, and draws four more Patches of heavy FM (the owner's "triangle swung by a Sine three octaves up" among them). A test helper had told the limiter's curve from the others by its shape, which the new Resonance curve shares; it now knows the limiter's curve itself (`SAFETY_CURVE`).

**Talking Filter, retuned:** Resonance 0.6 → 0.45, LFO 2's Depth 0.6 → 0.45, Volume 0.7 → 0.9. LFO 2's square now takes the band from its widest (Resonance 0, Q 0.5) to narrow (0.9, Q 14, as narrow as its top was before): two vowels, a wide "ah" and a narrow "oo", by turns, each swept by LFO 1 an octave either way. Before, the low half was the saw unfiltered. The Volume keeps its level: its loudest 100 ms is −21.7 dBFS on C4 (−21.8 before; −23.9 at the old Volume). A test holds it: both halves sweep with LFO 1, the wide one 16 dB louder than the narrow one, and the wide one 16 dB short of the open saw above 4 kHz. *(2026-11-02: retuned again by [205](./205-talking-filter-talks.md), the owner hearing the narrow half as a beep: LFO 2 a triangle gliding the Q between 0.72 and 4.5, and its test changed with it.)*

### Calls made (Claude's call, open to the owner)

- **Talking Filter's retune,** above: the narrow half kept where it was, the wide half the widest a band-pass goes, the nearest to the unfiltered half it had. Its Resonance knob and Volume changed with its LFO 2 Depth, so it keeps its level.
- **The cap: 1,024 sidebands,** a thousand rather than "a few thousand". At 4,096 four Patches still drew their first frame over the budget when the frame test ran alone (10.4 to 14 ms against 10.3). At 2,048 it passed alone three times, but in the whole engine run, other files rendering beside it, one frame took 10.2 ms against 10.0. At 1,024 the whole run passes. A Spectrum has room for a few hundred marks, so a Patch past the cap still shows a dense band of them.
- **The top is the Spectrum's, 20 kHz,** rounded up to a whole Harmonic, so Notes whose top falls on the same Harmonic share an Ideal; below about E2 every Note keeps all 256.
- **Only FM and Ring are bounded.** The plain series stay at their 256 Harmonics: they cost little, and their levels depend on how many are counted.
- **Each Ideal mark's precision at the top:** with fewer Harmonics asked for, FM's and Ring's cycles are worked out from fewer samples, which moves a level by up to a thousandth (Poly Mod Zap's carrier on C4: 0.5020 against 0.5017), far below what a mark shows.
- **`IDEAL_HARMONICS` is no longer exported:** the sweep needed it only to answer the slow frames.
- **Heavy FM past the cap draws fewer marks than it did:** what the decision's "the Spectrum looks the same" holds for is every Preset (checked on C2 to C7, Gate on and off, by the code review too: no mark added or lost below 20 kHz, levels within 0.02 dB). A Patch past the cap loses some: on C4, a square swung by a Sine three octaves under it drew marks up to 20 kHz and now stops near 13 kHz, where its cycle's samples run out.
- **The Cutoff clamp reaches a few Presets' top Notes:** on C7, the Envelope or Key Track of 13 low-pass Presets (Piano, Honky-Tonk and Pick Pluck among them) took the Cutoff to 60 to 70 kHz, past what the browser plays; it now stops at 20 kHz, as the Curve draws, and their top Harmonics lose about 0.2 to 3 dB. It comes with decision 2; nothing tests it by ear.
- **A knob turned with an LFO on Resonance:** the Resonance curve is swapped at once, each Voice's own Q at the moment scheduled for it; the code review notes that for a render quantum (under 3 ms) the two may not yet match, which on a jump of the knob could take a band-pass's Q briefly under its floor. Not reproduced; both take effect at the same moment in practice, as every other change of a Patch does.
- **The sweep still does not judge silence with the Filter at an end:** there a high-pass at 20 kHz passes only what is above hearing, silent to its check; the new engine test holds the ends instead.

### What to try and hear

- **Talking Filter (needs your ears):** hold C4. It should alternate every 0.7 s between a wide, open vowel and a narrow, whistling one, each wobbling at 2.5 Hz. Before, one half was the plain saw. Profile 15's check is the morning's.
- **A notch or band-pass with an LFO on Resonance at full:** the notch should never drop out, the band-pass never jump to the full saw.
- **Heavy FM:** FM at full on a triangle or pulse Osc 1, Osc 2 a Sine three octaves up (and detuned); turn a knob and watch the Viewers keep up. Try it on C2 too.
- **A high-pass at 20 kHz with the Filter Envelope up:** no difference to hear, but the Response Curve and the sound now agree.

### Run

All green. `npx tsc` and `npm run lint` clean. Unit suite: 841 passed. The engine project (the engine's, the Presets' and the sweep's browser tests): 443 passed in 227 s. The sweep: 13 renders answered for the limiter (by design), offset judged on 322, silence not judged on 392 with the Filter closed at an end (the sweep's Patches have changed since issue 116's counts, with Legato). Playwright, Chromium: overlays, demo, maths, patches, lfoDestination, modulationRing, filterMode and limiting, 75 passed. Not checked: WebKit, and Linux's fonts (GitHub runs both).
