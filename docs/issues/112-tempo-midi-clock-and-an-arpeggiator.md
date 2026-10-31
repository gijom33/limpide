# 112: A tempo and LFO sync

**What to build:** The owner's idea (inbox, 2026-10-30): "Add a tempo and midi sync. Tempo used by aroegiator and can be used to sync lfo rate and others." Claude's brainstorm of the same day had an arpeggiator too, "out of scope in the PRD, with the tempo it brings; the owner's call".

This reverses one thing in the PRD's Out of Scope: "LFO tempo sync: Limpide keeps no tempo to sync to … decided by the owner, issue 53, 2026-10-27". Building it means a new ADR and the PRD's scope amended. The arpeggiator stays out (decision 2).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 ([131](./131-v1.md), decision 5, the owner, 2026-10-31). Grilled with the owner on 2026-10-31 and cut in three: this issue the tempo and Sync; following MIDI clock in [136](./136-following-midi-clock.md), teaching it in [137](./137-teaching-tempo-sync.md), both blocked by this one.

## Agent Brief

**Category:** enhancement
**Summary:** The page keeps a tempo, set by hand or by tapping, and each LFO can sync its Rate to it in note values, its cycle locked to the beat.

**Current behavior:** Limpide keeps no tempo. Each LFO's Rate is in Hz only (0.05 to 20, log taper). The players (the Demo, the Song, the Tour, the Tutorials) each keep their own BPM, and the Demo track's LFO Rate moves are Hz worked out for its 128 BPM.

**Desired behavior:**
- **The tempo** is the page's, not the Patch's: one BPM from 40 to 240, 120 by default, remembered between visits like the display settings. A Patch never carries it.
- **Setting it:** in the header's set-up row at every width, a control reading "120 BPM", dragged or stepped with the arrows, a double-click to type it; a Tap button beside it from 861 px up that sets the BPM from the taps; on a phone, tapping the BPM opens a small field with Tap in it. The design audit has the last word on the layout. Hold's tapped rhythm stays apart from the tempo.
- **Sync:** each LFO gets a Sync switch beside Retrigger, an icon button of the same size and style with a note symbol, part of the Patch and off by default. With Sync on, the same Rate knob steps through note values, from 4 bars to 1/32, each straight, dotted and triplet; turning Sync off brings back the Hz it had.
- **The readout:** "4 bars", "2 bars", "1 bar", "1/2", "1/4", "1/8" … "1/32", dotted as "1/4 D", triplets as "1/4 T", with the Hz beside it in small type ("1/8 · 4 Hz"). The ring steps from value to value.
- **The phase:** a synced LFO with Retrigger free starts its cycle on a beat of the tempo, so a 1/4 lands on the beat; setting the tempo starts the beat count again. With Retrigger on, each Note restarts it as today. When the tempo changes, a synced LFO's Rate follows it at once.
- **The beat shown:** while an LFO is synced, its plot marks the beats, and the Envelope Timeline marks them while either LFO is synced.
- **The players:** while the Demo, the Song, the Tour or a Tutorial plays, the page's tempo is the player's own BPM, its beat count starting with the player, and the owner's BPM comes back when it stops. The Demo track's LFO Rate moves become note values with Sync on, sounding as they do now.
- **MIDI:** on the C16, bank D's buttons 8 and 9 switch Sync for LFO 1 and LFO 2, beside the Retrigger buttons; MIDI Learn can map the BPM to a knob and Tap to a button, and Sync like any switch.
- **Old Patches** and Share links without the new fields load with Sync off and sound as they did; a Share link carries Sync and the note value.
- **The record:** a new ADR on keeping a tempo, superseding issue 53's decision that Limpide keeps none, and the PRD's Out of Scope amended to match.

**Key interfaces:**
- The Patch: each LFO's Sync and note value
- The page's settings: the tempo
- The engine's LFO Rate and the Modulation model's LFO clock, which must agree on the phase
- The players' transport, which hands the tempo over while it plays
- The C16's layout and MIDI Learn's targets

**Acceptance criteria:**
- [ ] A unit test: each note value at a few BPMs gives the right Hz (1/8 at 120 BPM is 4 Hz; 1/4 D at 120 is 4/3 Hz; 1 bar at 60 is 0.25 Hz)
- [ ] An engine test: a synced free LFO's cycle starts on the beat, and the model's phase matches the sound's (the model-against-sound test) across a tempo change
- [ ] Turning Sync off and on keeps the Hz and the note value each had
- [ ] A Patch without the new fields loads with Sync off; a Share link carries Sync and the note value; the tempo is not in either
- [ ] The tempo is remembered after a reload; Tap sets it from four taps
- [ ] While the Demo plays, the BPM shows the track's; after it stops, the owner's comes back; the Demo sounds as it did
- [ ] The beat lines show on the LFO plot and the Timeline only while Sync is on
- [ ] The C16's buttons 8 and 9 on bank D switch Sync
- [ ] The design audit and the fit tests pass at every width; every test passes in Linux's fonts too

**Out of scope:**
- Following a MIDI clock ([136](./136-following-midi-clock.md))
- The tips beyond a first line each, the Maths Layer's conversion, the Tutorial Step and the Presets that get Sync ([137](./137-teaching-tempo-sync.md))
- An arpeggiator (decision 2), stereo, MPE

## Decisions (2026-10-30)

1. The tempo stays, to grill: a BPM for the page, MIDI clock sync, LFO Rates that can follow it. Decided by the owner.
2. No arpeggiator: "This won't help people understand how synths work. Also the Webapp will be ported to a VST/AU plugin in future and that will just be a synth." Decided by the owner; out of scope ([`.out-of-scope/arpeggiator.md`](../../.out-of-scope/arpeggiator.md)).

## Decisions (grilling, 2026-10-31, decided by the owner)

1. **The tempo is the page's,** outside the Patch, remembered between visits; a Patch saves only each LFO's Sync and note value. The plugin will do the same, the DAW owning the tempo.
2. **Each LFO has a Sync switch** beside Retrigger; with it on, the Rate knob steps through note values; off, it brings back the Hz it had.
3. **The note values:** 4 bars to 1/32, straight, dotted and triplet.
4. **A synced LFO's phase** is locked to the beat when Retrigger is free; a MIDI Start or setting the tempo starts the beat count again; with Retrigger on, each Note restarts it as today.
5. **A MIDI clock** from any input is followed on its own, smoothed over a few beats, with a "MIDI" mark; while it runs the BPM cannot be set by hand; when it stops, the last BPM stays. Built in [136](./136-following-midi-clock.md).
6. **By hand:** a BPM from 40 to 240, 120 by default, dragged or stepped, and a Tap button.
7. **The players** take the tempo over while they play, and the owner's comes back after; the Demo track's Rates become note values; Hold's tapped rhythm stays apart.
8. **The tempo sits in the header's set-up row** at every width, Tap beside it from 861 px, on a phone in a small field opened by the BPM; a "MIDI" mark while a clock runs; the design audit has the last word.
9. **The Sync switch** is an icon button beside Retrigger, same size and style, a note symbol, with a tip.
10. **The readout:** "4 bars" … "1/32", "1/4 D", "1/4 T", the Hz beside in small type; the ring steps.
11. **MIDI:** the C16's bank D buttons 8 and 9 switch Sync; MIDI Learn can map the BPM and Tap.
12. **The beat shown:** beat lines on the LFO plot, and on the Envelope Timeline, while an LFO is synced.
13. **A MIDI clock against a player:** the player keeps its own BPM while it plays and the clock is ignored until it stops. Built in [136](./136-following-midi-clock.md).
14. **Old Patches and links** load with Sync off; the Presets whose LFO is a rhythm get Sync on, chosen by profile 15 (in [137](./137-teaching-tempo-sync.md)).
15. **The learning layer:** tips for Sync, the BPM and Tap; the Maths Layer writes the conversion on the Rate ("1/8 at 120 BPM: 120 ÷ 60 × 2 = 4 Hz"); a Step in the Tutorial that teaches the LFO syncs the wobble to the beat; History's line goes to [134](./134-history-in-the-tooltips.md). Built in [137](./137-teaching-tempo-sync.md).
16. **Three slices:** this issue the tempo and Sync; [136](./136-following-midi-clock.md) following MIDI clock; [137](./137-teaching-tempo-sync.md) teaching it; both blocked by this one.

Claude's call, open to the owner: a player's beat count starts with the player, so its synced LFOs land on its first beat.
