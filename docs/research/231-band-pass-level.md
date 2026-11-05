# 231: The band-pass's level in other synths

The research pass for [issue 231](../issues/231-a-band-pass-not-so-much-quieter.md): whether other synths and the filter literature do anything about a band-pass being quieter than a low-pass. It informs the issue's three questions; it decides none of them. Claude's research pass, 2026-11-04, open to the owner.

## How to read it

Each fact carries a confidence mark, as in [134's research](./134-history-in-the-tooltips.md):

- **A**: read in a primary source (the spec, the cookbook, a maker's manual or page, a designer's own paper or code) for this pass, quoted or paraphrased closely.
- **B**: primary, but only partly read (a search engine's excerpt of it, or code read in part), or a maker's own claim.
- **C**: secondary only (a review, a forum, an encyclopaedia). A pointer, not a fact.
- **U**: not sourced.

"Says nothing" means the page was read and has no word on a band-pass's level against the other Modes. Where a manual is only a PDF, it is listed under Sources as found but not read, so the owner can allow a download later.

## 1. The two digital forms

The cookbook gives two band-pass biquads, which share their poles and differ only in their numerator. **A** [S1]

- "BPF (constant skirt gain, peak gain = Q)": b0 = sin ω0 / 2 = Q·α, b1 = 0, b2 = −Q·α; a0 = 1 + α, a1 = −2 cos ω0, a2 = 1 − α. **A** [S1]
- "BPF (constant 0 dB peak gain)": b0 = α, b1 = 0, b2 = −α, with the same a0, a1, a2. **A** [S1]

So the constant-skirt form is the 0 dB form multiplied by Q: its centre rises with Q, while the skirts (far from the centre) stay where they are. **A** [S1]

The Web Audio API's "bandpass" uses b0 = α_Q, b1 = 0, b2 = −α_Q, a0 = 1 + α_Q, a1 = −2 cos ω0, a2 = 1 − α_Q, with α_Q = sin ω0 / (2Q): the cookbook's **constant 0 dB peak gain** form, term for term. **A** [S1, S2] The spec's Q for a band-pass is linear and "Controls the width of the band": a higher Q narrows the band and leaves its centre at 0 dB. **A** [S2] Julius O. Smith's text gives the same normalisation for a two-pole resonator, adding zeros at z = ±1 and a scale so that the peak gain is one at every tuning. **A** [S3]

This is why Limpide's band-pass loses level as Resonance rises: the centre stays at 0 dB while the band narrows, and a saw's power, which lies in its low Harmonics on the skirt, is cut more. At 24 dB both stages have the same Q, so the skirts fall twice as fast. (Claude's reading of `filterDesign.ts` against [S2], not a source's claim.)

## 2. Classic analogue multimode filters

**The state-variable filter's band-pass is constant-skirt in its basic form.** Rod Elliott's analysis of the basic analogue state-variable circuit says "its level depends on the filter Q" (raising Q there gives over 11 dB at the centre); a four-op-amp variant keeps the band-pass peak "always unity gain (0dB)". **A** [S5] So both forms exist in analogue circuits too, and which one a synth has is the designer's choice. Lazzarini and Timoney, deriving the digital Chamberlin state-variable filter (the one Cycling '74's svf~ implements, from Chamberlin's book [S6, S21]), note that their improved filter's band-pass "does not have unity gain at the centre frequency" and scale it by 1/Q, so that it does not grow with a sharper resonance. **A** [S4]

**The Oberheim SEM.** That the SEM's band-pass is a switched position beside the low-pass-to-notch-to-high-pass knob is known only from reviews. **C** [S25] Whether its band-pass peak rises with Resonance (constant skirt) was not found in any primary source: no SEM manual, service note, schematic text or Tom Oberheim's own writing was found as a page. **U** The usual state-variable topology would make it constant-skirt [S5], but that is an inference, not a fact about the SEM.

**Other well-known synths:**

- Sequential OB-6 (SEM-style, with a band-pass) and Prophet-6: manuals are PDFs, not read [S19, S20]. **U**
- Oberheim Xpander and Matrix-12: no maker's manual found as a page. **U**
- Moog Matriarch: the band-pass is its Series mode, a high-pass into a low-pass on a shared Cutoff; Moog's page says nothing on its level. **A** [S14]
- The OB-Xf, an OB-X model, whose Band-Pass button replaces the notch: its manual says nothing on level. **A** [S13]
- Korg MS-20, Roland Jupiter-8 and JP-8000: not researched in this pass. **U**

## 3. Current soft synths and hardware

No maker's page read for this pass documents a level compensation or make-up gain for a band-pass Mode, nor a band-pass that keeps the low-pass's level. What each says:

- **Ableton Auto Filter:** the band-pass is described by its response only; the one level control is Output, which "allows you to compensate for increases in loudness", tied to Drive, the same for every type. **A** [S7] **Analog, Meld, Operator:** say nothing; Operator's Resonance sets "the width of the band-pass and notch filters", and its Normalize keeps level only in the oscillator's harmonics editor. **A** [S8]
- **Bitwig Filter / Filter+:** pre- and post-gain and a Wet Gain, none tied to a Mode; says nothing. **A** [S9]
- **Native Instruments Massive X:** several band-pass Modes and a Gain that drives the input; says nothing for the band-pass. Its Comb filter's OSC Mode "compensates for resonance boosts", the one Mode-specific compensation found. **A** [S11]
- **Surge XT:** two Vintage Ladder subtypes are each a "gain-compensated version" of another, without saying against what; for loud resonant peaks it suggests raising the Pre-Filter Gain and lowering the output. Says nothing on the band-pass. **A** [S10]
- **Vital:** no maker's manual found. Its published source code mixes the band-pass at a weight that does not depend on Resonance, and, in one branch, divides the input drive by (1 + 2·r³), r being the Resonance (0 to 1), so the input falls by up to about 9.5 dB as Resonance rises. **B** [S15] Which filter styles take that branch, and whether this is meant as level compensation, was not established. **U**
- **Elektron** (Analog Four and Analog Keys multimode filter): says nothing on the band-pass's level. **A** [S12] Digitone: PDF only, not read. **U**
- **Novation Peak and Summit:** the user guides refused the fetch; the search engine's excerpts show band-pass at 12 and 24 dB, with Frequency setting the pass-band's centre, and nothing on level. **B** [S16]
- **Xfer Serum 2:** the online manual's filter-type pages were not found; the pages read say nothing. **U** [S17]
- **u-he Diva and Repro, Arturia V Collection, Korg wavestate:** manuals are PDFs, not read [S18]. **U** A forum post says one of Diva's filters is not gain-compensated for resonance at all and gets loud with it; it names no filter. **C** [S26]
- **Korg minilogue xd:** Korg's page calls its filter a "sharp two-pole filter" and names no band-pass. **A** [S27]

## What this means for 231

- **Question 1 (which Modes):** no maker read documents a make-up gain for the band-pass, the high-pass, or every Mode. The common answer is a general output or gain control that the player sets [S7, S9, S10]. So none of (a), (b) or (c) follows a documented precedent; the evidence neither favours nor rules out (a).
- **Question 2 (how):** the constant-skirt form [S1], and the basic analogue state-variable filter [S5], are a make-up that follows the Resonance by nature: they are the 0 dB form multiplied by Q. That supports (b) as a known, classic behaviour. One caution, Claude's arithmetic and not a source's: with Limpide's Q = 0.5 × 40^Resonance, multiplying by Q is −4.4 dB at Init's 5 %, 0 dB near 19 %, +10 dB at 50 % and +26 dB at 100 % (twice as much at 24 dB). So a pure constant skirt would make Init quieter still, and (b) would need a fixed part as well, or a floor, and a cap. Vital's lower drive with Resonance [S15] shows a maker trading level against Resonance, but the other way, to tame the peak. Nothing found supports (c): no maker documents a level that follows the Cutoff against the Note.
- **Question 3 (the Presets):** no source speaks to it.
- **Still open:** the SEM's own band-pass behaviour, and what the PDF-only manuals say (OB-6, Prophet-6, Diva, Arturia, Digitone, wavestate, Serum's full manual), would need the owner's leave to download.

## Sources

Primary, read (2026-11-04):

- **[S1]** W3C, *Audio EQ Cookbook*, Working Group Note, 8 June 2021, ed. R. Toy, adapted from R. Bristow-Johnson's *Audio-EQ-Cookbook.txt*: <https://www.w3.org/TR/audio-eq-cookbook/>
- **[S2]** W3C, *Web Audio API 1.1*, Working Draft, 22 September 2026, BiquadFilterNode and its filters' characteristics: <https://www.w3.org/TR/webaudio/>
- **[S3]** J. O. Smith III, *Introduction to Digital Filters with Audio Applications*, "Constant-Peak-Gain Resonator" (CCRMA): <https://ccrma.stanford.edu/~jos/filters/Constant_Peak_Gain_Resonator.html>
- **[S4]** V. Lazzarini and J. Timoney, *Improving the Chamberlin Digital State Variable Filter*, arXiv:2111.05592v2, 2022 (HTML version): <https://arxiv.org/html/2111.05592v2>
- **[S5]** R. Elliott, *State Variable Filters*, Elliott Sound Products: <https://sound-au.com/articles/state-variable.htm>
- **[S6]** Cycling '74, *svf~* reference (Max 5): <https://docs.cycling74.com/legacy/max5/refpages/msp-ref/svf~.html>
- **[S7]** Ableton, *Live 12 Manual*, Live Audio Effect Reference (Auto Filter): <https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/>
- **[S8]** Ableton, *Live 12 Manual*, Live Instrument Reference (Analog, Meld, Operator; Wavetable not reached): <https://www.ableton.com/en/live-manual/12/live-instrument-reference/>
- **[S9]** Bitwig, *User Guide*, Filter devices: <https://www.bitwig.com/userguide/latest/filter15>
- **[S10]** Surge Synth Team, *Surge XT User Manual*, Filters: <https://surge-synthesizer.github.io/manual-xt/>
- **[S11]** Native Instruments, *Massive X Manual*, Filter: <https://docs.native-instruments.com/online-guides/massive-x-manual/en/filter>
- **[S12]** Elektron Knowledge Base, *Filters* (Analog Four MKI/MKII and Analog Keys), modified 27 March 2020: <https://support.elektron.se/support/solutions/articles/43000566549>
- **[S13]** Surge Synth Team, *OB-Xf Manual*, Filter: <https://surge-synth-team.org/ob-xf/manual/filter/>
- **[S14]** Moog Support, *Moog Matriarch Filter Modes*: <https://moogmusic-help.freshdesk.com/en/support/solutions/articles/69000877830-moog-matriarch-filter-modes>
- **[S15]** M. Tytel, Vital's source code, `digital_svf.cpp` (read in part): <https://github.com/mtytel/vital/blob/main/src/synthesis/filters/digital_svf.cpp>
- **[S16]** Novation, *Peak* and *Summit* user guides (the site refused the fetch; known by search excerpts): <https://userguides.novationmusic.com/hc/en-gb/articles/25494693870354-Novation-Peak-in-detail>, <https://userguides.novationmusic.com/hc/en-gb/articles/25003971047186-Summit-in-detail>
- **[S17]** Xfer Records, *Serum 2 Manual* (contents and "Using Oscillators and Filters" read): <https://www.xferrecords.com/web-manual/serum-2/using-oscillators-and-filters>
- **[S27]** Korg, *minilogue xd* product page: <https://www.korg.com/us/products/synthesizers/minilogue_xd/>

Primary, found but not read (PDF or not online):

- **[S18]** Arturia, *Oberheim SEM V Manual* 1.3.0: <https://downloads.arturia.com/products/oberheim-sem-v/manual/OberheimSEMV_Manual_1_3_0_EN.pdf>. The u-he Diva and Repro, Elektron Digitone and Korg wavestate manuals are PDFs too, not looked up by URL.
- **[S19]** Dave Smith Instruments, *OB-6 Operation Manual*: <https://www.davesmithinstruments.com/wp-content/uploads/2016/03/OB-6-Operation-Manual.pdf>
- **[S20]** Sequential, *Prophet-6 manual*: <https://analoguehaven.com/sequential/prophet-6/manual.pdf>
- **[S21]** H. Chamberlin, *Musical Applications of Microprocessors*, 2nd ed., Hayden, 1985, pp. 490–492 (cited by [S6] and musicdsp.org; not read).

Secondary (pointers only):

- **[S25]** Sound On Sound on the SEM's band-pass as a switched position of the mode knob (known by a search excerpt, not read): <https://www.soundonsound.com/node/4906533>
- **[S26]** KVR Audio forum, "The long DIVA thread", 2013 (known by a search excerpt): <https://www.kvraudio.com/forum/viewtopic.php?p=5531764>
