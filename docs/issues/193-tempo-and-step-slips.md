# 193: Tempo and step slips

**What to build:** The 1.20.0 code review's findings on the tempo, LFO Sync and the steps (inbox, 2026-11-01): a Relative knob moves the BPM 2 a click, so from an even BPM it never reaches an odd one; a C16 knob mapped by Learn or Quick Setup takes a fast turn's 66 as 2 steps, not a third; thirds of a step gathered on the Hz before Sync came on are still there when it goes off; the beat lines show with Retrigger on Note, where the cycle follows the Notes; the Wobble Tutorial's "Set LFO 1's Rate to 3 Hz" cannot be done once Sync is on; a synced Rate's Hz reads "2 Hz" where unsynced it reads "2.00 Hz". A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, released in 1.23.0; tried by the owner: "All good."

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the inbox's lines of the 1.20.0 and 1.21.0 reviews and checks.

## Agent Brief

**Category:** bug
**Summary:** Six small slips in how the tempo, a synced Rate and Relative steps behave.

**Current behavior:** A Relative knob moves the BPM 2 a click (the least travel a click is 1 % of 200 BPM), and a test named "a BPM a step" asserts 2. A C16 knob mapped through Learn or Quick Setup reads its fast-turn step from the Mapping's tag, so a fast 66 is 2 steps. Thirds of a step gathered before Sync came on remain after it goes off, so the first 66 can jump a step. The LFO plot and the Timeline draw beat lines whenever Sync is on, Retrigger on Note included. In the Wobble Tutorial, the 3 Hz Step cannot be made once the person switches Sync on, the knob then turning the note value. A synced Rate's Hz reads "2 Hz" (tip, spoken value, plot label) where unsynced it reads "2.00 Hz".

**Desired behavior:** A Relative click moves the BPM 1. A C16 knob's fast turn counts a third whatever made its Mapping (read from the input it came from). Gathered thirds are cleared when Sync changes. Beat lines show only when the cycle follows the beat (Sync on, Retrigger free). The Wobble Tutorial's Step is made either way, or turns Sync off first. A Rate's Hz reads the same, synced or not.

**Key interfaces:**
- The control surface's Relative steps and fast-turn thirds
- The tempo's step
- The LFO plot's and the Timeline's beat marks
- The Wobble Tutorial's Steps
- The Rate's readout

**Acceptance criteria:**
- [ ] Unit tests for each of the six
- [ ] The midiLearn, c16 and tutorial specs pass; every test passes in Linux's fonts too

**Out of scope:**
- The BPM's keyboard steps (issue 191, question 11)

## How it was built

Built 2026-11-02, test-first, each of the six slips with a unit test:

1. **The BPM a click:** a knob mapped to the tempo now steps it like a Grid, a BPM a Relative click (a C16's 66 a third of one), so 121 is reached from 120. The test once named "a BPM a step" now asserts it.
2. **A C16's fast turn, whoever mapped it:** the third is read from the Controller the message came from, not the Mapping's tag, so a C16 knob learned by MIDI Learn or Quick Setup counts a 66 as a third, as its layout's knobs do.
3. **Thirds forgotten when Sync changes:** whenever an LFO's Sync changes (a click, a Controller, a Preset, a Tutorial), what the knobs mapped to its Rate had gathered towards a step starts afresh.
4. **Beat lines only on the beat:** the LFO plot and the Envelope Timeline mark the beats only while an LFO is synced with Retrigger off. The two tips and CONTEXT.md say so, and issue 112 has a dated line.
5. **The Wobble's 3 Hz:** a Tutorial's Rate Step not yet made switches Sync to suit as its card comes up, off for the Hz and on for a note value, so the Rate knob turns what the Step asks. "Do it for me" does the same.
6. **The Hz alike:** a synced Rate's Hz reads as the Rate in Hz does ("1/4, 2.00 Hz") in its tip, its spoken value and the plot's label.

Claude's calls, open to the owner:

- The Synth Geek Layer's conversion keeps its three figures ("120 ÷ 60 × 1 = 2 Hz", "= 0.0625 Hz"), being a calculation, so a synced Rate's tip reads "1/4 is 2.00 Hz" above a formula ending "= 2 Hz". The readout's two decimals turn the slowest values coarse: 4 bars at 120 BPM reads "0.13 Hz", where it read "0.125 Hz".
- The Tutorial switches Sync as the Rate Step's card comes up, not while it is showing: Sync switched on by hand on that card leaves the knob on the note values until "Do it for me", or Back and Next.
- A note-value Step (the Wobble's 1/4 T) switches Sync on the same way, if it was switched off before its card.

What to try in the app:

- With a Relative knob mapped to the BPM (MIDI Learn), turn it slowly: one BPM a click, odd BPMs too. On the C16, map a knob by Quick Setup and turn it fast: it moves a third as briskly as its slow turn's steps, as its layout's knobs do.
- On a C16 knob on LFO 1's Rate, turn fast a little, switch Sync on and off, turn fast again: no jump of a step at the first click.
- Switch LFO 1's Sync on: beat lines on its plot and the Timeline; switch Retrigger on: they go.
- Start the Wobble Tutorial, switch LFO 1's Sync on before the 3 Hz Step, then go to it: Sync goes off and the knob turns the Hz.
- Hover a synced Rate: "At 120 BPM, 1/4 is 2.00 Hz."
- Every test passing in Linux's fonts is for GitHub's run to show: none of the changed checks measures text.

