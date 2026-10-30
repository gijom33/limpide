# Persona review 5: the learner, or the teacher

Headless Chromium (Playwright) on the live site, empty storage · learner 1440 × 900, teacher 1920 × 1080, and 1280 × 720 at scale 1.5 for a projector at 150 % zoom · about 35 minutes · 2026-10-30 · version 1.16.0 (build 328a370). This is the third run of this persona, after [1.8.1](../2026-10-26/5-learner-teacher.md) and [1.10.0](../2026-10-27/5-learner-teacher.md). I can't hear, so every claim about sound comes from the Viewers. Screenshots are in `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-5/` (shortened to `…/review-5/` below; the findings give full paths).

## First impression

**Learner:** "Same welcome: Play the Demo, Follow the Tutorial, Close. 'Follow the Tutorial' is clearer than last time's 'Tutorial'." (`…/review-5/01-arrival.png`) The first card of the Bass Tutorial now says what was missing twice before: "The sound flows left to right: the Oscillators make it, the Filter takes Harmonics away, the Amp shapes how loud it is over time. This Tutorial visits each in turn." Learner: "Good, now I know the order before I start."

The welcome's first focus lands on the tiny build link ("328a370"), which shows a focus ring.

**Teacher (1920 × 1080):** "Four sections across. The header now has a Tutorial button with the four listed (Bass, Acid, Pluck, Wobble), so I can pick one in front of the class. The new bits (FM on Osc 1, a Sub & Noise tab, Ring in the Mixer) are on screen, but nothing guides me through them."

## What they tried

1. **All four Tutorials to the end, by hand** (arrow keys on each ringed knob or fader, clicks for choices; Bass and Pluck at 1440 × 900, Acid at 1920 × 1080, Wobble at 1440 × 900). No Step was a dead end this time. "Almost to the bottom, about 2 ms" (Bass Steps 9 and 13) took arrow presses with no trap. A value within reach snapped onto the target after a short rest (Cutoff 289 Hz settled to 280 Hz, and the Bass end card said "This is the Bass Preset, built by you"). Bass Step 10 (Filter Decay) no longer ticks itself on arrival; it waited for a touch.
2. **Bass Step 4 (Ideal)** came up already ticked, because Ideal is now on from the first visit; the learner never opened Display. The new note is good: "Circles mark where Osc 1's saw puts its Harmonics, squares where Osc 2's square puts its own: an octave down, they fall in between." Zoomed in, the squares sit between the circles as promised; at 100 % on 1440 × 900 they are small enough that circles and squares look alike (`…/review-5/crop-bass04.png`).
3. **Acid at 1920 × 1080.** The new Step 2 (take a Snapshot) leaves a faint grey trace, and Step 3's note ("the Snapshot's faint trace shows all that was taken away") is visible on the Filter Spectrum. Step 4 (Resonance 80 %) is still the best moment in the app: a tall peak on the Curve, and the Filter Scope turning into a near-sine (`…/review-5/acid-04-done.png`). The card still covers the bottom of the Filter and Amp Spectrums at 1920 × 1080.
4. **Acid Step 4 at 150 % zoom.** Open, the card covers the whole Filter Spectrum, peak included (`…/review-5/z-acid-res-150.png`). Folded with ⌄ it shrinks to a 54 px bar with Next, and the peak is in view (`…/review-5/z-acid-res-150-folded.png`). A red "LIMITING" appears on the Amp Scope in this Step. Neither the Step's note nor the Amp Scope's Tooltip mentions it.
5. **Pluck and Wobble.** The Pluck notes now say "the gaps move closer together" instead of counting to ten. Wobble's Retrigger Step works as before.
6. **The end cards.** In three of four runs my keyboard pass nudged a control again after it had snapped (for example, Filter Decay snapped to 180 ms, then went on to 150 ms). The Step stayed ticked, and only the end card noticed: "Not quite the Preset yet: Filter Decay", with "Match the Preset". This is minor, and the end card catches it.
7. **The new Oscillator features' Tooltips** (1440 × 900):
   - **FM** (on Osc 1, in its Pitch row) is about 120 words. It covers cross-modulation, sidebands, Osc 2's tuning, when the Ideal draws sidebands, and an LFO aimed at FM. Focused from the keyboard, it covers the Oscillator Scope it describes (`…/review-5/m-03-maths-fm.png`).
   - **Ring** (Mixer) is about 100 words. It includes the faint click "that the Ideal leaves out".
   - **Sub** explains the rungs ("a square Sub fills the odd ones and Osc 1 the even ones").
   - **Pink** is explained on the Noise heading of the Sub & Noise tab (3 dB an octave). The White and Pink buttons have no Tooltip of their own. The Mixer's Noise fader still says "energy at every frequency" even when Pink is chosen.
   - **LFO Destination** lists seven Destinations (Pitch, Osc 2 Pitch, Detune, Pulse Width, Cutoff, Resonance, Volume). It leaves out FM, which 1.16.0 added.
8. **FM, as the learner would first try it: on Init.** Turning FM from 0 to 100 % bends the Oscillator Scope into curves, but the Spectrum hardly changes: Osc 2 is a saw on the same Note, so the sidebands land on the Harmonics (`…/review-5/f-init-fm0.png`, `…/review-5/f-init-fm100.png`). Learner: "It changed the shape, but where are the new partials?" Following the Tooltip's advice (Sine on both) works well. At FM 40 % a ladder of spikes appears and the Ideal's circles sit on them (`…/review-5/o-02-fm40-sine.png`). With Osc 2 a fifth up, the spikes split off the Harmonic grid, and the circles stay on plain Osc 1, as the Tooltip warns (`…/review-5/f-init-fm100-semi7.png`).
9. **Ring.** Two sines, Ring at 100 %, Osc 1 and Osc 2 faders at 0, Osc 2 transposed: two spikes, neither on the A4 mark, both with Ideal diamonds (`…/review-5/o-05-ring-fifth.png`). This is clear cause and effect on the screen.
10. **The Maths Layer with FM and Ring.** It still writes Osc 1's saw formula, "bₙ = 2 / (π n), every n: each Harmonic 1/n of the first", under the Oscillator Spectrum with FM at 50 %, and again with Ring at 100 %. It has nothing for sidebands or sums and differences. The Maths Tooltip lists what it shows, and FM and Ring are not in it.
11. **The Presets for the new features.** They are in Shapes (Sub Ladder, Square on Square, Sub Two Down) and Intervals (Ring Bell, FM Sidebands, Ring Octave, FM Ladder). Each has a good about line on hover in the Patch panel. Example, FM Ladder: "Turn FM down and watch the rungs fold away." Once a Preset is loaded, that line is nowhere on screen; the Patch name's Tooltip is the generic one. Searching "Sub" or "Pink" from inside a category finds nothing.
12. **The Demo at 1920 × 1080** runs about 3 minutes in 15 parts, each with a caption. The new features get short slots: Cathedral (Sub two octaves down) about 7 s and FM Bell about 8 s (`…/review-5/demo-12.png`). Self-Oscillation is about 3 s.

## What worked

- **Every finding from the second run was acted on**, and I could confirm most of them: the chain on the first card, the header's Tutorial button, Tooltips on every Viewer, the fader stages and the Timeline key, bigger card text from 1280 px (15 px), a card that folds and moves, the Snapshot Step, "almost to the bottom", Steps that wait for a touch, and a Step that snaps a near value onto its target.
- **Nobody got stuck in a Tutorial.** Four Tutorials, 54 Steps, done by hand, with no "Do it for me".
- **The new features draw well.** Ring's two spikes away from the Note, FM's sine ladder with the Ideal's circles on it, and the Sub filling every other rung are each a one-glance lesson. The Preset about lines say exactly what to watch.
- **Folding the card** solves the projector problem, once the teacher knows the ⌄ is there.

## Where they got stuck

- **The new features have no guided path.** All four Tutorials predate them, and none touches FM, Ring, the Sub or Pink Noise. The teacher assembles the lesson from Presets whose explanation disappears once they are loaded.
- **FM on Init looks like it does nothing** to the Spectrum. The fix (Sine on both, or a transposed Osc 2) is in a 120-word Tooltip that covers the picture.
- **The Maths Layer contradicts the picture** when FM or Ring is on: it promises "each Harmonic 1/n of the first" over a Spectrum that is no longer that.
- **The LFO Destination Tooltip is out of date** (no FM).
- **"LIMITING" in red** during Acid's Resonance Step, unexplained.
- **At 150 % zoom the open card still hides the Filter Spectrum**, until it is folded.

## What the learner could explain afterwards

> "The sound flows left to right. The **Oscillators** make a tone with Harmonics: a saw has all of them, a square the odd ones, a pulse leaves gaps. The **Sub** adds a square an octave down, so the ladder starts lower and fills every other rung. **Ring** multiplies the two Oscillators, so you hear their sum and difference and not the Note. **FM** lets Osc 2 wobble Osc 1's pitch so fast that new spikes grow beside each Harmonic. The **Filter** takes Harmonics away above the **Cutoff**, **Resonance** makes the one at the Cutoff ring, and its **Envelope** opens it on each Note. The **Amp** shapes the loudness: attack, decay, sustain, release. **LFOs** move things over and over."

That is the whole signal chain plus the three new sources, all supported by what they saw. The FM part rests on the Sine-on-both experiment, which came from the Tooltip, not from a Tutorial.

## Would they

- **Like it:** yes. The Ring picture is a new "oh!", and Acid's Resonance peak is still the best moment.
- **Share it:** yes. The learner would share "Follow the Tutorial". The teacher would send the Ring Bell and FM Ladder Presets to a colleague, with instructions, because the Presets don't explain themselves once loaded.
- **Come back:** yes. The learner wants a Tutorial for FM. The teacher would rehearse the lesson below.
- **Recommend to a class:** yes, teacher-led. For students alone: yes for the classic chain, no for FM and Ring, which need a guide.

## Since 1.8.1 and the Tutorials

- **Fixed since 1.8.1:** the core controls and the Viewers explain themselves; there is a place to start; Resonance shows; the Demo has captions.
- **Fixed since 1.10.0 (the first Tutorial run):** the signal chain on Bass's first card; an overshooting drag no longer ticks; "all the way down" reworded; no self-ticking Decay Step; no leftover ring on Display; Pluck's "every tenth" gone; a header door to the Tutorials; Tooltips on the Viewers, faders and Timeline key; 15 px card text from 1280 px; a card that folds and moves; Snapshot taught in Acid.
- **Remains:** the open card covers the Filter Spectrum at 150 % zoom (now fixable by folding); the Timeline's two oranges (decided by the owner to keep).
- **New with 1.16.0:** the four Tutorials are now behind the instrument. FM, Ring, the Sub and Pink Noise are taught only by Tooltips, Preset about lines, and 7 to 8 seconds of Demo. The Maths Layer and the LFO Destination Tooltip haven't caught up with FM.

## The 15-minute lesson plan

Set-up: 1920 × 1080 projector at 100 %, Hold on, the card folded whenever a Spectrum matters.

1. **(0–2 min) Hook.** Play the Demo from the start. Let it run through Acid, then stop with a key. Read the captions aloud.
2. **(2–3 min) The chain.** Open the Tutorial menu and pick Bass. Read its first card ("the Oscillators make it, the Filter takes Harmonics away, the Amp shapes how loud it is"), then quit.
3. **(3–7 min) The Filter: Acid, Steps 1–4,** with Listen on. Take the Snapshot, bring the Cutoff down, then Resonance to 80 %. Fold the card and point at the peak on the 2nd Harmonic. If "LIMITING" appears, say it is a safety limiter (the screen won't).
4. **(7–9 min) Sources, 1: the Sub.** Load Sub Ladder (Shapes). Read its about line from the Patch panel before clicking, because it vanishes once loaded. Turn the Sub fader down and up: every other rung empties and fills.
5. **(9–11 min) Sources, 2: Ring.** Load Ring Bell (Intervals). Point at the A4 mark: no spike sits on it, only the sum and the difference. Change Osc 2's Semitone and watch both spikes move.
6. **(11–14 min) Sources, 3: FM.** Load FM Ladder: one sine plus FM becomes a ladder. Turn FM down to fold the rungs away, then back up. Set Osc 2's Semitone to +7: the spikes leave the Harmonic grid, a clang. Warn the class that the circles then mark plain Osc 1, and keep the Maths Layer off for this part, because its formula still describes plain Osc 1.
7. **(14–15 min) Close.** "Which stage are Sub, Ring and FM in?" (All Oscillator stage, before the Filter.) "Which one made Harmonics that aren't on the ladder?"

Compared with the second run's plan, the Filter half is easier: no traps, a Snapshot, and a card that folds. The new half (steps 4–6) is entirely hand-built by the teacher.

## Three findings, ranked

1. **No Tutorial teaches FM, Ring, the Sub or Pink Noise**, and a loaded Preset's about line ("Turn FM down and watch the rungs fold away") is shown only on hover in the Patch panel. A learner meets 1.16.0's features only through long Tooltips and about 8 s of Demo. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-5/pr-6-FM_Ladder.png`
2. **The Maths Layer ignores FM and Ring.** With FM at 50 % or Ring at 100 %, it still writes "bₙ = 2 / (π n), each Harmonic 1/n of the first" under a Spectrum that no longer follows it, and it has nothing for sidebands or sum and difference. 1920 × 1080. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-5/m-03-maths-fm.png`
3. **The LFO Destination Tooltip lists seven Destinations and leaves out FM**, new in 1.16.0. A smaller relative: FM on Init barely changes the Spectrum (sidebands land on the Harmonics), and the way out (Sine on both) is inside a 120-word FM Tooltip that covers the Oscillator Scope. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-5/f-init-fm100.png`
