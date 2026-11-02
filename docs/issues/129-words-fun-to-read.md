# 129: Words that are fun to read

**What to build:** The owner's idea (inbox, 2026-10-31): "Would be better if text in tutorials are fun to read and easy to understand and self-explanatory." So someone who has never touched a synth can read every Step and every Tour card once, understand it without looking anything up, and enjoy reading it.

What exists already: each Tutorial Step has a `say` (what to do) and a `note` (the idea behind it, what to hear and see), 68 notes in all, drafted by Claude "in the voice of the Presets' about lines, reviewed by the owner before release" ([40](./40-preset-tutorials.md), decision 14). The Tour's four cards ([128](./128-how-a-synth-works.md)) are written the same way. That voice is exact but dense: a note often names two or three synth words (Harmonic, Cutoff, Envelope) that it doesn't explain, and few notes have a light touch.

**Blocked by:** [130](./130-the-tour-freezes-to-show-adsr.md), which rewrites the Tour's Amp card first (Claude's call, open to the owner)

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try. Polish for v1 ([131](./131-v1.md)). Profile 16's first review is in ([report](../reviews/2026-10-31/16-synth-neophyte.md)).

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
- [x] Each of the report's 15 findings answered, or the reason it is not written in the issue
- [x] Harmonic, Hz, ms, dB, Init, Decay, Sustain and the Filter Envelope explained where first used, in each Tutorial and the Tour
- [x] No synth word in a Step or card that its Tutorial has not explained first (a unit test over the Tutorials' text against a list of the words that need explaining)
- [x] Each Tutorial has its own first card; its end card names the next
- [x] The Tutorial and Tour specs pass; a Step's target and a Tutorial's sound do not change
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

## How it was built

Every Tutorial's `say` and `note`, every first and last card, the Tutorial menu and the Tour's four cards are rewritten in decisions 1 and 2's voice. The Steps, their targets and the sounds are as they were: each Tutorial still rebuilds its Preset exactly (its unit test).

- **The words test** (decision 2's criterion): a unit test reads each Tutorial as a person does (its first card, each Step's instruction then its note, its last card), and the Tour card by card, and checks that the first text using each of 42 synth words (Init, Oscillator, Waveform, Harmonic, Scope, Spectrum, the Timeline, Mixer, Filter, low-pass, Cutoff, Resonance, Slope, Amp, Envelope, the Filter Envelope, Attack, Decay, Sustain, Release, Amount, octave, Semitone, Hz, kHz, ms, dB, Ideal, Snapshot, Velocity, Glide, Pulse Width, FM, Ring, Sub, Noise, White, Pink, LFO, Depth, Rate, Retrigger) says what it is in the same sentence. It also checks that no text says partial, rung, spike or bar. Each word has one plain gloss, used wherever a Tutorial first needs it: Harmonics are "the stack of pitches a Note is made of", the Spectrum "draws each as a line", the Filter is "the sound's tone knob", the Cutoff "where the Filter starts to cut", Hz "vibrations a second", ms "thousandths of a second", dB "decibels, how loudness is counted", Init "the plain sound every Tutorial begins with".
- **The first card** (decision 6) leads with the Tutorial's own words, what it teaches and what you will hear ("A wobble bass, the “wub wub” of dubstep. An LFO, a slow invisible hand, opens and closes the Filter…"), then how a Tutorial goes. The Preset's description no longer shows on it; it stays in the Patches panel. On a phone the two folded lines are now these words.
- **The last card and the menu** (decision 8): each Tutorial has a short line of what it teaches. The menu shows it under each name, and the end card adds "Next: Acid, a talking bass, with a peak that sweeps and Notes that slide. It is under Tutorial, at the top." Deep Breath, the last, says so and hands the synth over. With the wider rows, the list now opens along the button's right edge when the button is in the right half of the window. Before, at 861 px it ran 55 px off the page.
- **The Tour** (decisions 2 and 9): each card now starts with a line saying what to watch ("Watch the wave change shape: the synth is switching Osc 1 from Saw to Square to Sine."), then where the Section sits, what it does and what its pictures show. Folded on a 375 px phone, those two lines are what to watch, whole (measured, and now a spec). The LFO card points at the Timeline's dotted line and no longer brings the Cutoff knob into view ([158](./158-tour-and-tutorial-slips.md), decision 1).
- **CONTEXT.md:** the Harmonic's entry gains its plain words and its picture (a line), with rung, spike and bar under Avoid; the Tutorial's and the Tour's entries say what their first and last cards hold.

### The report's 15 findings

1. **Harmonic never explained:** Tour card 1 and the first use in every Tutorial say "the stack of pitches every Note is made of"; the test holds it.
2. **Tour card 1's dense sentence and the hidden fader:** rewritten as two short sentences on shape and pitch; it no longer speaks of a fader on a hidden tab, only that the Mixer, on its own tab, sets how loud each Oscillator is.
3. **The Filter Envelope unannounced; Decay and Sustain never explained:** the Tour's Amp card names all four stages in plain words and says the Filter has an Envelope of its own. Each Tutorial's first Filter Envelope Step says "The Filter has an Envelope too, a shape over time that opens and closes it on every Note", and each stage's first Step says what the stage is before its number.
4. **The first card's dense description:** each Tutorial has its own intro (decision 6).
5. **Tour 4 points at a knob off screen:** it points at the Timeline's dotted line (decision 9).
6. **Five names for one thing:** Harmonics for the idea, the Spectrum's lines for the picture (decision 7). Partials, rungs, spikes and bars are gone, and the test keeps them out.
7. **Ring Bell and FM Ladder in arithmetic:** FM is "frequency modulation, Osc 2 bending Osc 1's pitch", too fast to hear as a wobble, so it turns into tone. Ring "multiplies the two waves", giving two new pitches that slide off the neat row of Harmonics, "what makes metal sound like metal". The 3.38 and 1.38 are gone, and so is the minor third (now "+3, three piano keys up").
8. **Bass Step 4 ticked before it was done:** the tick was fixed in [158](./158-tour-and-tutorial-slips.md). The instruction now says what Ideal is ("small marks for where each wave's Harmonics should land").
9. **Repeated notes and the Envelope drill:** no note is shared any more. The shared Steps (the Bass's and Wobble's first three, the four 24 dB Slopes, the three wide-open endings) each have their own line for that sound. Each drill Step now gives the reason before the number ("Its Decay is how fast it closes back down. Make it short, about 180 ms."). The tidy-up Steps themselves stay, since every Step sets a control its Preset needs and the sounds must not change.
10. **Units:** Hz, kHz, ms, dB and octaves are explained where first used, and Semitone as "piano keys".
11. **Init:** "Start from Init, the plain sound every Tutorial begins with…", on every first card.
12. **The phone's folded Tour card:** it shows what to watch.
13. **The end card and the menu:** both point on (decision 8).
14. **Acid's Snapshot staying through later Tutorials:** fixed in [158](./158-tour-and-tutorial-slips.md) (a Tutorial's Snapshot is cleared when it ends), so no words were needed.
15. **Next does nothing until a Step is made, and says not why:** not answered here. It is the card's behaviour, not its words, so it falls under this issue's Out of scope (the review's bugs apart from words). It is a line for the inbox if the owner wants it.

### Calls made (Claude's call, open to the owner)

- **The Preset's description is gone from the first card,** not just moved after the intro: it is the densest text in the app, and the test would fail on it. It still shows in the Patches panel.
- **The Tour card's first line is a new "what to watch" line** on every screen, not only on a phone, so the card reads the same everywhere.
- **The everyday images** are Claude's: the clarinet, the thick blanket, the slow invisible hand, the "wub wub" of dubstep, acid house, metal sounding like metal, wind and distant surf. Each is for the owner's ear.
- **Every claim was checked against what the old notes said and the engine's rules** (a square's odd Harmonics, a 25 % pulse missing every fourth, 24 dB twice as steep as 12, Ring's sum and difference, Pink's tilt). The fact-checker (profile 13) and profile 16's second read have not run on the new words: they should, before the release (decision 5, with the owner's read).

### Tests run

`npx tsc`, `npm run lint`; the Tutorial and UI unit tests (248 passed, the new words test among them); in Chromium the Tutorial and Tour specs (66 passed, with the new phone and menu checks), and the About, docked-cards, mascot, patch-search, tooltips and welcome specs (76 passed).

### To try

- Take the Tour on a phone and read each folded card's two lines; then open them.
- Open the Tutorial menu at the top and read its lines; at a laptop width the list now opens leftward.
- Start each Tutorial and read its first card. Make a few Steps and read the notes, then press "Do it for me" to the end and read the last card's "Next".
- Read every Step's words once, as decision 5 asks, before the release: [src/tutorial/tutorials.ts](../../src/tutorial/tutorials.ts) holds them all in order, and the Tour's are in [src/tutorial/tour.ts](../../src/tutorial/tour.ts).

