# 112: A tempo and LFO sync

**What to build:** The owner's idea (inbox, 2026-10-30): "Add a tempo and midi sync. Tempo used by aroegiator and can be used to sync lfo rate and others." Claude's brainstorm of the same day had an arpeggiator too, "out of scope in the PRD, with the tempo it brings; the owner's call".

This reverses one thing in the PRD's Out of Scope: "LFO tempo sync: Limpide keeps no tempo to sync to … decided by the owner, issue 53, 2026-10-27". Building it means a new ADR and the PRD's scope amended. The arpeggiator stays out (decision 2).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-10-31) on night/2026-10-31, for the owner to try. In v1 ([131](./131-v1.md), decision 5, the owner, 2026-10-31). Grilled with the owner on 2026-10-31 and cut in three: this issue the tempo and Sync; following MIDI clock in [136](./136-following-midi-clock.md), teaching it in [137](./137-teaching-tempo-sync.md), both blocked by this one.

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
- **MIDI:** on the C16, bank D's R2 and R4 buttons (toggles) switch Sync for LFO 1 and LFO 2, each beside its LFO's Retrigger on R1 and R3 ([145](./145-the-c16-layout-strip-by-strip.md)'s layout, which keeps those places for them); the printable C16 card shows them. MIDI Learn can map the BPM to a knob and Tap to a button, and Sync like any switch.
- **Old Patches** and Share links without the new fields load with Sync off and sound as they did; a Share link carries Sync and the note value.
- **The record:** a new ADR on keeping a tempo, superseding issue 53's decision that Limpide keeps none, and the PRD's Out of Scope amended to match.

**Key interfaces:**
- The Patch: each LFO's Sync and note value
- The page's settings: the tempo
- The engine's LFO Rate and the Modulation model's LFO clock, which must agree on the phase
- The players' transport, which hands the tempo over while it plays
- The C16's layout and MIDI Learn's targets

**Acceptance criteria:**
- [x] A unit test: each note value at a few BPMs gives the right Hz (1/8 at 120 BPM is 4 Hz; 1/4 D at 120 is 4/3 Hz; 1 bar at 60 is 0.25 Hz)
- [x] An engine test: a synced free LFO's cycle starts on the beat, and the model's phase matches the sound's (the model-against-sound test) across a tempo change
- [x] Turning Sync off and on keeps the Hz and the note value each had
- [x] A Patch without the new fields loads with Sync off; a Share link carries Sync and the note value; the tempo is not in either
- [x] The tempo is remembered after a reload; Tap sets it from four taps
- [x] While the Demo plays, the BPM shows the track's; after it stops, the owner's comes back; the Demo sounds as it did
- [x] The beat lines show on the LFO plot and the Timeline only while Sync is on
- [x] The C16's R2 and R4 on bank D switch Sync, and the C16 card shows them
- [ ] The design audit and the fit tests pass at every width; every test passes in Linux's fonts too

**Out of scope:**
- Following a MIDI clock ([136](./136-following-midi-clock.md))
- The tips beyond a first line each, the Maths Layer's conversion, the Tutorial Step and the Presets that get Sync ([137](./137-teaching-tempo-sync.md))
- An arpeggiator (decision 2), stereo, MPE

## Decisions (2026-10-30)

1. The tempo stays, to grill: a BPM for the page, MIDI clock sync, LFO Rates that can follow it. Decided by the owner.
2. No arpeggiator: "This won't help people understand how synths work. Also the Webapp will be ported to a VST/AU plugin in future and that will just be a synth." Decided by the owner; out of scope ([`.out-of-scope/arpeggiator.md`](../../.out-of-scope/arpeggiator.md)).

**Since then (2026-10-31, issue 145):** the C16's Sync buttons are bank D's R2 and R4, not buttons 8 and 9: the new layout puts each LFO's Retrigger and Sync side by side on the R row. Decided by the owner.

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

**Since then (2026-11-01, [issue 176](./176-a-synced-rate-shows-its-note-value-alone.md)):** decision 10's Hz beside the note value is gone: a synced Rate reads its note value alone, at one width, so the knobs no longer shift; the Hz is in the Rate's tip. Decided by the owner.

## How it was built (2026-10-31, on night/2026-10-31)

**What was built:**
- **The tempo:** one BPM for the page (40 to 240, 120 by default), kept between visits as the Display is, never in a Patch, a Share link or a Patch file. A store built once in the audio session hands every change to the engine; setting it starts the beat count again.
- **In the header,** beside Hold in the set-up row: "120 BPM", dragged up or down (a BPM a pixel), stepped with the arrows (Shift or Page Up/Down by ten, Home and End to the ends), typed after a double-click or Enter; Tap beside it from 861 px. Below 861 px the BPM is a button ("120" over "BPM") that opens a small field with the BPM and Tap in it. Tap follows the last four taps from the second, the beat landing on the last.
- **Sync:** a note-symbol switch beside each LFO's Retrigger, in the Patch, off by default. On, the Rate knob turns the note value (4 bars to 1/32, straight, D and T, 24 in all, slowest first), reading "1/8 · 4 Hz"; off, the Hz it had comes back. Each is kept apart (`lfoNote`, `lfo2Note`).
- **The phase:** a synced LFO with Retrigger free starts its cycle on the beat, at its Waveform's start, in the sound and the Modulation model alike; the engine locks it again whenever the tempo, the note value, the Waveform or Sync changes. With Retrigger on, each Note restarts it, at the note value's Hz. Engine tests compare the model with the sound across a tempo change.
- **The beats shown:** broken lines on a synced LFO's plot, and on the Timeline while either LFO is synced.
- **The players:** the Demo, the Song, the Tour's and a Tutorial's Listen hand their BPM over, counted from their first Note; the BPM reads theirs and cannot be set meanwhile; the person's comes back when they stop. The Demo's Rates that jump on bar lines (Tremolo Keys, Wobble, Double Wobble) are now note values with Sync on, at the Hz they had at 128 BPM.
- **MIDI:** bank D's R2 and R4 on the C16 switch each LFO's Sync (toggles), and the C16 card (and its PDF) shows them; a C16 set up with issue 145's layout gains them once, where its own Mappings leave them free. MIDI Learn maps the BPM to a knob and Tap to a button; a control mapped to an LFO's Rate turns its note value while Sync is on.
- **The record:** ADR-0018 supersedes issue 53's decision; the PRD (a story, an implementation line, Out of Scope), CONTEXT.md (Tempo, Tap, Sync), issues 53 and 145 and the tips follow.

**Claude's calls, open to the owner:**
1. **The header's room.** The set-up row had none to spare from 861 to 1365 px: there Hold, MIDI, Display and About show their icons alone (their tooltips name them; they keep their words from 1366 px, Demo, Tutorial and Song from 1100 px as before); from 861 to 1099 px the BPM shows its number alone; from 1200 to 1365 px the piano's keys are 42 px, so the piano stays at the centre in Linux's wider fonts (measured with Verdana standing in for them). In 2 × 2 each LFO's plot takes what its knobs leave, as on a phone, and the narrowest 2 × 2 windows (601 to 680 px) pad the header's buttons 2 px.
2. **The small field below 861 px** is on tablets (2 × 2) as well as phones, since Tap is beside the BPM from 861 px only.
3. **A drag sets the tempo where it is let go,** the BPM shown as it goes: setting the tempo starts the beat count again, so set at every pixel it restarted a synced LFO's cycle at every pixel. The arrows and a knob mapped to the BPM still set it at each step, each restarting the beat.
4. **The Demo's sweeps stay in Hz** (the Strings' shimmer, the riser's tremble): they pass through the Hz between note values. Tremolo Keys' LFO, free, now lands on the beat; its Hz is as before.
5. **Tap joins Quick Setup** after the Preset arrows, as an Action; the BPM is left to MIDI Learn, as the other set-once settings are.
6. **A Relative knob on a stepped control** gathers its clicks into whole steps, a step for every two clicks at most: before, a Relative knob on an Octave or a Semitone never moved (each 1 % rounded back), and a note value would not have either.
7. **A player's beat count starts with the player** (already in the Decisions), its first Note on a beat.

**Tests:** tsc, the lint and every Vitest test (1218) pass; the whole Playwright suite in Chromium and WebKit passed but for About's word (fixed) and three WebKit tests that passed when run again alone (the mascot's two, Velocity's ring: the machine's load).

**Not verified here:** "every test passes in Linux's fonts too" (the layouts were measured with Verdana as the stand-in; the branch run on GitHub will say).

**To try in the app:**
- Turn up LFO 1's Depth on the Cutoff, switch on Sync (the note beside Retrigger): the Rate reads "1/4 · 2 Hz"; turn it, then turn Sync off and on: each keeps its value. Watch the beat lines on its plot and the Timeline.
- Drag the BPM up and down, type one, tap Tap four times in time; a synced LFO follows at once. Reload: the BPM stays.
- Play the Demo: the BPM reads 128, greyed; the wobble and the tremolo keys should sound as before. Stop it: your BPM is back.
- On the C16 (after plugging it in once): bank D's R2 and R4 switch Sync; the card in the MIDI panel shows them.
- Try the header at 861, 1100, 1280 and 1366 px, and on a phone (the BPM opens its field).
