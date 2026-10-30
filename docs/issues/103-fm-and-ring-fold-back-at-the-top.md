# 103: FM and Ring fold back at the top, and FM leaves a DC offset

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 2 and 14, [synth enthusiast](../reviews/2026-10-30/2-synth-enthusiast.md), [ear stand-in](../reviews/2026-10-30/14-ear-stand-in.md)).

- **FM folds back in the top octaves.** Nothing limits FM's swing near the top of what the browser can play, so its upper sidebands fold back into the audible range as partials that sweep the wrong way. A C6 saw: −50 dB between the Harmonics at FM 50 %, −36 dB at 100 %, against −101 dB without FM; a sine stays clean. Clang Alarm reaches −13 dB on C7 (−42 dB on C6), Breathing Bell −23 dB on C7 (its LFO glides the folded partials), FM Bell −28 dB on C7.
- **Ring Octave folds back at every pitch.** Two squares multiplied reach twice the top and fold: −41 dB between its Harmonics on C4, −28 dB on C7, against −91 dB for a plain square. Its words call it "a square again".
- **FM with Osc 2 on the Note leaves a DC offset.** One sideband lands at 0 Hz, and since 94 both cycles start together, so it is at its largest: FM Ladder's wave sits shifted by half its peak in the Scope (−19 dBFS of offset), FM Bass −24, FM Growl −32, a Tine Piano chord −34. Inaudible itself, it costs headroom and thumps a little at each start and stop.

**Blocked by:** none

**Status:** needs-triage · bug. Questions for the owner below.

## Questions for the owner

1. **The DC offset:** take it out of each Voice (a very low filter, below anything heard), so the Scope centres FM Ladder's wave? Claude's recommendation: yes. It changes nothing you can hear.
2. **FM's fold-back:** shrink FM's depth as the Note climbs, only where its sidebands would pass the top, as [95](./95-smooth-oscillator-edges.md) tapers the waves' top Harmonics? Claude's recommendation: yes. High Notes on FM Presets get a little less bright, but lose the wrong-way sweeps; below C6 nothing changes.
3. **Ring's fold-back:** taper the two waves harder before they are multiplied, so their product stays under the top? Claude's recommendation: yes, while Ring is up only. Ring Octave becomes the clean square its words promise; Ring Sweep and Clang, meant to be inharmonic, change little.

Each change would be checked by rendering the Presets offline before and after, and the owner listens before the release.
