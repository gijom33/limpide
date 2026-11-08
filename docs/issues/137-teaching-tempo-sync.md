# 137: Teaching tempo sync

**What to build:** The third slice of [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (grilling, 2026-10-31, decisions 14 and 15, decided by the owner): the learning layer for the tempo and Sync, and the Presets that use it.

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md)

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: the seconds are the Synth Geek Layer's Rate readout (169), changed in [202](./202-the-geek-layers-rate-reads-as-without-it.md): "I actually see values in seconds, not Hz. I would keep showing the same values as without geek layer."

## Agent Brief

**Category:** enhancement
**Summary:** The tips, the Synth Geek Layer and a Tutorial Step explain how a synced Rate follows the tempo, and the Presets whose LFO is a rhythm use Sync.

**Current behavior:** issue 112 gives Sync, the BPM and Tap a first line of tip each and nothing more.

**Desired behavior:**
- **Tips** for Sync, the BPM and Tap: what each does and why a synced wobble stays on the beat when the tempo changes, in the tips' own voice.
- **The Synth Geek Layer** writes the conversion on a synced Rate, with the live numbers: "1/8 at 120 BPM: 120 ÷ 60 × 2 = 4 Hz", dotted and triplet values included.
- **A Tutorial Step**, in the Tutorial that teaches the LFO: the learner turns Sync on and hears the wobble lock to the Listen loop's beat.
- **The Presets:** profile 15 (the Preset curator, issue 42) picks the Presets whose LFO is plainly a rhythm (the wobbles, the gates) and sets Sync on with the note value that sounds as they do at their usual tempo; the others stay as they are.
- History's line on tempo sync is not here: it goes to [134](./134-history-in-the-tooltips.md).

**Key interfaces:**
- The tips, the Synth Geek Layer's formulas
- The Tutorials' Steps
- The Presets

**Acceptance criteria:**
- [x] The Synth Geek Layer's conversion shows the right Hz for a straight, a dotted and a triplet value
- [x] The Tutorial Step passes when Sync is on, and its test plays through
- [x] The Presets chosen keep their sound at 120 BPM (their level and RMS checks pass)
- [ ] ~~The words pass the facts check before a push~~ (not checked at the time)
- [ ] ~~Every test passes in Linux's fonts too~~ (not checked at the time)

**Out of scope:**
- History in the tooltips ([134](./134-history-in-the-tooltips.md))
- The Tour, which stays as it is

## How it was built

- **The tips:** Sync's says a note value is a share of a beat, so its speed follows the tempo ("double the BPM and the LFO runs twice as fast, and a synced wobble keeps time with the music"); the Tempo's names the BPM, says every synced LFO follows it and keeps to the beat, and that loading a Preset leaves it as it is; Tap's adds that every synced LFO's speed follows the tapped tempo. A synced Rate's own tip says what D and T are ("half as long again", "three in the time of two").
- **The Synth Geek Layer:** a synced Rate's tip, under the hood, starts with the conversion at the live tempo, "1/8 at 120 BPM: 120 ÷ 60 × 2 = 4 Hz, one cycle every 0.25 s.", then issue 169's formula T = beats × 60 / BPM, its letters said (BPM ÷ 60 the beats a second). The note values in a beat are written as the exact fraction: "× 2/3" for a 1/4 D (1.33 Hz at 120), "× 3/2" for a 1/4 T (3 Hz), "÷ 4" for a bar. It follows the tempo and the note value as they change. Its Hz is the tip's own ("At 120 BPM, 1/4 D is 1.33 Hz", now to three figures, from two), and a unit test checks it against `noteHz`, the Hz the engine runs a synced LFO at, for all 24 note values at four tempos.
- **The Tutorial:** the Wobble Tutorial (the one that teaches the LFO) gains two Steps after "Rate to 3 Hz": switch on Sync (the wobble now one a beat, 1/4, on Listen's beat at its 120 BPM), then turn the Rate to 1/4 T, three wobbles in two beats, 3 Hz again but held to the beat; 14 Steps now. Its intro, summary and Retrigger's note follow. The words test now checks Sync, tempo, BPM and triplet are explained at first use.
- **The Presets**, picked as profile 15 would (the wobbles and the gates): Wobble 1/4 T, Double Wobble 1/4 and 1/16, Growl 1/8, Trance Gate 1/16, Stutter 1/16, each the note value that is at 120 BPM exactly the Hz it had, which stays for Sync off. Their descriptions say they are synced. A browser test renders each with Sync on and off at 120 BPM: every 20 ms within 0.1 dB, the loudest 100 ms too (a wrong note value fails it by 3 dB); the Hz in the tips is now to three figures everywhere (call 5); the level checks pass as before.

**Claude's calls, let stand by the owner in 1.21.0:**
1. **Two Steps, not one:** Sync on alone makes the Rate 1/4 (2 Hz), slower than the Preset's 3 Hz, so a second Step turns it to 1/4 T for the Tutorial to end on the Preset; it also shows the same speed set in Hz and in beats.
2. **The Presets left in Hz:** the LFO group's lessons (Stepped, Ramp, Key Sync speak in seconds and Hz), Tremolo Keys (a gentle 5 Hz, no note value at 120; the Demo syncs it itself), FM Growl (an FM wobble, but its words count "three times a second"), Riser's ripple, Helicopter, Trill, Clang Alarm, Machine Chatter (effects, not the beat).
3. **The conversion lives in the tip**, under the hood, not under the knob: the knob reads the period (issue 169) at one width (issue 176).
4. **A stepped knob's Step needs its exact step** (issues 40 and 57 and CONTEXT's Step say so now): a Tutorial counted a knob within 5 % of its travel, and a note value's neighbours are 4.3 % apart (a Semitone's 4.2 %), so 1/8 D counted for 1/4 T and snapped. Now a note value, a Semitone or an Octave counts only on its target.
5. **A synced Rate's Hz to three figures** in its tip and its spoken value ("1/4 D, 1.33 Hz", was "1.3 Hz"), so the tip's Hz and the conversion under the hood are the same number; issue 176's "a few figures" still holds. The inbox's line on "2 Hz" against "2.00 Hz" is left to its triage.
6. **The Presets' picks are Claude's, as profile 15 would make them**; no profile 15 run was made for them. Borderline ones left in Hz: Wah (2 Hz), Robot (3 Hz), Trill (6 Hz, which is 1/8 T at 120).

**Tests run:** `npx tsc`, `npm run lint`; Vitest on the Geek, tips, tempo, Tutorial, words, Presets (with their browser renders) and Demo files (509 passed). Playwright in Chromium and WebKit: the Tutorial, Geek, tooltips, LFO, tempo, touch tips, Demo, Patches, Preset search and mascot specs (in WebKit 185 passed, 10 skipped). Three failed in both browsers, and fail the same at the branch's tip without this work: the Patches spec's "every Preset's description stays clear …" at 375, 1440 and 2000 px (FM Bass reaches the Osc tabs at 375 px; one description takes 3 lines at 1440 and 2000 px in the wider-type stand-in); the five Presets changed here fit at every width (checked alone). The mascot's "thrown, and lands on an edge" failed once in Chromium beside other work and passed alone (load average about 4.3). Vitest's `usePlayers.browser.test.ts` tempo test fails at the tip too (the tempo now carries issue 136's `midi` flag, which its expectation leaves out).

**Reviewed** with the code-review skill (standards and spec): the tip's Hz and the conversion's now the same number, the Hz and period taken from `noteHz`, Tap's words made exact, the stepped Step recorded in CONTEXT and issues 40 and 57, a test name given its issue. Left: the browser test's own level loop beside the file's others, and a short fixed wait in the Tutorial spec before checking a neighbouring note value does not count.

**Not verified here:** "every test passes in Linux's fonts too" (GitHub's run), and the words' facts check, which comes before a push (`docs/releasing.md`).

**To try in the app:**
- Turn the Synth Geek Layer on, switch LFO 1's Sync on and hover its Rate: "1/4 at 120 BPM: 120 ÷ 60 × 1 = 2 Hz"; turn it to 1/8 D, 1/4 T and 1/8, then change the tempo: the numbers follow.
- Take the Wobble Tutorial: at Step 9 switch Sync on and press Listen, each wobble lands on the beat; at Step 10 turn the Rate to 1/4 T.
- Load Wobble, Double Wobble, Growl, Trance Gate and Stutter at 120 BPM: they should sound as before; change the tempo and they follow it.
- Hover Sync, the BPM and Tap for their tips.

## Since then

- **The calls beyond the Brief accepted** (the owner, 2026-11-03, answering [191](./191-the-owners-calls-after-1-21.md)): a stepped knob's Step counted only on its exact target, the Presets picked by Claude rather than profile 15, and its Tutorial Step made two.
