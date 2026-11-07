# Persona review 5: the learner, or the teacher

Ran on version 1.26.1 (build 38df0ad) on 2026-11-07, on the live site. Headless Chromium and WebKit (Playwright), empty storage, GoatCounter blocked so the runs are not counted · learner 1440 × 900, teacher 1920 × 1080, and 1280 × 720 at scale 1.5 and 960 × 540 at scale 2 for a projector at 150 % and 200 % zoom · about 35 minutes. This is the fourth run of this persona, after [1.8.1](../2026-10-26/5-learner-teacher.md), [1.10.0](../2026-10-27/5-learner-teacher.md) and [1.16.0](../2026-10-30/5-learner-teacher.md). I can't hear, so every claim about sound comes from the Viewers. Screenshots are in `/private/tmp/rev5-1107/`.

## First impression

**Learner (1440 × 900):** "A welcome card over the synth: 'A synthesizer you can see through: the wave and its Harmonics after every stage, as you play.' Two buttons, Play the Demo and Take the Tour. I'm here to learn, so: the Tour." Behind the card, the four sections are readable left to right, and the Viewers already draw a saw and its Harmonics before I've played anything. (`/private/tmp/rev5-1107/first-1440.png`)

**Teacher (1920 × 1080):** "Six steps of Tour that play by themselves while I talk: that is the first five minutes of my lesson, done. Then a Tutorial menu with nine titles, each with a one-line promise. I can build a lesson from this without preparing a patch."

## What they tried

1. **The Tour, at 1920 × 1080 and at 1440 × 900.** Six steps: Oscillators and Mixer, Filter, Amp, LFOs, Synth Geek Layer, Tutorials. Each one plays Notes and turns a control by itself, with a "Watch…" line first: Osc 1 switches Saw, Square, Sine; the Cutoff sweeps down and back and Resonance rises; each Amp stage changes in turn and the pictures freeze with a FROZEN badge and a caption ("Attack, the rise"); LFO 1's Depth rises and the dotted Cutoff line swings on the Envelope Timeline. Step 5 rings the Display button, step 6 the Tutorial button, and offers "Build a Sub Ladder". Done leaves the page on Init, keyboard back at C4. (`/private/tmp/rev5-1107/t2-1b.png` to `t2-5b.png`)
2. **But the Tour scrolls past the control it is turning.** To fit the Viewers and the card, it scrolls the page down. At 1920 × 1080, the Filter step leaves only the bottom of the ringed Cutoff (its label and "488 Hz") at the top edge, the knob out of view (`/private/tmp/rev5-1107/t2-1b.png`). In the Amp step, at both sizes, the ringed Attack fader is cut off: the class sees "Attack 600 ms" and the Timeline, not the fader moving (`/private/tmp/rev5-1107/tour1440-3.png`, `/private/tmp/rev5-1107/t2-2b.png`). At 1440 × 900 the Filter step is fine, knob and all (`/private/tmp/rev5-1107/tour1440-2.png`).
3. **The Tutorial menu:** nine Tutorials, each with a line: Sub Ladder, Bass, Acid, Pluck, Wobble, PWM Bass, FM Ladder, Ring Bell, Deep Breath (`/private/tmp/rev5-1107/tutorial-menu.png`). The Patch panel lists them again as a Tutorials row, and each Tutorial Preset carries a mortarboard where it sits in its own category.
4. **Bass, all 15 Steps, at 1440 × 900.** Each Step opens on the right tab, rings its control and shows the target ("→ 50 %"). I did the slider Steps with the arrow keys after "Go to the control" (Osc 2 Octave, Cutoff to 281 Hz, Filter Envelope Amount, Attack, Decay, Sustain, Amp Attack), and the button Steps with "Do it for me". Stepping the Osc 2 level one arrow at a time ticked the Step at 47 %, a fair tolerance. Every Step's note says what to watch, and the picture agrees: after Cutoff 281 Hz the Filter Spectrum's top half empties; after 24 dB the slope steepens (`/private/tmp/rev5-1107/Bass-1440-s04-done.png`, `/private/tmp/rev5-1107/Bass-1440-s05-done.png`). The end card: "This is the Bass Preset, built by you."
5. **The new Tutorials.** Sub Ladder in WebKit (10 Steps): sine, triangle, square, pulse and saw in turn, each with the Harmonics it keeps and an instrument it sounds like ("the 3rd a ninth as strong as the first. Soft and round, like a recorder."), then the Sub filling the odd rungs under the saw's circles (`/private/tmp/rev5-1107/wk-SubLadder-1440x1-06.png`, `/private/tmp/rev5-1107/wk-SubLadder-1440x1-10.png`). FM Ladder at 1920 × 1080 (6 Steps): one sine line grows a ladder at FM 50 %, with the Ideal's circles on each rung (`/private/tmp/rev5-1107/FMLadder-1920x1-03.png`). Ring Bell at 1440 × 900 (11 Steps): Osc 2 +1 octave +3 semitones, and the two Ring lines sit between the Harmonic numbers, as the note says (`/private/tmp/rev5-1107/RingBell-1440x1-05.png`). Each end card names the next Tutorial, so a learner alone can chain them.
6. **Acid at 150 % zoom (1280 × 720 at scale 1.5).** The card now docks over the LFO row, and in Step 4 the tall Resonance peak on the Filter Spectrum is in full view with the card open (`/private/tmp/rev5-1107/Acid-1280x1.5-04.png`). No "LIMITING" in the whole run.
7. **Tooltips and the Synth Geek Layer.** Cutoff's Tooltip says what to watch ("the dashed Response Curve… and the Harmonics past its slope shrink"). With Geek on, it adds a History line (Moog's 1964 paper, the Minimoog's "Cutoff Frequency"). The Saw Tooltip gives bₙ = 2 / (π n) with every symbol explained; Amp Attack gives its curve and says τ = 3.33 ms now; Key Track gives fc = Cutoff × 2^(k·(n − 60)/12). The values switch to engineering units: Resonance "Q 1.32", Sustain "−3.1 dB", Key Track shows the Cutoff it gives. The Viewers' Tooltips say what each picture is. Hovering a Harmonic reads "627 Hz, D#5 +14¢" (`/private/tmp/rev5-1107/tip-viewer.png`, `/private/tmp/rev5-1107/geek-on.png`).
8. **Presets as lesson material.** Loading FM Ladder from the Patch panel now shows its about line in a bar under the header ("Turn FM down and watch the Harmonics fold away"), and keeps it there until closed (`/private/tmp/rev5-1107/load-FMLadder.png`). Between Steps, a plain line under the logo describes the current sound ("a saw with a square an octave down, muffled, sustained").
9. **The projector.** At 1920 × 1080 the Viewers are big (each Spectrum about 290 px tall) and the Light theme, under Display, reads well on a projector (`/private/tmp/rev5-1107/light-1920.png`). But the control labels and values are 10 to 12 px, and the inactive values (the Filter Envelope's "5.00 ms" while Amount is 0) are a dim grey: unreadable from the back of a room. Zooming the browser to 150 % makes them readable, but each Spectrum shrinks to about 115 px and the LFO row drops below the fold (`/private/tmp/rev5-1107/zoom150.png`). At 200 % the Viewers are pushed below the fold entirely (`/private/tmp/rev5-1107/zoom200.png`).
10. **Closing the welcome card with Escape** puts the focus on the Demo button, and its Tooltip of about 120 words opens over the Amp panel. It stays open while I hover elsewhere, even beside a second Tooltip, until I click somewhere (`/private/tmp/rev5-1107/tip-cutoff.png`). Closing with × or a click outside does not do this.

## What worked

- **The Tour is the lesson's opening.** It plays and turns knobs by itself and says what to watch before it happens. The FROZEN pauses let a class read the Amp Envelope's shape.
- **Nine Tutorials now cover the new sources.** Sub Ladder is the best first lesson I've seen here: five waves, their Harmonics and an instrument for each in ten Steps. FM Ladder and Ring Bell make sidebands and inharmonic pitches visible in six and eleven Steps.
- **Cause and effect is on screen in every Step I checked.** The Step's note and the picture agree, and the Ideal's marks (circles, squares, triangles) show which wave each line belongs to.
- **The Synth Geek Layer teaches the next level.** Formulas with every symbol defined, live numbers ("3.33 ms now") and sourced History lines.
- **The Preset about line stays on screen** once loaded. The teacher can read it to the class.

## Where they got stuck

- **The Tour hides the hand on the knob.** The Amp step, at both sizes, and the Filter step at 1920 × 1080, scroll the moving control out of view. On a projector, the class sees the effect and only a number for the cause.
- **Projector legibility.** At 100 % the labels are too small for the back row, and zooming shrinks the Viewers, the very thing to show. There is no larger-text option for a class.
- **The stray Demo Tooltip** after Escape, mentioned above. A teacher closing the card from the keyboard in front of a class gets a wall of text over the Amp.
- Small: the Bead often sits on or beside the ringed control (Resonance in Bass, Velocity at 150 % in Acid, the 24 dB button). It never blocks a click, but it draws the eye away from the ring. It can be switched off under Display.

## What the learner could explain afterwards

> "The sound flows left to right. The **Oscillators** draw a wave over and over: the pitch is how fast, the shape is which Harmonics it has. A sine has one, a triangle and a square the odd ones, a saw all of them, a pulse leaves gaps. The **Sub** is a square an octave down that fills the odd rungs under the saw. **FM** lets Osc 2 wobble Osc 1's pitch so fast that one line becomes a ladder. **Ring** multiplies two waves, and you hear the sum and the difference, off the ladder: a bell. The **Filter** turns down everything above the **Cutoff**, faster at 24 dB, **Resonance** lifts what sits at the Cutoff, and its **Envelope** opens it on each Note. The **Amp** shapes loudness over time: attack, decay, sustain, release. **LFOs** turn a knob over and over by themselves."

That is the whole signal chain and the three extra sources. This time, all of it came from the Tour and the Tutorials, not from the Tooltips.

## Would they

- **Like it:** yes. The Tour turns the knobs for you, and Sub Ladder connects each shape to a sound in ten Steps.
- **Share it:** yes. The learner would share "Take the Tour". The teacher would send colleagues the Tutorial names, now that each Preset explains itself.
- **Come back:** yes. Nine Tutorials is several sessions, and each end card points to the next.
- **Recommend to a class:** yes, now also for students alone. For the projector, teacher-led, in the Light theme at 100 %, with the teacher reading the values aloud.

## Since the last run (1.16.0, 2026-10-30)

- **Fixed: all three findings.** Five Tutorials now teach the new sources (Sub Ladder, PWM Bass, FM Ladder, Ring Bell, Deep Breath), and a loaded Preset's about line stays on screen. The Synth Geek Layer, which replaced the Maths Layer, gives the Oscillator Spectrum the general fₙ = n × f₀ instead of the saw's formula, and keeps bₙ = 2 / (π n) on the Saw. The LFO Destination Tooltip now lists FM, with "raise FM first".
- **Also fixed:** at 150 % the open card no longer hides the Filter Spectrum in Acid's Resonance Step. No unexplained "LIMITING" this time.
- **New:** the welcome card's Take the Tour, the Tour itself (6 steps that play themselves), History lines on the Tooltips, the Light theme.
- **New problems:** the Tour scrolls the control it turns out of view; the Demo Tooltip after Escape on the welcome card.
- **Still there:** the small type for a projector, now with a known trade-off, since zooming shrinks the Viewers.

## The 15-minute lesson plan

Set-up: 1920 × 1080 projector at 100 %, Light theme, Bead off.

1. **(0–5 min) The Tour.** Take the Tour from the welcome card; read each "Watch…" line aloud before the synth moves. In the Amp step, point at the Timeline, and read the values aloud, since the faders are out of view.
2. **(5–10 min) Sub Ladder, Steps 5–10.** Sine, triangle, square, pulse, saw: ask the class to predict which lines appear before each click. End on the Sub filling the odd rungs.
3. **(10–14 min) Acid, Steps 1–4.** The Snapshot, the Cutoff down, then Resonance 80 %: the peak on the Filter Spectrum.
4. **(14–15 min) Close.** "Which stage made the Harmonics, which took them away, which shaped the loudness?" Homework: FM Ladder and Ring Bell, alone.

## Three findings, ranked

1. **The Tour scrolls the control it is turning out of view:** in the Amp step at 1440 × 900 and 1920 × 1080, only the ringed Attack's label shows, not its fader, and at 1920 × 1080 the Filter step's Cutoff knob is cut off at the top edge, so the class sees the effect but not the cause. `/private/tmp/rev5-1107/tour1440-3.png`, `/private/tmp/rev5-1107/t2-1b.png`
2. **On a projector, the type is too small and zooming costs the Viewers:** labels and values are 10 to 12 px, with dim grey inactive values, at 1920 × 1080, and 150 % browser zoom shrinks each Spectrum from about 290 to about 115 px and pushes the LFO row below the fold; there is no larger-text mode for a class. `/private/tmp/rev5-1107/light-1920.png`, `/private/tmp/rev5-1107/zoom150.png`
3. **Closing the welcome card with Escape leaves the Demo button's 120-word Tooltip open over the Amp panel,** staying through hovers elsewhere until a click (× or a click outside does not). 1440 × 900. `/private/tmp/rev5-1107/tip-cutoff.png`

## For the inbox

- The Tour scrolls the control it turns out of view (Amp step at 1440 × 900 and 1920 × 1080, Filter step at 1920 × 1080): the class sees the effect, not the knob.
- On a projector the 10–12 px labels and dim values can't be read from the back, and zooming to read them shrinks the Viewers; a class needs larger text without smaller pictures.
- Escape on the welcome card leaves the Demo's long Tooltip open over the Amp panel until a click.
