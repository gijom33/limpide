# 129: Words that are fun to read

**What to build:** The owner's idea (inbox, 2026-10-31): "Would be better if text in tutorials are fun to read and easy to understand and self-explanatory." So someone who has never touched a synth can read every Step and every Tour card once, understand it without looking anything up, and enjoy reading it.

What exists already: each Tutorial Step has a `say` (what to do) and a `note` (the idea behind it, what to hear and see), 68 notes in all, drafted by Claude "in the voice of the Presets' about lines, reviewed by the owner before release" ([40](./40-preset-tutorials.md), decision 14). The Tour's four cards ([128](./128-how-a-synth-works.md)) are written the same way. That voice is exact but dense: a note often names two or three synth words (Harmonic, Cutoff, Envelope) that it doesn't explain, and few notes have a light touch.

**Blocked by:** [130](./130-the-tour-freezes-to-show-adsr.md), which rewrites the Tour's Amp card first (Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement. Polish for v1 ([131](./131-v1.md)). Profile 16's first review is in ([report](../reviews/2026-10-31/16-synth-neophyte.md)).

## Decisions

Decided by the owner in a grilling, 2026-10-31 (Claude's recommendations, each accepted; the questions below kept as asked):

1. **The voice:** light and warm, short sentences, one idea per Step, now and then an image from everyday life ("the Filter is a tone knob that you can sweep"). No jokes that need explaining; every claim stays true, the fact-checker (42, profile 13) checking each rewritten note against the engine.
2. **Synth words explained:** the first time a Tutorial uses one (Harmonic, Cutoff, Resonance, Envelope, LFO…), its note says what it means in a few plain words, even if an earlier Tutorial did, since people take them in any order. The tooltips stay as they are.
3. **Which words:** every Tutorial's `say` and `note`, and the Tour's cards. Not the tips, the Presets' descriptions or About, which are references read on demand.
4. **When:** after profile 16's first review, so the rewrite answers where a real neophyte got lost or bored. That review is agent work and can run now.
5. **Issue 40's decision 14** (the Tutorials in the voice of the Presets' descriptions) is replaced by this voice for the Tutorials and the Tour; the owner still reviews the words before the release.

Claude's call, open to the owner, from profile 16's review (2026-10-31):

6. **Each Tutorial gets its own first card** in this voice, saying what it teaches and what the person will hear, instead of leading with its Preset's description (the densest text in the app, which decision 3 leaves as it is, in the Patch panel). Bass already has one.
7. **One word for the idea, one for the picture:** Harmonic for the idea, and on the Spectrum "the Harmonics' lines"; partials, rungs, spikes and bars go. The words not explained anywhere (Harmonic, Hz, ms, dB, Init, Decay, Sustain, the Filter Envelope) are each explained where a Tutorial or the Tour first uses them.
8. **The end card points on:** a Tutorial's last card names the next one and what it teaches, and the Tutorial menu gives each a short line of what it teaches.
9. **The Tour's LFO card points at the Envelope Timeline's dotted line,** which shows the Cutoff swinging, not at the Cutoff knob, which cannot share the screen with it ([158](./158-tour-and-tutorial-slips.md), decided by the owner, 2026-10-31).

## Agent Brief

**Category:** enhancement
**Summary:** Rewrite the Tour's cards and every Tutorial's words in a light, warm voice that a newcomer understands without looking anything up, from profile 16's findings.

**Current behavior:** The Tour's cards and the Tutorials' `say` and `note` are exact but dense. Profile 16's first review (its report holds every finding, with the live text quoted and a suggested rewrite): Harmonic is used 32 times and never explained; Tour card 1 packs Waveform, cycle, pitch and timbre into one sentence and speaks of a fader on a hidden tab; the Filter Envelope arrives unannounced in Bass Steps 8 to 12, and Decay and Sustain are never explained; a Tutorial's first card is its Preset's description; Harmonics are also called partials, rungs, spikes and bars; Ring Bell and FM Ladder explain in arithmetic; seven notes repeat word for word across 17 Steps, and three Tutorials end with the same three tidy-up Steps; Hz, ms, dB and Init are never explained; on a phone the folded Tour card shows the chain line, not what to watch; the end card points nowhere and the menu's names say nothing of what each teaches.

**Desired behavior:** Every Tour card and every Tutorial Step reads in decisions 1 and 2's voice: short sentences, one idea per Step, an everyday image now and then, every synth word explained the first time a Tutorial (or the Tour) uses it. Each finding of the report is answered or, where it is not, the issue says why. Each Tutorial opens with its own card (decision 6); one word per idea (decision 7); the end card and the menu point on (decision 8); on a phone the folded Tour card shows what to watch. Every claim stays true: the fact-checker's checks (profile 13) and the Tutorials' tests pass, and sounds and Steps' targets do not change.

**Key interfaces:**
- The Tutorials' data (each Step's say and note, the end card) and the Tutorial menu
- The Tour's cards (chain, does, sees) and the folded card on a phone
- CONTEXT.md's words; the Presets' descriptions are left as they are

**Acceptance criteria:**
- [ ] Each of the report's 15 findings answered, or the reason it is not written in the issue
- [ ] Harmonic, Hz, ms, dB, Init, Decay, Sustain and the Filter Envelope explained where first used, in each Tutorial and the Tour
- [ ] No synth word in a Step or card that its Tutorial has not explained first (a unit test over the Tutorials' text against a list of the words that need explaining)
- [ ] Each Tutorial has its own first card; its end card names the next
- [ ] The Tutorial and Tour specs pass; a Step's target and a Tutorial's sound do not change
- [ ] The owner reads the words before the release (decision 5)

**Out of scope:**
- The tips, the Presets' descriptions, About
- The bugs the review found apart from words ([158](./158-tour-and-tutorial-slips.md))

## Questions for the owner

1. **How fun?** Claude's recommendation: a light, warm voice, short sentences, one idea per Step, and an image now and then from things a neophyte knows ("the Filter is a tone knob that you can sweep"). No jokes that need explaining, and every claim stays true: the fact-checker (42, profile 13) checks each rewritten note against the engine.
2. **Self-explanatory, how?** Claude's recommendation: the first time a Tutorial uses a synth word (Harmonic, Cutoff, Resonance, Envelope, LFO), its note says what that word means in a few plain words, even if an earlier Tutorial already explained it, because people don't take the Tutorials in order. The tooltips stay as they are.
3. **Which words?** Claude's recommendation: every Tutorial's `say` and `note`, and the Tour's cards. The tips, the Presets' about lines and the About panel are left: they are references, read on demand.
4. **When?** Claude's recommendation: after the synth neophyte's first review, so the rewrite answers the places a real neophyte got lost or bored. That review runs on the published site, so it waits until the Tour is released.
5. **Decision 14 of issue 40:** this would replace its "voice of the Presets' about lines" for the Tutorials. Claude's recommendation: yes, with the owner still reviewing the words before the release.
