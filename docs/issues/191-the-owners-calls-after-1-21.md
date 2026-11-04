# 191: The owner's calls after 1.21

**What to build:** Nothing yet: the questions the 1.20.0 and 1.21.0 code reviews, word checks and ear checks left for the owner (inbox, 2026-11-01 and 2026-11-02), each with Claude's recommendation, for one grilling. Each answer goes into the issue it names, or becomes one.

**Blocked by:** none

**Status:** needs-info · enhancement. Waiting on the owner's answers

## Decisions

Decided by the owner, 2026-11-03, one question at a time (each carried into the issue it names once all are answered):

1. **Bead and the Display panel: kept as built** ("Keep"). Calls 2, 3 and 4 of 151 stand as the owner's change to its decisions 6 and 7.
2. **Bead in a Tutorial or the Tour: kept still** ("Keep it still"). Its dancing and sound-driven hops pause too, for the whole Tutorial or Tour, beyond 151's decision 9, so its movement there means "look here".
3. **A MIDI Start and a synced LFO: the pull accepted** ("Accept the pull"). A synced free LFO is pulled onto the beat over two cycles (ADR-0019), with no click on a held Note; 136's box is reworded to say so.
4. **Aftertouch on the ring: the dot alone** ("Keep the dot"), as 132's call 2 built it; no arc of its own.
5. **Volume's Depth readout: the one-sided dip** ("Keep the dip"), as "−6.0 dB"; 169's box is reworded from ±dB.
6. **The DX7 in FM's History line: kept, its source found** ("Keep, find source"). The line stays (134, decision 9); the primary source, Yamaha's own DX7 documents, is found in [194](./194-words-that-lag-the-code.md), to meet 134's decision 5.
7. **Short forms: "Key" and "Vel" added** ("Add Key and Vel"). Key Track and Velocity take them where 156 measures the room short; the header keeps 154's fixed widths, its own rule. To build.
8. **The calls beyond the Briefs: all accepted** ("Accept all"): 154's lower Sections and 8 px shorter Viewers for Bead; 137's Step counted only on a stepped knob's exact target, its Presets picked by Claude and its Step made two; 139's card placed again on a new Tutorial and a stored bend range outside 2, 7 and 12 loaded as 2.
9. **A button learned on a Switch: each press flips it** ("Each press flips"), a momentary button or a toggle alike, for LFO Sync, Legato and Retrigger. Not built in 186 (out of its scope there); to build.
10. **Bead in About: always shown while its switch is on** ("Always show it"), as built: on a newcomer's welcome, and after B, E, A, D sent it away for the visit. 163 stands over 150's decision 2 there.
11. **The BPM's keys: as every knob's** ("Yes"). The arrows move 1 BPM, Shift+arrow a tenth, Page Up and Down 10; the tempo's tip gets the steps line every knob has. To build.
12. **"Tap" with two meanings: "Tap Tempo" off screen** ("Yes"). The button keeps its word "Tap" on screen; in the glossary, the code and the tips it is "Tap Tempo", the Taps staying the listening points. To build.
13. **Aftertouch on the Resonance: half the knob's range** ("Half the range"), so full pressure on Wobble does not self-oscillate past the limiter's knee; the stepping is [219](./219-aftertouch-glides.md)'s. To build.

## Questions

1. **Bead and the Display panel (151, decision 7, the owner's).** Bead is drawn under the panels, so with Display open it stays beside the Display button and looks at the option, never going to it (call 2); a control scrolled off the window sends it back to its edge, against decision 6 (call 3); on a phone and at 2 × 2 the Display button is out of reach (call 4). Recommendation: keep all three as built, recorded as the owner's change to decisions 6 and 7.
2. **Bead's dancing in a Tutorial (151, decision 9).** Dancing and sound-driven hops stop for the whole Tutorial or Tour, where decision 9 paused only tricks, visits and dozing. Recommendation: keep the pause, so Bead's movement means "look here".
3. **A MIDI Start and a synced LFO (136).** Its ticked box says a synced free LFO starts its cycle on a Start; under ADR-0019 it is pulled onto the beat over two cycles, about a second at 120 BPM. Recommendation: accept the pull (no click on a held Note) and reword the box.
4. **Aftertouch on the ring (132, call 2).** Only the knob's dot moves; no arc of its own. Recommendation: keep the dot alone.
5. **Volume's Depth readout (169, call 1).** It reads a one-sided dip ("−6.0 dB"), not ±dB as its box says, since Volume only goes down from the knob. Recommendation: keep, reword the box.
6. **The DX7 in FM's History line (134, decisions 5 and 9, both the owner's).** Decision 9 names it; decision 5 keeps out facts graded C until a primary is found, and the research grades it C. Recommendation: keep the line and find the primary source (Yamaha's own DX7 documents) in [194](./194-words-that-lag-the-code.md).
7. **Short forms (156 and 154).** Key Track and Velocity got none (decision 2 named them); 156 picks forms by measuring the room while 154 sets the header's words at fixed widths. Recommendation: add "Key" and "Vel" where measured short; keep 154's widths as the header's own rule.
8. **Calls beyond the Briefs.** 154 lowers the Sections and shortens the Viewers 8 px from 861 px wide and 700 px tall, for Bead; 137 counts a stepped knob's Step only on its exact target; 137's Presets were picked by Claude, not by profile 15, and its Tutorial Step became two; 139 re-places a Tutorial card when its Tutorial changes and loads a stored bend range outside 2, 7 and 12 as 2. Recommendation: accept all.
9. **A button learned on a Switch (LFO Sync, Legato, Retrigger).** It never switches it today: Learn reads its 127 and 0 as a knob's. Recommendation: each press flips the Switch, whether the button is momentary or a toggle, built in [186](./186-midi-learn-reads-modes-right.md).
10. **Bead in About on a newcomer's welcome (163 against 150's decision 2), and after B, E, A, D.** About shows Bead whenever its switch is on, so the welcome carries it; and it shows after the Notes sent Bead away for the visit. Recommendation: keep it on the welcome (beside the name, covering nothing), but hide it in About for a visit the Notes sent it away.
11. **The BPM's keys (112 and 160).** Shift+arrow moves the BPM 10, while 160 made Shift the fine step everywhere else; the tempo's tip has no steps line. Recommendation: the arrows 1 BPM, Shift+arrow a tenth, Page Up and Down 10, and the steps line in its tip, as every knob has.
12. **"Tap" with two meanings (112 against the glossary).** It names the tempo's button and the listening points (the Oscillator, Filter and Amp Taps). Recommendation: the button keeps its word "Tap" on screen; in the glossary, code and tips it is "Tap Tempo".
13. **Aftertouch on the Resonance (132; the 1.21.0 ear check).** At full pressure Wobble self-oscillates, 8 dB louder, past the limiter's knee. Recommendation: on the Resonance, aftertouch reaches half the knob's range; the stepping is fixed in [183](./183-fewer-writes-per-change.md).

The owner's note on hearing the night's sounds (2026-11-01: "I do not like Talking filter but that's okay") asks nothing: Talking Filter stays as it is.
