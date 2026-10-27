# Review 5: the learner, or the teacher (second run)

Run on the live site (https://gijom33.github.io/limpide/, version 1.10.0, build 88bbcc1) on 27 Oct 2026. This is the second run of this persona; the first was on version 1.8.1 ([2026-10-26](../2026-10-26/5-learner-teacher.md)). I used headless Chromium driven by Playwright, starting with empty storage. The learner had a 1440 × 900 window; the teacher had 1920 × 1080. I also tried 1280 × 720 at device scale 1.5 to stand in for 150 % browser zoom on a projector. The learner turned every control the Tutorials asked for by hand: arrow keys on the focused knob or fader, mouse drags for some knobs, and clicks for choices. I can't hear, so everything below about sound is judged from the Viewers. Screenshots are in `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/` (shortened to `…/5-learner-teacher-2/` below; the findings at the end give full paths).

## First impression

**Learner:** "Same welcome as before, but now there are three buttons: Play the Demo, Tutorial, Explore. I'm here to learn, so: Tutorial." (`…/01-arrival.png`)

The Tutorial button gives no hint of what it opens: no Tooltip, no name, no length. It opens the Bass Tutorial. A card docks at the bottom: "Bass, 15 steps", the Preset's about line, then "Build it from Init, one control at a time. Play any Note, or press Listen, to hear each change." (`…/02-tutorial-first-card.png`). Learner: "OK, a bass. I wanted to know how a synth works, but fine, let's build one."

The welcome still says nothing about the order of the stages. Neither does the first card.

**Teacher (1920 × 1080):** "Four panels across, same as before. Now there's a guided path I could project and follow step by step."

## What they tried, in order

1. **Bass, Step 1: "Raise Osc 2 in the Mixer to half."** The page switched to the Mixer tab by itself. The Osc 2 fader is ringed in orange with "→ 50 %" above it (`…/10-bass-01-ask.png`). The learner focused the fader and pressed the up arrow 23 times. The card ticked the Step and showed the note: "Louder, not different: Osc 2 is a second saw at the same pitch, so it has the same Harmonics." (`…/10-bass-01-done.png`). The ring and the target label work well. The learner never has to hunt for the control. The "→ 50 %" label sits on top of the "OSC 2" tab name, though.
2. **Steps 2 and 3: Osc 2 to Square, Octave to −1.** One click and one key press. After Step 3, the Oscillator Scope shows a saw with a square step every other cycle. The Spectrum fills in between Osc 1's spikes, as the note says.
3. **Step 4: "Open Display and turn on Ideal."** The Display button is ringed. Once the panel opens, the ring moves to Ideal (`…/10-bass-04-display-open.png`). With Ideal on, rings sit on Osc 1's saw Harmonics, and the note says that the bars between them are Osc 2's square (`…/10-bass-04-done.png`). Learner: "So the rings are one oscillator and the extra spikes are the other." That is a good use of Ideal. After the Step was done and the panel closed, the ring went back onto the Display button. It looked as if something there was still to do.
4. **Step 5: "Turn the Filter's Cutoff down to about 280 Hz."** This time the learner did what people do with a knob: they grabbed it and dragged down, about 120 px in one go. The Cutoff went from 2.00 kHz straight to 32 Hz. The Step ticked anyway, and the note appeared: "The Filter Spectrum loses its upper Harmonics: the bright buzz becomes a dark hum." (`…/10-bass-05-done.png`). At 32 Hz the Filter Scope is a flat line and only a stub is left in the Filter Spectrum. That is not a dark hum; it's close to silence. The cause: the Step is marked done the moment the knob passes within 5 % of the target, and the drag carried on past it. The ring still says "→ 280 Hz" next to "32 Hz", but nothing asks the learner to come back. They found out only on the last card: "Not quite the Preset yet: Cutoff." (`…/11-bass-end.png`).
5. **I ran Bass again with the arrow keys only**, to judge the lesson at the right values. At 280 Hz with Listen on, the Curve's knee sits between the 2nd and 3rd Harmonic of A2. The upper Harmonics in the Filter Spectrum shrink, and the Filter Scope is rounder than the Oscillator Scope (`…/21-bass-05-listen-700.png`). It works, but with Osc 2's extra spikes the Spectrum is busy. The clean "the spikes on the right vanish" moment from the first run is less clean here.
6. **Steps 6–8: Slope 24, Resonance 35 %, Filter Envelope Amount +2.5 oct.** At 35 % a small bump shows at the knee (`…/21-bass-07-listen-700.png`). With Amount up and Listen on, the Timeline's orange line jumps at each Note and falls back, and a blue modulation arc appears on the Cutoff knob (`…/21-bass-08-listen-1100.png`). Learner: "So the envelope moves the knob for me, on every note."
7. **Step 9: "Pull the Filter Envelope's Attack all the way down."** I tried this twice. With the arrow keys, three presses reached 2.00 ms and the Step ticked. With a quick drag of the fader cap to the bottom, the value read 1.00 ms, which is "all the way down", but the Step did not tick and Next stayed greyed out (`…/90-attack-all-the-way-down.png`). The target is 2 ms, and the bottom of the fader (1 ms) is more than 5 % of its travel away. This is where a learner gets stuck: they did exactly what the card said. Their way out is "Do it for me" or nudging the fader up without knowing why. Step 13 (the Amp's Attack, also "all the way down", also 2 ms) has the same trap.
8. **Step 10: "Set its Decay to about 180 ms."** The Step was already ticked when it appeared, and the readout already said 180 ms (`…/10-bass-10-ask.png`). The Filter Decay starts at 250 ms in Init, which is within 5 % of 180 ms on the fader, so the page snapped it to 180 ms without the learner touching it. Learner: "Did I do that?" The note ("That fall is the thump") still reads fine, but nothing was learned by doing.
9. **Steps 11–15: Filter Sustain and Release, then the Amp's Attack, Sustain and Release.** All done with a few arrow presses each. The last card: "A bass from Init, through the whole signal chain… This is the Bass Preset, built by you." (`…/22-bass-end-matched.png`). The Patch name changes to Bass. It's the first time the words "signal chain" appear, and the Tutorial never said what the chain is.
10. **Back to Explore, and the hover test from the first run.** This is the big change since 1.8.1 (`…/31-hover-Filter-heading.png`):
    - The Oscillators, Filter and Amp headings now have Tooltips. The Oscillators one says the sound starts there and is "then sent to the Filter". The Filter one says "This is the 'subtractive' in subtractive synthesis".
    - The Waveform picker, Octave, Cutoff, Resonance, Envelope Amount, Mode, Slope and the Patch name have Tooltips too. The Waveform one says Square has "odd ones only".
    - The Oscillators Tooltip also says what the two pictures are: "the Scope draws its shape, the Spectrum its Harmonics".

    Still nothing on any Scope, Spectrum, the Timeline, its legend, or the individual Attack/Decay/Sustain/Release faders. The Amp Envelope label explains all four instead.
11. **The Tutorials door after Explore.** A learner who picks Explore first, as the first run's learner did, sees no Tutorial anywhere on screen. The Tutorials row appears only after clicking the Patch name "Init" in the header (`…/40-patches-panel.png`). The About panel doesn't mention Tutorials. Once found, the panel is clear: a "Tutorials" row at the top, and a cap beside Bass, Acid, Pluck and Wobble in their categories, with a good Tooltip ("Build this sound step by step, from Init…", `…/81-cap-tip.png`).
12. **Acid, Steps 1–5, dragging carefully and watching the readout.** Done that way, each drag stopped on the target. **Step 3, Resonance to 80 %, is the moment the first run was missing.** With the Cutoff at 250 Hz and Listen on, a tall peak sits right on the 2nd Harmonic of A2. That Harmonic towers over the others, and the Filter Scope becomes almost a pure sine at twice the note (`…/42-acid-03-listen-500.png`). Learner: "So *that's* resonance: it picks out the harmonic at the cutoff." Step 4 (Amount +3.5 oct) makes the Filter Scope ring at each Note. It's a vivid picture of "squelch" (`…/42-acid-04-listen-900.png`). The "→ +3.5 oct" label covers the Cutoff readout just above it, so the learner can't read where the Cutoff is. Back moved the card back one Step and left the knob where it was, as designed. Quit left the half-built sound.
13. **Pluck, Steps 1–3.** "Make Osc 1 a Pulse": the note says every fourth Harmonic is missing, and the Spectrum shows exactly that, with a clear dip at 4 (and at 8) (`…/50-pluck-1.png`). At 30 % Pulse Width the note says every tenth is missing. That's true, but the Harmonic numbers stop at 7, so the learner can't count to 10 on the picture (`…/50-pluck-2.png`). Step 3 (Sustain all the way down, 33 key presses) is accepted at 0 %.
14. **Wobble, Steps 7–10.** I used "Do it for me" for Steps 1–6 because they repeat Bass word for word (Osc 2, Square, Octave, Slope, Cutoff, Resonance). The page scrolled the LFO row above the card. With Depth 70 % and Rate 3 Hz, the LFO plot shows three cycles a second, the Cutoff knob's arc swings, and the Timeline's orange line becomes a wave (`…/51-wobble-08-listen-900.png`). After Retrigger, the wave restarts at each Note on the Timeline, as the note says (`…/51-wobble-09-listen-900.png`).
15. **The Demo, as the teacher's hook (1920 × 1080).** A card now docks at the bottom with the sound's name, seven dots for the parts, Stop, and a plain caption for each part. Kick: "a tone that falls fast in pitch". Acid: "The Filter opens bit by bit and starts to ring". Self-Oscillation: "No Oscillator at all: the Filter sings on its own" (`…/61-demo-02.png`). A key press stops it, and the card says "The Demo stopped: you are playing now." The captions are 13 px.
16. **Teacher, the Tutorial on a projector.**
    - At 1920 × 1080 the panels are tall and the card sits over the bottom of the Filter and Amp Spectrums. In Acid Step 3, it hides the Spectrums' frequency axis and the base of the Harmonics (`…/63-teacher-acid-resonance.png`).
    - With Maths on in the Light theme, the card cuts the Filter's formula off mid-line: "|H| = (1 / √((1 − x²)² + (" (`…/64-teacher-light-maths.png`).
    - At 150 % zoom the card covers almost all of the Filter Spectrum, while the Step reads "watch the Curve jump up and fall back" (`…/73-zoom150-step-08-listen.png`). The header buttons are still icons only at that zoom.
    - The card's text is 12–13 px. Nothing advances the card from the keyboard except Tab to its buttons.

## What worked

- **The ring and the "→ target" label.** The learner never had to look for a control, even on a hidden tab (the Mixer) or inside the Display panel. On 1440 × 900 and at 150 % zoom, no ringed control was ever under the card. The page scrolls it into view (Wobble's LFO row).
- **The notes after each Step point at a picture, and the picture agrees.** Rings on Osc 1's Harmonics in Bass, the missing 4th Harmonic in Pluck, and the peak lifting a Harmonic in Acid were all visible in the Viewers.
- **Acid's Resonance Step fixes the first run's worst gap.** The Cutoff is set near a Harmonic before Resonance goes up, exactly as the first run asked, and the effect is unmistakable.
- **Listen** frees both hands and keeps the Viewers moving. The Timeline shows the Filter Envelope as a jump on each Note.
- **The heading Tooltips** now carry the signal chain ("then sent to the Filter") and the meaning of "subtractive". The Cutoff, Resonance and Waveform Tooltips each give an experiment to try.
- **The Demo explains itself.** One plain sentence per part, and it says so when a Note stops it.
- **The end card** names what differs from the Preset and offers "Match the Preset". That is the only place the overshoot in Step 5 got caught.

## Where they got stuck or gave up

- **"Pull the Attack all the way down"** (Bass Steps 9 and 13): pulling the fader all the way down (1 ms) doesn't count, because the target is 2 ms. The learner had to use "Do it for me".
- **A drag that overshoots still ticks the Step.** The Cutoff ended at 32 Hz instead of 280 Hz, and the note described a "dark hum" the Viewers didn't show. The learner only found out on the last card.
- **A Step that is done before you touch it** (Bass Step 10, Filter Decay): the tick and the snapped value came with no action.
- **The signal chain is never stated.** Bass follows the order (Oscillators, then Filter, then Amp), but no card says the sound flows from one to the next. The first card is about building a bass. The last card says "through the whole signal chain" as if the learner already knew it. The first four Steps are about a second Oscillator, which is a detour for someone who wants the basics.
- **The card hides the picture it talks about** at 1920 × 1080 and at 150 % zoom (the Filter Spectrum, its Curve, the Maths formula).
- **The Viewers still have no Tooltip or label.** The Steps say "Filter Spectrum", "Oscillator Scope", "Amp Scope", "the Curve". Only the Oscillators heading Tooltip tells the learner which picture is the Scope and which the Spectrum.
- **The Timeline's two oranges** (Filter Envelope fill, Effective Cutoff line) are unchanged, in both themes, and the legend still has no Tooltip.
- **Explore first means no Tutorials.** The only doors are the welcome (shown once) and the Patch name.

## What the learner could explain afterwards

> "A synth starts with **oscillators**: waves at the note's pitch. A saw has every **harmonic**, a square only the odd ones, a narrow pulse misses every fourth. You can mix in a second oscillator an octave down for weight. Its harmonics fill in between the first one's.
>
> The sound then goes through the **filter**, which takes harmonics away; that's the 'subtractive' part. The **cutoff** is where it starts cutting, and turning it down makes the sound darker. **24 dB** cuts twice as steeply as 12. **Resonance** is a peak at the cutoff that makes the harmonic sitting there ring out; at 80 % it nearly turns the sound into a single sine. The **filter envelope** moves the cutoff up at each note and lets it fall: that's the thump in a bass and the 'yow' in acid. An **LFO** can move it instead, over and over: that's the wobble.
>
> Last, the **amp** shapes the loudness of each note with its own envelope: **attack**, **decay**, **sustain** and **release**. Sustain at zero makes a note fade even while held, which is a pluck.
>
> So: oscillators make the harmonics, the filter removes some and can move over time, and the amp shapes the loudness."

That explanation is all supported by what they saw. The order of the stages came from the heading Tooltips and the order of the Bass Steps, not from any Tutorial text. The ADSR words came from the Amp Envelope Tooltip and the Steps together. Compared with the first run, Resonance is now understood from the picture, not from a Tooltip hidden in Display. I could not check that anything "sounds" darker or squelchy; that is inferred from the Viewers.

## The teacher's 15-minute lesson plan with it

Set-up: Light theme, a 1920 × 1080 projector at 100 % (not 150 %, so the card stays small), Display open with Harmonics and Curve on.

1. **(0–2 min) Hook.** Play the Demo for 30 s; read the captions aloud, because 13 px won't reach the back row. Press a key to stop it.
2. **(2–3 min) The chain.** Draw Oscillators → Filter → Amp on the board. The screen doesn't show it, and the Tutorial doesn't say it.
3. **(3–9 min) Acid Tutorial, Steps 1–4, with Listen on.** The 24 dB Slope, Cutoff to 250 Hz, Resonance to 80 %, Amount +3.5 oct. Pause on Step 3 and point at the tall spike on the 2nd Harmonic. Use the arrow keys rather than dragging in front of the class, so the Step doesn't tick on an overshoot. Before Step 2, take a Snapshot from Display; no Tutorial does that for you.
4. **(9–12 min) Pluck Tutorial, Steps 1–3.** Pulse shows the missing 4th Harmonic; Amp Sustain to zero shows a note dying while held. Skip the "every tenth" claim, or count the ticks on the board.
5. **(12–15 min) Wobble from Step 7** (Do it for me through Step 6). The LFO plot, the Cutoff's arc and the Timeline all swing together. Finish with the question: "Which stage did each Tutorial change most?"

This is much easier than in the first run. The Tutorials give the teacher a script, targets on screen, and the Resonance moment for free. The teacher still has to bring the signal chain and avoid the two Attack traps. They should also keep the browser at 100 %, or the card covers the Filter Spectrum.

## Would they…

- **Like it:** yes. The learner had two "oh!" moments this time: the rings sorting the two Oscillators, and the Resonance peak in Acid.
- **Share it:** yes. The teacher would send the Acid Tutorial to a colleague. The learner would share it with "click Tutorial on the welcome".
- **Come back:** yes for both. The learner would do the other three Tutorials; the teacher would rehearse the lesson.
- **Recommend to a class:** yes for a teacher-led lesson. For students alone, nearly: the Tutorials carry them through, but the "all the way down" Steps will stop some of them, and nobody tells them the chain.

## Findings

1. **A drag that passes the target ticks the Step, even if it ends far from it.** Bass Step 5: one drag took the Cutoff from 2.00 kHz to 32 Hz, past the 280 Hz target. The Step ticked and the note described a "dark hum" while the Filter Scope was flat. Only the last card flagged it ("Not quite the Preset yet: Cutoff"). 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/10-bass-05-done.png`
2. **"Pull the Attack all the way down" doesn't accept all the way down.** Bass Steps 9 (Filter Attack) and 13 (Amp Attack) target 2 ms. The fader's bottom is 1 ms, which is outside the 5 % tolerance, so Next stays greyed out after doing exactly what the card says. The learner needs "Do it for me". 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/90-attack-all-the-way-down.png`
3. **The Tutorials never state the signal chain.** The welcome, the first card and the Steps never say the sound flows Oscillators → Filter → Amp. Only the last card says "through the whole signal chain". The Bass Tutorial, which the welcome opens, spends its first four Steps on a second Oscillator. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/02-tutorial-first-card.png`
4. **The card covers the picture the Step asks you to watch.** At 1920 × 1080 it hides the bottom of the Filter and Amp Spectrums, including the frequency axis and the Maths formula, which is cut mid-line. At 150 % zoom it covers almost all of the Filter Spectrum while the Step says "watch the Curve jump up and fall back". 1920 × 1080 and 1280 × 720 at scale 1.5. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/64-teacher-light-maths.png` and `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/73-zoom150-step-08-listen.png`
5. **A Step can be done before the learner touches it.** Bass Step 10 (Filter Decay, 180 ms) appears already ticked. Init's 250 ms is within tolerance and is silently snapped to 180 ms. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/10-bass-10-ask.png`
6. **After Explore there is no visible way to the Tutorials.** The only doors are the one-time welcome and the Patch name ("Init") in the header. The About panel doesn't mention them. The welcome's Tutorial button doesn't say it opens Bass or how long it is. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/30-explore.png`
7. **The Viewers, the ADSR faders and the Timeline legend still have no Tooltip.** The Steps name "Filter Spectrum", "Oscillator Scope", "Amp Scope" and "the Curve", but nothing on those pictures says which is which. The Timeline still draws the Filter Envelope and the Effective Cutoff in two similar oranges. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/31-hover-Osc-spectrum.png`
8. **The "→ target" label covers its neighbour.** It sits over the "OSC 2" tab (Bass Step 1), the Filter Mode icons (Cutoff, Resonance) and the Cutoff readout (Acid Step 4, Amount), so the learner can't read the Cutoff while its Envelope is being set. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/42-acid-04-listen-900.png`
9. **The ring goes back onto the Display button after the Ideal Step is done.** It looks like something there is still to do. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/10-bass-04-done.png`
10. **"Every tenth Harmonic is missing" (Pluck Step 2) can't be read off the picture.** The Harmonic numbers stop at 7. 1440 × 900. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/50-pluck-2.png`
11. **Still small on a projector.** The Tutorial card's text is 12–13 px and the Demo's captions are 13 px at 1920 × 1080. The card can only be advanced from the keyboard by Tabbing to its buttons. 1920 × 1080. `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher-2/61-demo-02.png`

## Compared with the first run

- **Fixed: "no Tooltip on the core of the lesson"** (first run, finding 1). The Oscillators, Filter and Amp headings, Waveform, Octave, Cutoff, Resonance, Envelope Amount, Mode and Slope now explain themselves, and the Oscillators Tooltip names the Scope and the Spectrum.
- **Fixed: "where do I start"** (finding 2, first half). The welcome offers a Tutorial, and the Tutorials ring each control in turn. Partly undone by finding 6: after Explore, the Tutorials are hidden behind the Patch name.
- **Fixed: Resonance showed nothing.** Acid sets the Cutoff near a Harmonic first, and the peak is unmistakable.
- **Fixed: the Demo hooked but didn't teach.** It now has a caption per part.
- **Partly fixed: the best aids hidden in Display.** Bass turns on Ideal and explains it. Snapshot, Maths, Guides and the Curve Tooltip are still only in the Display panel, and no Tutorial uses them.
- **Remains: no visible signal chain** (finding 2, second half). It's now in a Tooltip, but not on screen and not in any Tutorial text (finding 3).
- **Remains: the Viewers and the Timeline legend have no Tooltip; the two oranges** (finding 7).
- **Remains and worse on a projector** (first run, finding 3). Small text is unchanged, and the new card now covers the Spectrums at 1920 × 1080 and at 150 % zoom (findings 4 and 11).
- **Remains in a new form: drag sensitivity.** The first run's Amp Attack jump is now a Tutorial problem, because an overshooting drag still ticks the Step (finding 1).
- **New:** the "all the way down" trap (2), the Step done on arrival (5), target labels over neighbours (8), the lingering Display ring (9), and the uncountable tenth Harmonic (10).

Not verified: anything heard (timbre, loudness, the Demo's and Listen's sound). Judged from the Viewers only.
