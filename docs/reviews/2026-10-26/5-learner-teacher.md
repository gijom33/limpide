# Review 5: the learner, or the teacher

Run on the live site (https://gijom33.github.io/limpide/, version 1.8.1, build 2ba9f3a) on 26 Oct 2026. I used headless Chromium driven by Playwright, starting with empty storage. The learner had a 1440 × 900 window; the teacher had 1920 × 1080, and I also tried 1280 × 720 at device scale 1.5 to stand in for 150 % browser zoom on a projector. I can't hear, so everything below about sound is judged from the Viewers. Screenshots are in `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher/` (shortened to `…/5-learner-teacher/` below; the findings at the end give full paths).

## First impression

**Learner:** "It says it's a synthesizer that *shows you what each stage does to the sound*. That's what I'm here for. Behind the box I can see three coloured panels with wavy pictures under them. I'll click Explore instead of the Demo, because I want to try it myself." (`…/01-arrival.png`)

After Explore the box closes and that's it. "OK, lots of knobs. Where do I start? Is it left to right?" Nothing on screen says that the sound goes from Oscillators to Filter to Amp. The colours (green, orange, violet) and the left-to-right order hint at it, but the learner has to guess.

**Teacher (1920 × 1080):** "Four panels across, big graphs, a dark theme with a Light option. That's projector material. The welcome line is basically my lesson objective."

## What they tried, in order

1. **Explore, then hovered things to find out what they are.** Tooltips are long, written in plain words, and often end with a "try this, watch that" line, which is great. The Tooltip for Hold, for example, says it keeps the Note sounding "so both hands are free to turn knobs while you watch". But the controls the learner hovered first gave nothing: the **Oscillators**, **Filter** and **Amp** headings, the **Waveform** picker, the **Cutoff** and **Resonance** knobs, **Octave**, **Semitone**, and each Attack/Decay/Sustain/Release fader. Neither did any Viewer (the two Scopes, the three Spectrums, the Amp Scope). I hovered them for up to 2.5 s and focused Cutoff from the keyboard; no Tooltip appeared, and none of these elements has one in the DOM. Meanwhile Key Track, Retrigger, Glide, Velocity, Slope and the LFO Destination each have a full paragraph. The section-level ones (Tuning, the two Envelope headings, LFO & Envelopes) work. (`…/03-hover-Cutoff-knob.png` shows Cutoff hovered with no Tooltip.)
2. **Noticed the graphs move before playing anything.** The Oscillator and Filter Scopes already show a saw wave and the Spectrums a row of spikes labelled "A4", while the Amp Viewers are flat (`…/02-explore.png`). Learner: "Is it making sound already? Oh, the Amp one is flat, so maybe not." Nothing explains it. It could be a great teaching point ("the oscillator is always there, the Amp lets it out"), but right now it's a puzzle.
3. **Played a note with the A key.** The C4 key lights green, and all three Spectrums now say "C4". The Amp Scope and Spectrum come alive, and the Timeline draws a violet shape (`…/05-note-held-key-a.png`). On the first key press, the Amp Scope plainly comes alive.
4. **Turned on Hold and dragged Cutoff down** from 2.00 kHz to 126 Hz. This is the moment it works. In the Filter Spectrum the dashed curve slides left, and the Harmonics under its slope shrink to a few stubs. The Filter Scope trace goes from a sharp saw to an almost smooth sine. The Amp Viewers follow, and the Timeline's orange Effective Cutoff line steps down (`…/09-cutoff-low.png`). Learner: "Oh! The spikes on the right are the 'brightness', and the knob cuts them off."
5. **Raised Resonance to 60 %.** A bump appears at the knee of the curve (`…/10-resonance-high.png`). With the Cutoff at 126 Hz the bump sits left of the fundamental, so no Harmonic was boosted and nothing else visibly changed. The learner didn't understand what Resonance did, and there was no Tooltip to ask.
6. **Opened Display.** Its Tooltips are the best teaching text on the site:
   - Harmonics: a tick on every Harmonic, numbered from the fundamental.
   - Curve: "Harmonics under the slope get quieter; a bump at the Cutoff is Resonance".
   - Guides, Snapshot (with a "take one, then turn a knob" exercise), and Freq Log/Lin ("like a ladder").

   The Curve Tooltip is where the learner finally learned what Resonance looks like. But they had to go hunting in a settings panel to find it.
7. **Turned on Maths, Guides and Ideal** (`…/12-maths-guides-ideal.png`):
   - The Oscillator Spectrum shows `bₙ = 2 / (π n)` with "every n: each Harmonic 1/n of the first", and the Ideal rings sit on the Harmonic tips.
   - The Filter Spectrum shows `|H| = 1 / √((1 − x²)² + (x / Q)²)`, `x = f / fc`, and the Ideal rings show where each Harmonic should land after the Filter.
   - Resonance now reads "Q 4.57", Sustain "−3.1 dB", and the Timeline labels "126 Hz".

   Learner: "The rings landing exactly on the spikes means the maths is right. Cool, but the formula is tiny." The formula text is about 10 px high, in the bottom-left corner of the Spectrum, right next to the "100" axis label.
8. **Changed the Waveform** to Sine, then Square, using the icons without a Tooltip. With Square, the Oscillator Spectrum loses every other spike, and the Scope is a square (`…/13-waveform-square.png`). The learner saw the gaps but had no word for "odd harmonics only" without a hint.
9. **Opened the Mixer tab.** Osc 1 is at 100 %, while Osc 2, Noise and Sub are at 0 % (`…/14-mixer-tab.png`). That explains why Osc 2's knobs looked dim, and the Tuning Tooltip says as much.
10. **Pushed the Amp Attack up and played a note.** A small drag of the fader sent it straight to 5.74 s. Early in the note the Amp Scope trace is nearly flat and the Timeline's violet curve starts low (`…/15-slow-attack-early.png`). 1.8 s later the trace is full-size and the curve has climbed (`…/16-slow-attack-later.png`). Learner: "So the Amp is the volume over time. Attack is how long it takes to get loud."
11. **Set the Cutoff to 32 Hz and the Filter Envelope Amount to +5 oct, then played short notes.** The Effective Cutoff line jumps up at each note and falls back, and only two or three Harmonics show in the Filter Spectrum between notes (`…/18-filter-envelope.png`). The Timeline holds three things in two oranges: the Filter Envelope (a brown-orange fill) and the Effective Cutoff (an orange line), plus the Cutoff knob as a faint dashed line. The legend has no Tooltip; the explanation sits on the "LFO & Envelopes" heading. Learner: "Which orange is which?"
12. **Teacher, 1920 × 1080:**
    - Hold, a note, and Snapshot, then the Cutoff turned down. The grey Snapshot trace keeps the full saw and every Harmonic, while the coloured trace shows what is left (`…/22-teacher-snapshot-vs-low-cutoff.png`). The teacher would build the lesson around this before/after picture.
    - Space froze the Viewers (`…/23-teacher-frozen.png`), and the Light theme reads well (`…/24-teacher-light-theme.png`).
    - At 150 % zoom the header buttons become icons only (play, note, hold, sliders, info), and the LFO & Envelopes row with the Timeline falls below the fold (`…/25-projector-150pct-zoom.png`).
13. **Teacher tried the Demo as a hook.** It moves through Presets (Kick, Acid, Poly Pluck…) with knobs visibly turning; an automated knob gets a blue ring (`…/30-demo-12s.png`). It's spectacular, but nothing on screen says what is changing or why, so it hooks the class rather than teaching it.

## What worked

- **Cause and effect is real and immediate.** Turn the Cutoff and you watch the Harmonics go, the wave round off, and the Effective Cutoff line move, all at once in three places. This is the product's promise, and it delivers.
- Showing the same signal at each stage (Oscillator, then Filter, then Amp), each with a Scope and a Spectrum, makes the chain readable once you know to read it left to right.
- **Snapshot plus Freeze** give a teacher exactly the before/after still they need.
- **The Maths Layer is a gift to a physics teacher:**
  - the Fourier coefficients of the saw;
  - the second-order low-pass magnitude formula with Q;
  - the Ideal rings proving that the measured spectrum matches theory;
  - Resonance shown as Q and Sustain in dB.
- Wherever a Tooltip exists, it is excellent: it says what the control does, then gives an experiment to try.
- The Light theme, four panels across at 1920 px, and large Viewers suit a projector.

## Where they got stuck or gave up

- **"Where do I start?"** right after Explore. There is no "start here", and no arrows or words saying Oscillator → Filter → Amp.
- **No Tooltip on the core of the lesson:** Cutoff, Resonance, Waveform, the three stage headings, and the Viewers themselves. Meanwhile the Tooltips that do exist name things the screen never labels: "the Scope", "the Spectrum", "the Response Curve", "the Oscillator Tap", "the Filter Tap", "the Viewers". The learner can't tell which picture is "the Oscillator Tap".
- **Resonance:** the learner gave up on what it does until they found the Curve Tooltip in Display. The Cutoff they had left at 126 Hz also put the peak below the note, where it shows nothing.
- **The Timeline's two oranges** (Filter Envelope fill and Effective Cutoff line) are hard to tell apart, and the legend has no Tooltip. The y axis is labelled in Hz (10k, 1k, 100) while the violet Amp curve shares the plot with no level scale.
- **On a projector** the Maths formulas and axis labels are about 10 px (`…/22-teacher-snapshot-vs-low-cutoff.png`); the back row can't read them. At 150 % zoom the toolbar loses its words.
- The Amp Attack fader is very sensitive: a small drag went from 10 ms to 5.74 s.

## What the learner could explain afterwards

> "A synth starts with an **oscillator**: a wave repeating at the note's pitch. A saw wave isn't one pure tone; the spectrum shows it's a fundamental plus a whole ladder of **harmonics** at 2×, 3×, 4× the frequency, each one quieter: the maths says the n-th one is 1/n of the first. A square wave only has every other one.
>
> Then the **filter** takes harmonics away. That's why it's called subtractive. A low-pass filter keeps what's below the **cutoff** and turns down what's above it, along that dashed curve. Turn the cutoff down and the high harmonics disappear, the wave goes from spiky to round, and it should sound darker. **Resonance** makes a bump in the curve right at the cutoff, so harmonics near it get louder.
>
> Last is the **amp**, which decides how loud the note is over time: the **envelope**. **Attack** is how long it takes to get loud, **Decay** how fast it falls to the **Sustain** level while you hold the key, and **Release** how long it fades after you let go. A second envelope can move the cutoff the same way, so each note opens bright and then closes. An **LFO** is a slow wave that wobbles a knob for you.
>
> So: oscillator makes the harmonics, filter removes some, amp shapes the loudness."

That explanation is all supported by what they saw. Two parts came from Tooltips they had to hunt for, not from the controls themselves: "harmonics" (the Display panel and the Pulse Width Tooltip) and what Resonance looks like (the Curve Tooltip in Display). I could not check that the low Cutoff "sounds darker"; that is the learner's inference from the picture.

## The teacher's 15-minute lesson plan with it

Set-up: Light theme, a 1920 × 1080 projector, the Init Patch, Display open with Harmonics and Curve on.

1. **(0–2 min) Hook.** Play the first 20 s of the Demo. "Every one of these sounds comes from three steps. Let's take one apart." Press a key to stop it.
2. **(2–5 min) Oscillator.** Turn Hold on and play C4. Point at the green Spectrum: "one note, many frequencies: the harmonics, numbered 2, 3, 4…" Switch Saw → Square → Sine and have the class call out what happens to the ladder (every other one gone; only one left). For physics classes, turn on Maths and Ideal: bₙ = 2/(πn), and the rings sit on the spikes.
3. **(5–9 min) Filter.** Back to Saw. Take a Snapshot. Turn the Cutoff down slowly and ask, "what's disappearing?" The grey trace stays as "before". Then raise Resonance with the Cutoff near the 3rd–5th Harmonic so the bump lifts one of them. Show the |H| formula and Q.
4. **(9–12 min) Amp.** Raise the Amp Attack, play and release a note, and read the violet Timeline together: Attack, Decay, Sustain, Release. Then Filter Envelope Amount up with a short Decay for a "pluck"; point at the orange line jumping on each note.
5. **(12–15 min) Recap and a question.** Draw Oscillator → Filter → Amp on the board, because the screen doesn't. Ask: "Which knob would you turn to make it brighter? Softer at the start?" Optionally, an LFO on Cutoff for "wah".

It's doable, but the teacher has to bring the structure and the vocabulary: the order of the stages, the names "Scope" and "Spectrum", and where to set Resonance so it shows. They would also need to rehearse once, because the Cutoff and Resonance controls give no hint in class.

## Where a tutorial would have helped (for the second run after issue 40)

- **Right after Explore:** a first step saying "the sound flows left to right: Oscillators → Filter → Amp", and asking the learner to play a key and hold it.
- **Naming the Viewers:** "this is the Scope (the wave over time), this is the Spectrum (which frequencies are in it)". The Tooltips already use these words; the tutorial has to attach them to the pictures.
- **The Cutoff step:** "turn Cutoff down and watch the spikes on the right of the orange Spectrum disappear". This is the single best moment, so the tutorial should engineer it, with a Snapshot taken first.
- **The Resonance step:** it should set the Cutoff near a Harmonic first, so the bump visibly lifts it. Without that, Resonance showed nothing in this run.
- **Waveform:** say why Square has gaps (odd Harmonics only).
- **The Timeline:** point at which line is which (violet loudness, orange Cutoff, the faint dashed knob).
- **Display → Maths** as an optional "for the curious" last step, since it's hidden in a settings panel and is the best part for a physics class.
- **A teacher mode or step-through** that can be advanced from the keyboard, with large captions readable on a projector.

## Would they…

- **Like it:** yes. The learner had a real "oh!" moment when the Harmonics vanished under the Cutoff.
- **Share it:** yes, the teacher would send it to a colleague. The learner would share it with a friend who makes music, but with "click Display → Maths, and hover the headings" as instructions.
- **Come back:** yes for the teacher (to rehearse and run the lesson). The learner would come back maybe, once the tutorials exist; on their own they'd stall on Resonance and the LFO.
- **Recommend to a class:** yes for a teacher-led lesson. Not yet for students alone, because the core controls and the Viewers carry no explanation, and there's no "start here".

## Three findings, ranked

1. **Core controls and the Viewers have no Tooltip.** Cutoff, Resonance, Waveform, Octave/Semitone, the Oscillators/Filter/Amp headings, and every Scope, Spectrum and Timeline have none. Other Tooltips refer to them by names the screen never shows ("Scope", "Spectrum", "Oscillator Tap", "Response Curve"), so a learner can't map words to pictures. Screenshot: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher/03-hover-Cutoff-knob.png`
2. **No visible signal chain and no "start here".** After Explore, nothing says the sound flows Oscillators → Filter → Amp, or what to try first. The best teaching aids (the Curve Tooltip that explains Resonance, Maths, Ideal, Snapshot) are hidden in the Display panel. Screenshot: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher/02-explore.png`
3. **Not readable on a projector.** The Maths Layer formulas and Viewer axis labels are about 10 px even at 1920 × 1080. The Timeline's Filter Envelope and Effective Cutoff are two similar oranges with no legend Tooltip. At 150 % zoom the header buttons lose their words and the Timeline falls below the fold. Screenshots: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher/22-teacher-snapshot-vs-low-cutoff.png` and `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/5-learner-teacher/25-projector-150pct-zoom.png`

Not verified: anything heard (timbre, loudness, the Demo's sound). Judged from the Viewers only.
