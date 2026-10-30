# 103: FM and Ring fold back at the top, and FM leaves a DC offset

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 2 and 14, [synth enthusiast](../reviews/2026-10-30/2-synth-enthusiast.md), [ear stand-in](../reviews/2026-10-30/14-ear-stand-in.md)).

- **FM folds back in the top octaves.** Nothing limits FM's swing near the top of what the browser can play, so its upper sidebands fold back into the audible range as partials that sweep the wrong way. A C6 saw: −50 dB between the Harmonics at FM 50 %, −36 dB at 100 %, against −101 dB without FM; a sine stays clean. Clang Alarm reaches −13 dB on C7 (−42 dB on C6), Breathing Bell −23 dB on C7 (its LFO glides the folded partials), FM Bell −28 dB on C7.
- **Ring Octave folds back at every pitch.** Two squares multiplied reach twice the top and fold: −41 dB between its Harmonics on C4, −28 dB on C7, against −91 dB for a plain square. Its words call it "a square again".
- **FM with Osc 2 on the Note leaves a DC offset.** One sideband lands at 0 Hz, and since 94 both cycles start together, so it is at its largest: FM Ladder's wave sits shifted by half its peak in the Scope (−19 dBFS of offset), FM Bass −24, FM Growl −32, a Tine Piano chord −34. Inaudible itself, it costs headroom and thumps a little at each start and stop.

**Blocked by:** none

**Status:** done (2026-10-30). High up, FM's depth shrinks on each Note as far as keeps its sidebands under the top of what the browser plays, Ring's two waves drop the Harmonics their product would fold, and each Voice's offset is taken out below 1 Hz, so FM Ladder's wave sits centred in the Scope. Not yet heard by the owner: the owner listens to the FM and Ring Presets high up before the release.

**Since then:** [108](./108-preset-claims-and-levels.md) (2026-10-30) changed FM Bell's, Kalimba's and Tine Piano's Filters and many Presets' Volume, so the levels and offsets measured below are 1.16.0's; FM Bell on C7 still folds back under −60 dB.

## Questions for the owner

1. **The DC offset:** take it out of each Voice (a very low filter, below anything heard), so the Scope centres FM Ladder's wave? Claude's recommendation: yes. It changes nothing you can hear.
2. **FM's fold-back:** shrink FM's depth as the Note climbs, only where its sidebands would pass the top, as [95](./95-smooth-oscillator-edges.md) tapers the waves' top Harmonics? Claude's recommendation: yes. High Notes on FM Presets get a little less bright, but lose the wrong-way sweeps; below C6 nothing changes.
3. **Ring's fold-back:** taper the two waves harder before they are multiplied, so their product stays under the top? Claude's recommendation: yes, while Ring is up only. Ring Octave becomes the clean square its words promise; Ring Sweep and Clang, meant to be inharmonic, change little.

Each change would be checked by rendering the Presets offline before and after, and the owner listens before the release.

## Decisions (triage, 2026-10-30, decided by the owner)

1. The DC offset comes out of each Voice, by a filter below anything heard.
2. FM's depth shrinks as the Note climbs, only where its sidebands would pass the top; below C6 nothing changes.
3. While Ring is up, the two waves are tapered harder before they are multiplied, so their product stays under the top.

## Agent Brief

**Category:** bug
**Summary:** FM and Ring stay clean up to the top octave, and FM's wave sits centred in the Scope.

**Current behavior:** as measured above (review 14's table gives each Preset's figures).

**Desired behavior:**
- **DC:** each Voice's output has no offset: FM Ladder's wave is centred in the Scope. The filter that removes it is far below the lowest Note (under 10 Hz) and changes no Preset's sound.
- **FM:** FM's depth is limited, per Note, to what keeps its sidebands under the top of what the browser plays; a Note low enough to need no limit is unchanged. The Ideal's sidebands follow the limited depth.
- **Ring:** while Ring is up, Osc 1 and Osc 2 drop the Harmonics whose products would pass the top, extending how [95](./95-smooth-oscillator-edges.md) tapers the waves; Osc 1 and Osc 2 heard through the Mixer alone keep their full waves.

**Key interfaces:**
- The engine's Voice output, FM's depth, Ring's waves
- The Ideal under FM and Ring

**Acceptance criteria:**
- [x] An offline render of FM Ladder finds its offset under −60 dBFS
- [x] Clang Alarm, Breathing Bell and FM Bell on C7 fold back under −60 dB (rendered at 48 kHz against 192 kHz, as review 14 measured)
- [x] Ring Octave between its Harmonics is under −60 dB on C4 and C6
- [x] Every Preset rendered on C4 changes by under 0.5 dB (above 20 Hz; see How it was built)
- [x] The Ideal's tests still match the sound within their tolerances
- [ ] The owner listens to the FM and Ring Presets high up before the release

**Out of scope:**
- The Presets' levels and words ([108](./108-preset-claims-and-levels.md))

## How it was built

**FM** (`src/music/idealReference.ts`, `fmDepthKept`): at FM's peak on a Note (the knob plus its LFOs' swing), the share of Osc 1's sound that lies past the top is worked out from the Bessel functions, Osc 1's fundamental swung by Osc 2's as Sines. Past −65 dB, the depth shrinks (halving the gap) until it is under; the knob's gain and the LFOs' swings shrink together, so an LFO's motion keeps its shape. The engine applies it where FM's gain is set with each Note and its Glide (`tuneCross` in `src/engine/synthEngine.ts`); the Ideal draws the same kept depth at the Viewers' fundamental (`idealFmKept`; the Viewer settings' `ideal` is now a function of the fundamental and the sample rate, kept per Patch to a thousandth of the depth).

**Ring** (`harmonicsOn` and `nextWave` in the engine): while Ring is up, each Note restarts Osc 1 and Osc 2 on waves cut to the Harmonics whose sums stay under the top: a Sine keeps its own pitch, and two richer waves share the top evenly, each keeping at least its first Harmonic. The cut is for the Note's pitch at its start (a legato Note or a Glide keeps it). The waves are shared by every Voice, the 32 most recent kept.

**Offset**: a second-order high-pass at 1 Hz after the Mixer, before the Oscillator Tap, so every Viewer is centred.

**Measured** with review 14's method (offline, velocity 1, the Note held; fold-back as the energy past 24 kHz at 192 kHz against below), before → after:

| | before | after |
|---|---|---|
| Clang Alarm, C6 / C7 | −42.7 / −13.3 dB | −74.7 / −73.8 dB |
| Breathing Bell, C6 / C7 | −80.6 / −23.5 dB | −84.2 / −76.3 dB |
| FM Bell, C6 / C7 | −111.3 / −29.7 dB | −111.3 / −64.7 dB |
| Glass Shimmer, Machine Chatter, Zap Pluck, Kalimba, C7 | −53.7, −51.7, −59.3, −74.1 dB | −104.5, −81.3, −84.2, −86.1 dB |
| Ring Octave between its Harmonics (48 kHz), C4 / C6 / C7 | −40.6 / −34.5 / −28.3 dB | −92.2 / −93.9 / −91.8 dB |
| FM Ladder's offset (mean over the Gate's first second), C2 / C4 / C6 | −25.3 / −25.1 / −24.3 dBFS | −69.4 / −66.9 / −66.8 dBFS |
| FM Bass, FM Growl, Tine Piano offset on C4 | −36.9, −29.9, −39.7 dBFS | −72.8, −73.6, −66.3 dBFS |

Every Preset on C4, loudest 100 ms: above 20 Hz, none moves by more than 0.03 dB (Clang). Counting everything, FM Ladder falls 0.73 dB, Pink Surf 0.72 and Tine Piano 0.32: all of it below 20 Hz, FM Ladder's and Tine Piano's the offset itself, Pink Surf's its Pink Noise's slow drift.

**Tests:** `src/engine/synthEngine.browser.test.ts`, "FM and Ring under the top, and no offset (issue 103)": the three Presets on C7 at 192 kHz, a plain Saw as the control, the Ideal at the kept depth against the sound at the Oscillator Tap on C7, FM Ladder's offset and centred Oscillator Tap, Ring Octave on C4 and C6, and a Saw keeping its 15th Harmonic through the Mixer with Ring down and dropping it with Ring up. All but the control failed on the engine before this change. `src/music/idealReference.test.ts` checks where each FM Preset starts to be limited, that Clang Alarm on C7 keeps just enough, the LFO's swing counted, 192 kHz the same as 48 kHz, and the Ideal at a kept depth; `src/viewers/viewerStore.test.ts`, that the Viewers' Ideal follows the Note. `measure.ts` gains `energyAboveDb`. Whole Vitest suite: 860 passed. Playwright not run in this lane.

**Calls made (Claude's call, open to the owner):**

1. Decision 2's "below C6 nothing changes" does not hold for three Presets whose sidebands already pass the top lower down: Clang Alarm is limited from F♯5 (before, −54 dB on A5 and −45 dB on B5), Breathing Bell from A♯5 and Glass Shimmer from B5, by little there. Every other FM Preset keeps its whole depth below C6 (FM Bell from E6, Zap Pluck from E6, Kalimba from A♯6), and every Preset on C4.
2. On C7 the limit takes most of FM away where the Notes were mostly fold-back: Clang Alarm keeps 7.5 % of its depth, Breathing Bell 12.5 %, Glass Shimmer 15 %, FM Bell 25 %. They become nearly pure sines up there.
3. The top is the browser's Nyquist frequency but never above 24 kHz, so a 96 or 192 kHz device plays what a 48 kHz one does; a 44.1 kHz device keeps a little less.
4. The limit is worked out for Sines, which every FM Preset uses. FM on a Saw or a Square still folds as review 2 measured (about −50 dB on a C6 Saw, −51 already on C4): the browser plays each of their Harmonics up to its own limit, and a depth small enough to keep those under the top would take FM away on every Note. Osc 2's own pitch moves (its Env Amount, an LFO on Osc 2 Pitch) and the bend wheel are not counted.
5. Ring's cut applies to Osc 1 and Osc 2 wherever they are heard while Ring is up (on C4, Ring Lead's Saw beside a Sine loses only what lies past 23 kHz); "heard through the Mixer alone" was read as Ring down. Osc 2's Env Amount is not counted, so Ring Sweep's strike can still fold for its first moments.
6. The high-pass sits at 1 Hz rather than near 10 Hz: the offset is steady from Note to Note, so it settles once per Patch, and 5 Hz already bent a 110 Hz saw's ramps by 10 % in the Scope (1 Hz: about 2 %).

**Found:** high up, the sound's FM is a little deeper than the Ideal's: the browser sums Osc 1's swing sample by sample, which with Osc 2 at 7.5 kHz (FM Bell's on C7) swings it about 4 % further. Its second sidebands sound 0.7 dB louder than drawn; the new test allows 1 dB there.

