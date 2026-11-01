# 134: History in the tooltips

**What to build:** From the v1 grilling ([131](./131-v1.md), decision 8, decided by the owner 2026-10-31): "with the math layer I am thinking of augmenting the tooltips with interesting geekiness, synth history, etc." With the Maths Layer on, each control's tooltip gains a line headed **History**: where the control comes from (the Moog ladder filter, the ADSR envelope's origins at Buchla and ARP, Ring Modulation in early electronic music), beside the Under the hood line of [133](./133-the-maths-layer-complete.md). PRD story 100.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 ([131](./131-v1.md), decision 8). Researched ([the findings](../research/134-history-in-the-tooltips.md)) and grilled with the owner, 2026-10-31.

## Decided already (the owner, 2026-10-31)

1. Two lines with the Maths Layer on: Under the hood (the formula, [133](./133-the-maths-layer-complete.md)) and History.
2. Every historical fact has its source written down in the repository, and the fact-checker checks the words before a release, as it checks the tips.
3. The words follow the glossary; on screen the line is headed History, never "geekiness".

## Decisions (grilling, 2026-10-31, decided by the owner)

Claude's recommendations, each accepted ("ok", "OK with all"), on the research's ten questions and four more:

4. **Which tips:** every control with a well-sourced line, about 25 (the research's drafts); tips with no musical past (Freeze, Snapshot, Theme, Demo, the C16's) get none.
5. **The bar for a fact:** A and B are used, a B worded as the maker's own claim; C facts are not used until their primary is found, or the line says less; U never.
6. **No "first"** unless the maker is quoted saying so; "carried", "named", "made famous" instead.
7. **Instruments and their labels:** a line may name products (Minimoog, Prophet-5, DX7, SH-101) and quote their labels in quotation marks ("Emphasis", "Amount of Contour", "Poly Mod"); the glossary's word stays the line's own.
8. **People** are named where a person made the difference, one or two a line at most.
9. **FM's line** says what Limpide does first (one oscillator bending another's pitch, as the Prophet-5's "Poly Mod" did, 1978) and the famous story second (Chowning's digital FM, 1973, the DX7).
10. **One sentence, about 160 characters at most;** on a phone it shows whole in the touch-and-hold tip.
11. **The Viewers:** the Spectrum and the Harmonic Markers get a line (Fourier, 1822; Cooley and Tukey's fast Fourier transform, 1965); the Scope none.
12. **The sources** stay in [the research file](../research/134-history-in-the-tooltips.md), linked from About's credits as "History's sources"; the fact-checker (profile 13) reads it before a release that changes a line.
13. **Attack, Decay, Sustain and Release** share one line, on the four stages; the Filter Envelope has its own.
14. **Lines on weak sources** (about 13 C facts: Ussachevsky, the SEM's date and Notch, the CS-80, the DX7's date…) are worded without them now; a later research pass may bring a fact back once its primary is found.
15. **The order in a tip,** with the Maths Layer on: its words, then Under the hood (133, when built), then History last.
16. **A test keeps every line sourced:** each line carries its sources' numbers from the research file (not shown); a unit test fails on a line with none, or with one graded below B.
17. **The owner reads every line** before the release, as for [129](./129-words-fun-to-read.md).

## Agent Brief

**Category:** enhancement
**Summary:** With the Maths Layer on, each control with a musical past shows a one-sentence History line in its tooltip, every fact sourced in the repository.

**Current behavior:** Tooltips say what a control does; the Maths Layer adds formulas in places but no history.

**Desired behavior:** With the Maths Layer on, about 25 controls' tips (and the Spectrum's and the Harmonic Markers') end with a line headed History: one sentence, about 160 characters at most, built from the research file's drafts under decisions 4 to 14, the glossary's words first, quoting old labels in quotation marks, naming people and instruments as the drafts do, saying nothing that rests below grade B. Attack, Decay, Sustain and Release share one line. Each line records its source numbers from the research file; a unit test checks every line has one graded A or B. About's credits link "History's sources" to the research file. With the Maths Layer off, tips are as now. The lines read whole on a phone.

**Key interfaces:**
- The tips (their data and how the Maths Layer extends them)
- The research file and its source numbers and grades
- About's credits
- CONTEXT.md, if History needs an entry

**Acceptance criteria:**
- [ ] With the Maths Layer on, each control the research drafts a well-sourced line for shows History last in its tip; off, nothing changes
- [ ] Every line is one sentence of at most about 160 characters, with no "first" unless quoted, and FM's line as decision 9 says
- [ ] A unit test: every History line names a source graded A or B in the research file
- [ ] About links "History's sources"
- [ ] On a 375 px phone a History line shows whole in the touch-and-hold tip
- [ ] The tooltip specs cover it; the fact-checker's pass before the release; the owner reads the lines
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Under the hood's formulas ([133](./133-the-maths-layer-complete.md))
- New research beyond the file (a later pass may add facts)

## What the research would gather

For each control and Section: who first built it or named it, when, on which instrument, and a source a reader can follow (a manufacturer's manual, a patent, a museum, a book or a paper), each claim marked with how sure it is.

## What a grilling would settle

- Which tips get a History line: every control, or the Sections and the famous ones (the Filter, the Envelopes, the LFO, Ring, FM, the Sub, Glide).
- How long a line may be, and how it reads on a phone.
- Where the sources live: a document in the repository, linked from the About.
