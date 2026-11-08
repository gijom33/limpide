# 134: History in the tooltips

**What to build:** From the v1 grilling ([131](./131-v1.md), decision 8, decided by the owner 2026-10-31): "with the math layer I am thinking of augmenting the tooltips with interesting geekiness, synth history, etc." With the Synth Geek Layer on, each control's tooltip gains a line headed **History**: where the control comes from (the Moog ladder filter, the ADSR envelope's origins at Buchla and ARP, Ring Modulation in early electronic music), beside the Under the hood line of [133](./133-the-maths-layer-complete.md). PRD story 100.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner, the History lines read (decision 17): "Love it!"

## Decided already (the owner, 2026-10-31)

1. Two lines with the Synth Geek Layer on: Under the hood (the formula, [133](./133-the-maths-layer-complete.md)) and History.
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
15. **The order in a tip,** with the Synth Geek Layer on: its words, then Under the hood (133, when built), then History last.
16. **A test keeps every line sourced:** each line carries its sources' numbers from the research file (not shown); a unit test fails on a line with none, or with one graded below B.
17. **The owner reads every line** before the release, as for [129](./129-words-fun-to-read.md).

## Agent Brief

**Category:** enhancement
**Summary:** With the Synth Geek Layer on, each control with a musical past shows a one-sentence History line in its tooltip, every fact sourced in the repository.

**Current behavior:** Tooltips say what a control does; the Synth Geek Layer adds formulas in places but no history.

**Desired behavior:** With the Synth Geek Layer on, about 25 controls' tips (and the Spectrum's and the Harmonic Markers') end with a line headed History: one sentence, about 160 characters at most, built from the research file's drafts under decisions 4 to 14, the glossary's words first, quoting old labels in quotation marks, naming people and instruments as the drafts do, saying nothing that rests below grade B. Attack, Decay, Sustain and Release share one line. Each line records its source numbers from the research file; a unit test checks every line has one graded A or B. About's credits link "History's sources" to the research file. With the Synth Geek Layer off, tips are as now. The lines read whole on a phone.

**Key interfaces:**
- The tips (their data and how the Synth Geek Layer extends them)
- The research file and its source numbers and grades
- About's credits
- CONTEXT.md, if History needs an entry

**Acceptance criteria:**
- [ ] ~~With the Synth Geek Layer on, each control the research drafts a well-sourced line for shows History last in its tip; off, nothing changes~~ (not checked at the time)
- [ ] ~~Every line is one sentence of at most about 160 characters, with no "first" unless quoted, and FM's line as decision 9 says~~ (not checked at the time)
- [ ] ~~A unit test: every History line names a source graded A or B in the research file~~ (not checked at the time)
- [ ] ~~About links "History's sources"~~ (not checked at the time)
- [ ] ~~On a 375 px phone a History line shows whole in the touch-and-hold tip~~ (not checked at the time)
- [ ] ~~The tooltip specs cover it; the fact-checker's pass before the release; the owner reads the lines~~ (not checked at the time)
- [ ] ~~Every test passes in Linux's fonts too~~ (not checked at the time)

**Out of scope:**
- Under the hood's formulas ([133](./133-the-maths-layer-complete.md))
- New research beyond the file (a later pass may add facts)

## What the research would gather

For each control and Section: who first built it or named it, when, on which instrument, and a source a reader can follow (a manufacturer's manual, a patent, a museum, a book or a paper), each claim marked with how sure it is.

## What a grilling would settle

- Which tips get a History line: every control, or the Sections and the famous ones (the Filter, the Envelopes, the LFO, Ring, FM, the Sub, Glide).
- How long a line may be, and how it reads on a phone.
- Where the sources live: a document in the repository, linked from the About.

## How it was built

- **The lines:** 34 History lines, all in one module beside the tips (the History module), so the owner and the fact-checker read them in one place; 40 tips, the three Spectrums' and the Harmonic Markers' carry one. Each is one sentence of at most 160 characters and records its sources' numbers from [the research file](../research/134-history-in-the-tooltips.md). They are the research's drafts, cut to the decisions: no "first", old labels in quotation marks ("Emphasis", "Amount of Contour", "Poly Mod", "Keyboard Control", "Range", "S-Trig"), one or two people a line.
- **Where they show:** with the Synth Geek Layer on, last in the tip, after the keys' steps, under a thin rule and headed **History** in bold; off, the tips are as before. A screen reader hears it too, as part of the description. The Synth Geek Layer's own tip now ends by saying it adds them. Under the hood ([133](./133-the-maths-layer-complete.md)'s slices) is not in the tips yet; when it comes, it goes before History (decision 15).
- **Which tips:** the Filter and its Cutoff, Resonance, Filter Mode, Slope, Key Track, Velocity → Cutoff and Envelope Amount; one line for Attack, Decay, Sustain and Release on both Envelopes, shared by the Amp Envelope's heading; the Filter Envelope's own; the Oscillators, Waveform, Pulse Width, both Octaves, Semitone (and Tuning, the same line), Detune, Osc 2's Env Amount, FM, Ring, the Sub (its fader and its options), Noise and Noise colour, the Mixer; the Amp and Volume (one line), Voices; the LFO, Rate and Depth; Glide, Pitch bend range, Hold, MIDI; the three Spectrums and the Harmonic Markers. None on Freeze, Snapshot, Theme, Demo, the C16's, the Scopes, Retrigger, Sync or the Timeline.
- **The test:** a unit test reads the research file, its source list and each fact's mark with what it cites, and fails on a line citing no source, an unlisted one, or one with no fact graded A or B; it also checks the length, one sentence, no "first", FM's order, the shared stages' line, and that each line is in some tip. The research file says so, so its two forms are kept when it is edited.
- **About:** the credits gain a History row: "The Synth Geek Layer's History lines, each fact with its source and how sure it is: History's sources", linking the research file on GitHub. [The release steps](../releasing.md) now send the fact-checker to it for a new or changed line (decision 12). CONTEXT.md has a History entry.
- **On a phone:** at 375 px the tallest tip with a History line, FM's, is 580 px high. A tip too tall for the room above and below its control now slides down from the top of the screen, over its control, so it shows whole, where before its top ran off the screen (Claude's call, open to the owner).
- **Calls open to the owner** (all Claude's call):
  1. **The Minimoog's year is left out** everywhere: the research sources no date for it (its manual is undated, its accessory sheets July 1971), so "the Minimoog (1970)" of the drafts would rest on nothing.
  2. **FM's line names the DX7** as decision 9 says, without its year (decision 14), though the DX7 itself rests on a C source; its listed sources are the A and B ones (Prophet-5, Chowning's paper, the Yamaha licence of 1975). The fact-checker may want the DX7's primary found, or the line to end at "Yamaha's from 1975".
  3. **Lines reworded off the C facts** (decision 14): Filter Mode says Moog's low-, high- and band-pass of 1964 (no Oberheim SEM, no notch); Slope says Moog's four stages and ARP's "24Db per octave" (no SEM); Detune quotes the Minimoog's "nearly in unison" (no organ celeste); Velocity → Cutoff is the A-only alternative (no CS-80, no MIDI velocity); the stages' line is Buchla's and ARP's (no Ussachevsky); Octave drops the organ's feet; Ring keeps the two patents (no Stockhausen year, no Daleks).
  4. **B facts that are a maker's claim are worded as theirs:** Voices quotes the Prophet-5 as "fully-programmable", in Sequential's words.
  5. **Noise gets Buchla's White Noise Generator (1964), Noise colour the Minimoog's switch;** the Rate gets ARP's .03 Hz and the Depth the Minimoog's mod wheel, the LFO's heading the Minimoog's slowed oscillator 3 and ARP's "LFO".
  6. **A source is as good as the best fact read in it:** the test grades a source by its facts' marks, and ARP's 3620 manual is both A (its LFO) and cited beside a U gap (Retrigger), so the best mark counts.
- **Tests run:** `npx tsc`, `npm run lint`; the History, tips and tooltip-placement unit tests (120 passed); in Chromium the tooltips, touch-tips, About, Geek, overlays, keyboard-access and Display panel specs (76 passed). Linux's fonts are GitHub's run.
- **To try:** turn on Display's Geek, then hover the Cutoff, Resonance, FM, Ring and the Spectrums: each tip ends with its History; hover Freeze: none. Turn Geek off: the History lines go. On a phone, hold FM: the whole tip shows, History last. Open About and follow "History's sources". Read every line (decision 17): they are all in the History module.

## Since then

- **The DX7 kept in FM's line** (the owner, 2026-11-03, answering [191](./191-the-owners-calls-after-1-21.md)); its primary source, Yamaha's own documents, to be found in [223](./223-the-owners-calls-after-1-21-built.md), to meet decision 5.
