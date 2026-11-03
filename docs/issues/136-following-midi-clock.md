# 136: Following a MIDI clock

**What to build:** The second slice of [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (grilling, 2026-10-31, decisions 4, 5 and 13, decided by the owner): the page's tempo follows a MIDI keyboard's or DAW's clock when one sends it, as a plugin follows its host.

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md)

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try. In v1 ([131](./131-v1.md)).

## Agent Brief

**Category:** enhancement
**Summary:** When any connected MIDI input sends a clock, the page's tempo follows it, smoothed, and a MIDI Start starts the beat count again.

**Current behavior:** the MIDI parser skips real-time bytes (the clock, Start, Stop, keep-alive); the tempo is set only by hand or by Tap (issue 112).

**Desired behavior:**
- A clock (24 ticks a beat) from any connected input sets the page's BPM, smoothed over a few beats so the readout does not flicker.
- While the clock runs, the BPM shows a "MIDI" mark and cannot be set by hand or by Tap; its tip says why.
- When the clock stops (no tick for a while), the last BPM stays and is the owner's again to change.
- A MIDI Start starts the beat count again, so the synced LFOs with Retrigger free start their cycles together with the DAW; a Continue does not.
- While the Demo, the Song, the Tour or a Tutorial plays, the player keeps its own BPM and the clock is ignored until the player stops; then the clock's tempo comes back.

**Key interfaces:**
- The MIDI parser's real-time messages
- The page's tempo and its beat count (issue 112)
- The players' hold on the tempo (issue 112)

**Acceptance criteria:**
- [x] A unit test: ticks at 120 BPM with a little jitter give a steady 120; a change to 90 is followed within a few beats
- [x] The parser yields clock, Start, Continue and Stop without breaking running status
- [x] While a clock runs, the BPM cannot be changed by hand and shows the mark; after it stops, it can
- [x] A Start resets the beat count; a synced free LFO starts its cycle on it
  **Since then (2026-11-02, issue [194](./194-words-that-lag-the-code.md)):** under [ADR-0019](../adr/0019-a-synced-lfo-is-pulled-onto-the-beat.md) a synced free LFO is pulled onto the new beat over two cycles, not started on it; the box's rewording waits on the owner's answer to question 3 of [191](./191-the-owners-calls-after-1-21.md).
- [x] While the Demo plays, a running clock does not change its tempo
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Sending a clock (no MIDI output, PRD)
- Song Position Pointer

## How it was built (2026-11-01, on night/2026-11-01)

**What was built:**
- **The parser** reads the clock, Start, Continue and Stop wherever they fall, even inside another message or a system-exclusive dump, running status untouched; keep-alive and the rest are still skipped. The clock goes to the tempo, not to the Activity Monitor or the Controllers' Mappings.
- **Following the clock:** the time between ticks is fitted by least squares over the last four beats, so a little jitter never reaches the readout; the BPM is whole, 40 to 240, and moves only once the clock is more than three quarters of a BPM off it, so a clock between two whole BPMs holds one. A change of tempo is followed within four beats, the readout passing straight from one to the other.

  **Since then (2026-11-02, [issue 185](./185-midi-faults-real-rigs-send.md)):** a lost or doubled tick is counted as the clock meant it rather than read as a tempo change, a jump to another tempo is read afresh from its own ticks so the readout passes straight from one to the other (until then it passed through readings in between), and the beats are placed where the output is heard, its latency allowed for.
- **The beats are the clock's:** counted from the first tick heard, or from the first after a MIDI Start; on each of the clock's beats the engine's beat count is set again so that beat falls on it (only when it has moved by 4 ms or more), so a synced LFO stays with the DAW even where the clock runs a little off a whole BPM. A Start counts them again, and a synced free LFO is pulled onto its first beat over two cycles, as ADR-0019 has every new beat count. Between a Stop and a Continue the count stands still, whether or not the clock goes on ticking.
- **While it runs,** the BPM reads "120 MIDI" ("MIDI" in the unit's place), its edge in the MIDI button's green, and cannot be dragged, stepped, typed or tapped; its tip says why. A second without a tick and the clock has stopped: its last BPM stays, remembered, the owner's to change.
- **The players:** while the Demo, the Song, the Tour or a Tutorial plays, it keeps its own BPM and the clock is followed unseen; when it stops, the clock's tempo is back on the clock's beats (or, if the clock stopped meanwhile, its last BPM).
- **The record:** CONTEXT.md's Tempo, a PRD story (103) and its implementation line.
- **A slip found after the build:** the players' browser test (`usePlayers`) still expected the tempo without its new `midi` field; it now expects `midi: false` while a player holds the tempo and after it stops, as no clock runs there. The code is unchanged: the field belongs in the tempo, which the BPM's mark reads. The file passes (6 tests).

**Claude's calls, open to the owner:**
1. **The mark** is the word "MIDI" in place of "BPM" and the box's edge in the MIDI button's connected green. From 861 to 1099 px, where the BPM shows its number alone, only the edge shows: the word there took 25 px from the keyboard, the piano's keys falling from 27.6 to 24.8 px at 861 px with Verdana standing in for Linux's fonts (measured before building).

   **Since then (2026-11-01, [issue 154](./154-the-headers-buttons-in-order.md)):** the BPM shows its number alone up to 1279 px, where Hold, MIDI and Display show their icons alone too; there only the edge marks the clock. Claude's call, open to the owner.
2. **The BPM stays whole** while a clock sets it, as the page's always is; the beat count is set again on the clock's beats, so the LFOs keep to the clock rather than to the rounded BPM.
3. **Four beats** of ticks for the fit, a first BPM after one; three quarters of a BPM before the readout moves.
4. **A second without a tick** is a stopped clock (at 40 BPM a tick comes every 63 ms); a Stop alone does not end it, since many clocks tick on while stopped.
5. **One clock at a time:** the first input to tick is followed until its ticks stop; another's are ignored meanwhile.
6. **Tap** is disabled too while a clock runs, its tip unchanged; the BPM's beside it says why.
7. **MIDI is connected as before:** a clock is followed once the MIDI panel has been opened, or the browser allowed MIDI on an earlier visit (issue 46).

**Tests:** tsc, the lint, the unit tests of the parser, the clock, the inputs and the tempo, the engine's browser tests (one new: a beat count started a moment ago, as a Start's), and in Chromium and WebKit the specs of the tempo, the clock (new, `midiClock.spec.ts`: the mark, the hand locked out and back, the Demo, the fit at five widths, the mark's contrast in both themes), the header, MIDI, Quick Setup, the C16 card, the piano, the design principles and the tooltips.

**Not verified here:** "every test passes in Linux's fonts too" (the branch run on GitHub will say); a real DAW's or keyboard's clock (the tests send a stand-in's, its ticks stamped exactly).

**To try in the app:**
- Open the MIDI panel with a DAW sending MIDI clock to the browser (in Logic or Ableton, MIDI clock out to an IAC bus) and press play: the BPM reads the DAW's, "MIDI" in place of "BPM", its edge green; it cannot be dragged or typed, and its tip says why.
- Sync an LFO on the Cutoff at 1/4 with Retrigger off, and listen against the DAW's beat; change the DAW's tempo: the readout follows within four beats without flickering.
- Stop the DAW and start it from the top: the LFO comes onto its first beat within two cycles. Stop and continue: it carries on.
- Stop the clock altogether: a second later the BPM is yours again, at the clock's last tempo.
- Play the Demo while the clock runs: it keeps 128; stop it and the clock's tempo is back.
- Try the header at 861, 1000 and 1100 px, and on a phone, while a clock runs.
