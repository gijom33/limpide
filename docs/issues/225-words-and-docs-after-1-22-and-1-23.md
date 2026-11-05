# 225: Words and docs after 1.22 and 1.23

**What to build:** From the inbox (2026-11-02 and 2026-11-03): what the 1.22.0 ripple hunt and fact-check, the 1.22.0 code review and the 1.23.0 fact-check left for triage. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-03) on night/2026-11-03, for the owner to try

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
- [x] A new ADR supersedes ADR-0007's chord line, ADR-0007's Status line pointing to it
- [x] Each item above reworded, renamed or mended
- [x] The slow Rate's tip reads its figure to three significant digits, a test with 40 BPM and 4 bars
- [x] The words test and every renamed test pass

**Out of scope:**
- New words or tips

## How it was built

On the night branch, each item checked against the code as it stands there:

- **ADR-0022** supersedes ADR-0007's line that the Amp Scope cannot Cycle Lock during a chord: it locks to the newest Note, as 180's decision 7 says. ADR-0007's Status line reads "accepted; superseded in part by ADR-0022".
- **The slow Rate's figure:** a tip now reads a frequency under 0.1 Hz to three significant figures, trailing zeros dropped: at 40 BPM, "4 bars is 0.0417 Hz" (a test, with 120 BPM's "0.13 Hz" kept). The free Rate's tip under the hood used the same formatter and read "T = 1 / 0.05 Hz = 18.6 s" at 0.0537 Hz; it now reads "0.0537 Hz" (a test). The knob readouts, the Rate's "spoken" value and the synced readout keep two decimals; 0.05 Hz still reads "0.05 Hz".
- **Perfect Fifth:** "The Scope holds it still at any cycles: 1 shows half the pattern, 2 or 4 show it whole."
- **Glow:** "fade over a quarter of a second (15 frames at 60 a second)", in the tip, `CONTEXT.md` and the setting's comment.
- **The Display tooltip** lists "which Voices the Viewers follow" after Snapshot, in the panel's order.
- **The PRD's renderers' state** names Glow's kept traces.
- **Test names:** seven engine tests, not five, said Cycle Lock while testing `fundamental()`, the held fundamental the Scope's window, its period readout and the Harmonic Markers read; all seven now say "the held fundamental". The one that tests `fundamentalAt()`, which Cycle Lock reads, keeps its name. The mascot Demo test now says it checks where Bead rests, surfing free to pass over text.
- **180's first box** stays ticked and now gives the figures: FM at 1.414, Ring at 2.38 and the triad at 136 %, 130 % and 67 % on the Amp Tap against the 10 %, merged at the owner's word.
- **FM's History** keeps 1975 (decision 3: the stronger source's year): the archive's dated list of the signing (S15, A) against Yamaha's remembrance counting back "seven years" (S33, B). The research notes say why; the line still cites S33 for the DX7.

Claude's calls, open to the owner:

1. The three-figure reading also applies to the free Rate's period tip, as decision 2 asks "wherever the same formatter would else read wrong"; trailing zeros dropped, so 0.05 Hz stays "0.05 Hz" and not "0.0500 Hz".
2. Seven test names renamed where the inbox counted five: the two more (Glide, the Sub's Mix) tested the held fundamental too.
3. ADR-0022 is credited to the owner's decision in 180, its recording to Claude.

To look at: the Rate's tip with Sync on at 40 BPM and 4 bars; Perfect Fifth's description; the Glow and Display tips; ADR-0022.

Tests: `npx tsc`, `npm run lint`, the words, tips, music, Presets and engine unit tests (549 passed, the seven renamed among them), and in Chromium the mascot and Display panel specs touched (32 passed, the renamed Demo test among them).
