# 225: Words and docs after 1.22 and 1.23

**What to build:** From the inbox (2026-11-02 and 2026-11-03): what the 1.22.0 ripple hunt and fact-check, the 1.22.0 code review and the 1.23.0 fact-check left for triage. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Claude's calls, open to the owner (2026-11-03, triage):

1. **ADR-0007's line on Cycle Lock in a chord** is mended by a new ADR that supersedes that part of it, as accepted ADRs change only in their Status line; it records 180's decision 7 (a chord locks to its newest Note).
2. **A slow Rate's figure keeps its digits:** under 0.1 Hz the tip shows enough to tell 0.0417 from 0.04 Hz, wherever the same formatter would else read wrong; the readouts that read "0.05 Hz" stay as they are.
3. **FM's History date follows its sources:** if S33 and S15 disagree (1974 against 1975), the line says what both support, or the year the stronger source gives, with the research notes saying why.

## Agent Brief

**Category:** enhancement
**Summary:** A handful of words, docs, test names and one ADR still say what the last two releases made untrue, and one tip hides its figure.

**Current behavior:**
- ADR-0007 says the Amp Scope "cannot Cycle Lock during a chord"; a chord now locks to its newest Note (180, decision 7).
- Perfect Fifth's description says "Set the Scope to 2 or 4 cycles to see it lock"; 1 cycle now holds too, showing half the pattern.
- Five engine test names say Cycle Lock but test the held fundamental, which Cycle Lock no longer reads.
- A mascot spec's name says Bead is over no label while surfing, where bead.md lets it pass over text and the test checks only where it rests.
- The PRD's list of the renderers' state lacks Glow's kept traces.
- Glow's tip says it fades "over a few frames": 15 at 60 Hz.
- The Display tooltip's View group leaves out Viewers follow.
- 180's first box is ticked though FM, Ring, the triad and the Amp Tap stay at 124–136 % against its 10 % (its call 1, merged at the owner's word): the box should say so.
- A synced Rate's tip at 40 BPM reads "4 bars is 0.04 Hz" where it is 0.0417 Hz, a cycle every 24.0 s.
- FM's History line cites S33, which dates Yamaha's licence to 1974, against the line's 1975.

**Desired behavior:** each of these says what is true now, checked against the code or the sound; the ADR superseded by a new one.

**Key interfaces:**
- The ADRs, the PRD, the Presets' descriptions, the tips, the History lines and their research notes
- Test names in the engine and mascot specs
- The frequency formatter

**Acceptance criteria:**
- [ ] A new ADR supersedes ADR-0007's chord line, ADR-0007's Status line pointing to it
- [ ] Each item above reworded, renamed or mended
- [ ] The slow Rate's tip reads its figure to three significant digits, a test with 40 BPM and 4 bars
- [ ] The words test and every renamed test pass

**Out of scope:**
- New words or tips
