# Persona review 1: the curious contact

iPhone 15 emulation in Playwright WebKit (touch, mobile), screen 393 × 852 with a page of 393 × 659 once Safari's bars are out · a first pass of 60 s, then a second look of about 2 min · 2026-10-30 · version 1.16.0 (build 328a370), live site, fresh browser with nothing stored.

Screenshots and scripts: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-1/`. Below, screenshots are named by their file name in that folder.

Sound was not checked by ear. The page's audio engine started on the first tap and its clock kept running, keys lit up and the plots moved with the notes, so sound was very likely playing.

## First impression

"A dark box with a rainbow squiggle: *Limpide. A subtractive synthesizer that shows you what each stage does to the sound.* Synthesizer, so music. 'Touch and hold any control to see what it does', OK. Then a version number with a blue box round it, then 'Made by… Claude Code… AI Hero methodology… Sound: The Web Audio API… License: MIT… Privacy: GoatCounter, IP address…' Is this the terms and conditions? Where do I start?" (`01-landing.png`)

In ten seconds they understood it's a music thing, made by Guillaume with an AI, and free. They did not see a single button to tap: Play the Demo, Follow the Tutorial and Close sit below the bottom of the box at this height (their top is at 681 px in a 659 px page), and nothing says the box scrolls. They found them by swiping up inside the box (`02-welcome-scrolled.png`).

## What they tried

**First pass, 60 s**

1. Swiped up in the welcome box, found three buttons, tapped the green **Play the Demo**. (`02-welcome-scrolled.png`)
2. The box closed and a card docked at the bottom: **Kick**, a row of 15 little bars filling in orange, a **Stop** button, and a plain sentence: "A kick drum, made by the synth: a tone that falls fast in pitch, each hit a little deeper." (`10-demo-1s.png`)
   - *"Oh, it's telling me what I'm hearing. A drum made by the synth. Cool."*
3. At 10 s it moved on to **Acid**: "The Filter opens bit by bit and starts to ring: a squelchy, talking bass line." The orange line in the box above jumped into a spiky wiggle, and the Cutoff knob turned on its own. (`12-demo-10s.png`)
   - *"Squelchy, yes. And the line does look squelchy."*
4. Poly Pluck at 30 s, then **Tremolo Keys** at 45 s: "An electric piano with tremolo: an LFO on Volume makes the chords pulse in time, deeper and deeper. The Amp Scope swells and shrinks with it." The screen was now blue, with two sine waves and a purple dotted wave over a filled shape. (`15-demo-45s.png`)
   - *"Lost me. LFO? Amp Scope? Which one is that?"*
5. At 60 s, Self-Oscillation: "No Oscillator at all: the Filter sings on its own as it sweeps from low to high." Five of fifteen bars filled.

At 60 s they had heard sound, read three captions they understood and two they didn't, and could see the Demo was a third of the way through. Curious enough for a second look.

**Second look, about 2 min**

6. Let the Demo run on for a bit. Double Wobble at 75 s ("LFO 2 joins LFO 1 on the Cutoff, a fast flutter riding the slow sweep. One blue ring spans both"), Split Octave Bass at 90 s ("Osc 1 dropped an octave by its own Octave knob, Osc 2 on the Note a few cents off…"). Eight bars of fifteen. (`17-demo-75s.png`, `18-demo-90s.png`)
   - *"Every caption is more technical than the last. And it's only half done."*
7. Tapped **⌄** on the card: it folded to the name, the bars and Stop, and gave the screen back. (`19-demo-folded.png`)
8. Tapped a piano key to join in. The Demo stopped, and the card said **"The Demo stopped: you are playing now."** with **Play again**. It went away by itself after about five seconds. (`30-key-tap-mid-demo.png`)
   - *"Oh, fine, I didn't break it."*
9. Remembered "touch and hold", and held the **Cutoff** knob. A box opened: "Where the Filter starts to take Harmonics away… turn it down for a darker, muffled sound, up for a brighter one. Watch the dashed Response Curve on the Filter's Spectrum move…" (`32-hold-cutoff.png`)
   - *"Darker, muffled, brighter: I get that. That's the 'shows you' bit."*
10. Tapped **Tutorial** in the header: a menu of Bass, Acid, Pluck, Wobble (`45-tutorial-from-header.png`). In a second session, tapped **Follow the Tutorial** in the welcome instead: a card "Bass, 15 steps: A saw with a square an octave below, through a 24 dB Filter whose Envelope gives each Note a thump", with Listen and Start. Listen played the finished bass. (`40-tutorial-start.png`, `41-tutorial-listen.png`)
11. **Start**, step 1: "Raise Osc 2 in the Mixer to half." The page had switched to the right panel and drawn an orange ring round one slider, with a "→ 50 %" tag on it. Dragged it up with a finger, overshot to 98 %, then used **Do it for me**. (`42-tutorial-step1.png`, `43-tutorial-step1-dragged.png`)
    - *"It shows me exactly which one to move. Nice."*
12. Steps 2 and 3 (make Osc 2 a Square, Octave −1) with Do it for me. Step 4 is a "look" step: "Circles mark where Osc 1's saw puts its Harmonics, squares where Osc 2's square puts its own…", cut off with "…" until tapped. No circles or squares on screen: the Oscillator Spectrum (588 to 705 px) sits completely under the docked card (from 535 px), and the page did not scroll to it. (`44-tutorial-step4.png`, `46-tutorial-step4-text-tapped.png`)
    - *"What circles? I'll stop here. Fifteen steps is a lot for a phone on the bus."*
13. Closed the welcome in a third session and tapped **›** next to the sound's name three times: Pure Sine, Soft Triangle, Hollow Square, each a plain beep. Tapped the name: a sheet with a search box and chips, Tutorials, Start, Shapes, Intervals, Filter… and further along Bass, Leads, Pianos, Pads, Drums. (`51-next-preset-3.png`, `53-preset-menu.png`)
14. Tapped **Song**: a house loop played with the sound already chosen (Hollow Square). (`52-song-4s.png`)

## What worked

- **The Demo card.** The sound's name, a plain sentence about it, a 15-part progress bar and a Stop button are always on screen now. Kick and Acid are explained in words anyone gets ("a kick drum, made by the synth", "squelchy, talking bass line").
- **Stopping the Demo by playing a key** says so and offers Play again. No more "did I break it?".
- **Touch and hold explains a control on a phone**, and the welcome says so. The Cutoff text speaks in "darker, muffled, brighter", which is exactly what this person needs.
- **The Tutorial points at the control**: the panel opens by itself, the control gets an orange ring and a target ("→ 50 %"), and Do it for me is there for people who just want to watch.
- The header buttons have words under their icons (Demo, Tutorial, Song, Hold, Display, About), and the Preset sheet now has chips for Bass, Leads, Pianos, Pads, Drums.
- The fold button on the Demo card gives the screen back without stopping the music.

## Where they got stuck or gave up

- **The first screen has no button.** The welcome now holds the full About (Made by, Sound, Music, License, Privacy). At 393 × 659 it pushes Play the Demo, Follow the Tutorial and Close below the bottom of the box. The box does scroll, but nothing hints at it, and the only highlighted thing is the build number's link with a blue focus ring. At 393 × 740 the buttons just fit, so in a taller in-app browser this may not show. (`01-landing.png`)
- **The Demo captions drift into jargon.** From part 5 on they name LFO, Amp Scope, Osc 1 and 2, cents, "one blue ring", and don't say where to look. The Demo is also about three minutes long, 15 parts, so the persona never sees the end.
- **Tutorial step 4 talks about circles and squares nobody can see** on a phone: the plot is under the docked card. The welcome's line is still "subtractive synthesizer… each stage", and the Tutorial's opening is "a saw with a square an octave below, through a 24 dB Filter". Both are jargon for this person.
- **The › arrow starts with lesson sounds** (Pure Sine, Soft Triangle, Hollow Square). The fun ones are there, but only behind the chips in the Preset sheet.
- They stopped at about 3 minutes, in the Tutorial at step 4 of 15.

## Would they

- **Like the post: yes.** It looks polished, makes sound from one tap, and the Demo tells you what you're hearing.
- **Share it: no, not yet.** They now have words for it ("a synth that shows you what each sound looks like, with a demo that explains itself"), but the welcome reads like a legal page and the later captions lose them. They'd like it, not repost it.
- **Come back: maybe.** The Tutorial is a real goal ("build a bass"), but 15 steps is a laptop-at-home job, not a phone one.
- **Recommend it: yes**, to anyone who plays music, and to a curious kid: "hold any knob and it tells you what it does."

Could they say "it shows you what sound looks like"? Yes, nearly in those words, thanks to the Acid caption and the Cutoff explanation ("darker, muffled… watch the curve move"). That's the success line from issue 42 met, which it wasn't at 1.8.1.

## Since 1.8.1

Better:
- All three of 1.8.1's findings are fixed. The Demo has a docked card with the sound's name, a caption and Stop, so nothing scrolls away. Explanations open by touch and hold, and the welcome says so. A key tap that stops the Demo says "The Demo stopped: you are playing now" with Play again, and the 15-part bar shows how far along it is.
- New: the Tutorial (Bass, Acid, Pluck, Wobble), with the control ringed and a target shown, and Do it for me.
- The header buttons carry words, the Preset sheet has search and chips, and the Demo card can be folded.

Worse:
- The welcome grew. It now holds the About credits and privacy text, and at 393 × 659 its buttons fell below the fold. In 1.8.1 the big Play the Demo button was the first thing seen.
- The Demo grew from about 70 s to about three minutes, and its later captions are written for someone who already knows the words.

Unchanged: the welcome's first line ("subtractive synthesizer… each stage") is still jargon to this person.

Also noticed, not ranked:
- The page loads with keyboard focus on the build number's link (`328a370`), drawn with a blue ring in WebKit. It's the first highlighted thing on the screen (`01-landing.png`). A real iPhone may not draw the ring.
- A page error showed once when the "Demo stopped" card closed: `null is not an object (evaluating 'e.current.offsetHeight')`, from the docked card's resize watcher running after the card left the page. It didn't come back in a second run, and nothing visible broke.
- Tooltips such as "Filter Spectrum" and "Filter Scope" opened unasked in some runs. The logged events show they came from the test browser's leftover mouse pointer (`pointerType: mouse`), not from touch, so a real phone would not show them (`30-key-tap-mid-demo.png`).

## Three findings, ranked

1. **On a phone the welcome hides its own buttons.** The About credits (Made by, Sound, Music, License, Privacy) push Play the Demo, Follow the Tutorial and Close below the box at 393 × 659 (top at 681 px), and nothing hints that the box scrolls, so the first ten seconds show no button. Screenshot: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-1/01-landing.png`.
2. **The Demo's captions turn to jargon after the first four parts.** Tremolo Keys ("an LFO on Volume… the Amp Scope"), Double Wobble ("LFO 2 joins LFO 1 on the Cutoff… one blue ring") and Split Octave Bass ("Osc 2… a few cents off") lose a non-musician, while Kick and Acid are perfect. Seen at 393 × 659. Screenshots: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-1/15-demo-45s.png`, `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-1/18-demo-90s.png`.
3. **The Bass Tutorial's step 4 points at circles and squares hidden under its own card.** On a phone the Oscillator Spectrum (588 to 705 px) sits under the docked card (from 535 px), the page doesn't scroll to it, and the step's text is cut off with "…". Seen at 393 × 659. Screenshots: `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-1/44-tutorial-step4.png`, `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-1/46-tutorial-step4-text-tapped.png`.
