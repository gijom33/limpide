# Persona review 16: the synth neophyte, third read

Ran on the published site, version 1.26.1 (build `38df0ad`), on 2026-11-07.

What was read: the welcome, the Tour's six cards (each left running about 5 seconds), and all nine Tutorials in the menu's order (Sub Ladder, Bass, Acid, Pluck, Wobble, PWM Bass, FM Ladder, Ring Bell, Deep Breath, 106 Steps in all): every first card, every Step's instruction and note, every end card. First on a laptop (1440 × 900, Playwright Chromium, no MIDI). There, each Step was made by hand where a script could do it: knobs and faders dragged with the mouse until the readout showed the asked number, Waveform and Slope buttons clicked, Display options turned on in the panel. "Do it for me" was used only where the script could not act: a Step setting several faders, a stepped knob, a Destination picker, Glide from Off. Listen was pressed after every Step, with a screenshot during the loop. Then on a phone (393 × 852, Playwright WebKit, touch), every Tour card and every Step of every Tutorial with the card's text opened ("+"). The ringed control, Bead and the card were measured on each screen, the Steps were made with "Do it for me", and Ideal and the Snapshot were also turned on by hand. Profile and brief: [42](../../issues/42-reviews.md), profile 16. Last read: [the 1.21.1 report](../2026-11-02/16-synth-neophyte.md).

**Not checked:** the sound. The browser ran headless, so nothing was heard: where a note says what to hear, only the picture it points to was checked. The screenshots and scripts are in the session's scratch folder (`/private/tmp/rev16`), not in the repository.

## First impression

"A synthesizer you can see through." I don't know what a synthesizer is made of, but the pictures behind the welcome are already moving, and the orange button says "Take the Tour", so I take it. Ten seconds in, the first card tells me to watch the wave change shape, and it does: a ramp, then steps, then a smooth hill. I get it before I've read a word of the theory. That's a good start.

## What they tried

1. **The welcome.** Two lines and two buttons, Play the Demo and Take the Tour. The rest of the card (Made by, License, Privacy) is small print below. "Subtractive" has gone. "Take the Tour".
2. **Tour 1, Oscillators and Mixer (143 words).** The waveform buttons are ringed, and the synth switches Saw, Square, Sine by itself. "A saw has them all, so it buzzes; a square every other one, so it sounds hollow; a sine just the Note, so it sounds pure." I watched the lines on the Spectrum thin out as it said.
3. **Tour 2, Filter (133).** "A Filter is a tone knob you can sweep." The Cutoff knob is ringed and turning, and the lines sink under the dashed slope. Clear.
4. **Tour 3, Amp (151, the longest).** The four stages in plain words: "a Note's life story in four stages". The ringed fader moves before each Note, and the pictures freeze with "FROZEN Attack, the rise" under the text. That badge reads well now. The card ends "On the Amp Spectrum, all the lines rise and fall together", but on the laptop, frozen, that Spectrum was empty, and on the phone it was off the screen.
5. **Tour 4, LFOs (131).** "Like a slow, invisible hand on a knob." The Depth knob is ringed and climbs to 43 %, then 60 %, and the orange dotted line on the Timeline rises and falls. My favourite card.
6. **Tour 5, Synth Geek Layer (100).** New. The Display button is ringed. "It stays off until you switch it on." Fine, I left it off: it's for the curious, and I'm not there yet.
7. **Tour 6, Tutorials (75).** New. Presets are explained here ("Limpide's ready-made sounds"), and the card offers "Build a Sub Ladder" beside Done. I pressed it.
8. **Sub Ladder (10 Steps).** New, and the right first lesson: five waves in turn, and each note says what the lines do and what it sounds like ("Hollow, like a clarinet", "Nasal and thin, like an oboe"). I turned Cutoff all the way up by dragging, got a tick and a note, and moved on. Step 4 rings the Display button, then Ideal inside the panel, and the circles land on the lines. The end card says "This is the Sub Ladder Preset, built by you" and has a "Next: Bass" button.
9. **Bass (15).** "You will hear a buzzy saw turn into a dark, punchy bass." Steps 9 to 12 are still one fader each for the Filter's Envelope. "That fall is the thump" made it worth it.
10. **Acid (12).** "A squelchy, talking bass." The Snapshot left a grey trace for the rest of the Tutorial. Step 6 now sets all four Filter Envelope faders in one Step, all four ringed. Glide: "Watch the pitch dot glide along the piano", and there it was, a blue dot on the keys.
11. **Pluck (11).** "That fade is a pluck" is still the best line. Its Filter Envelope is one Step too.
12. **Wobble (14).** "The 'wub wub' of dubstep." Steps 1 to 6 are Bass's opening again (Osc 2 up, Square, −1 octave, 24 dB, Cutoff, Resonance), each with a fresh note. Sync and the triplet are still the hardest read, but "three wobbles in the time of two beats" got me there.
13. **PWM Bass (19).** New, and the longest. Steps 1 to 6 are lovely: the pulse thins to a needle, the gaps slide along the row, and then an LFO does the turning for you: "That is PWM". Steps 7 to 10 bring Osc 2 in, detune it, tune it back and take it out again, to show the same shimmer the other way. Steps 11 to 19 are the bass finish I'd done in Bass, Acid and Wobble: Sub, 24 dB, Cutoff, Resonance, Key Track, Velocity, Envelope Amount, three Filter faders, three Amp faders. I was skimming by Step 14 (finding 1).
14. **FM Ladder (6).** Short and magic: "the single line grows a ladder of new ones".
15. **Ring Bell (11).** "That is what makes metal sound like metal." Step 5 now says what the small numbers along the Spectrum's top are, so "slide off them and land in between" makes sense.
16. **Deep Breath (8).** "Like breath or distant surf." Its last card says "The synth is yours now: start from Init and make a sound of your own."
17. **Pressing Next before a Step is made** now says "Turn the ringed control first, or press Do it for me."
18. **The Tutorial menu** shows a line per Tutorial ("a Note that fades by itself, like a plucked string") and a tick on each one finished.
19. **The phone.** The Tour's cards fold to their "Watch…" line, and "+" opens the rest. Opened, the card takes the bottom 250 to 385 points of the 852. On all 106 Steps the ringed control was on the screen and clear of the card, and Bead was beside it, never under the card. The only time the ringed control left the screen was PWM Bass 5, after it was made, when the page scrolled up to the Oscillator Spectrum that the note names. That's the right picture to show. Two things bothered me (findings 2 and 3).

## What worked

- **The Tour shows before it tells.** Every card's first line is "Watch…" or "Find…", and the thing happens on screen.
- **Sub Ladder as the first Tutorial.** Each wave named by what it sounds like (whistle, recorder, clarinet, oboe, brass) and what its lines do. I can tell a square from a saw by ear now, or at least by eye.
- **Getting from one thing to the next.** "Build a Sub Ladder" at the end of the Tour, then "Next: Bass", "Next: Acid" and so on: I never had to open the menu.
- **The ring and the "→ 20.00 kHz" label**, on the laptop and the phone, and Bead perched beside the control. I never hunted for anything.
- **Dragging a knob near the number counts.** I let go of Resonance at 37 % for "about 35 %"; it snapped to 35 % and ticked.
- **The plain words in brackets:** Hz "vibrations a second", ms "thousandths of a second", cents "hundredths of a piano key", BPM, triplet. No word stopped me.

## Where they got stuck or bored

- **PWM Bass** (finding 1). Taken in the menu's order, it comes sixth, after four Tutorials that already built a bass, and its last nine Steps are that bass again.
- **Wobble's first six Steps** are Bass's first steps again. The notes are new, so it's a refrain more than a wall.
- **The Tour's cards are still long** (143, 133, 151, 131 words). The "Watch…" line first makes up for it.
- **On the phone, Next moves** (finding 2), and **a Display Step hides its own result** (finding 3).
- **Words never glossed:** "the Juno" (PWM Bass's first card: I guessed it's an old synth), and "levels in decibels" on Tour 5, which Acid glosses only later. "Velocity" in Acid 7 is "how hard you play a Note"; on a laptop keyboard I can't play hard, but Listen does it for me.

## Could they say what each part does?

- **Oscillators:** "They draw one wave shape over and over; how fast is the pitch, the shape is the colour. Sine pure, triangle soft, square hollow, saw buzzy, pulse nasal."
- **Filter:** "A tone knob. It turns down the high pitches above the Cutoff; Resonance makes a ringing bump there; its own Envelope can fling it open on every Note."
- **Amp:** "How loud a Note is over time: Attack rises, Decay falls to Sustain, Release fades when you let go."
- **LFO:** "A slow, invisible hand that turns a knob for you, over and over. Sync ties it to the beat; Retrigger starts it over on each Note."
- **And new:** "PWM: an LFO widening and narrowing a pulse, so one Oscillator moves like two."

They finished all nine Tutorials and wanted to for seven of them. They did PWM Bass's second half out of duty.

## Would they…

- **Like it:** yes. It's fun: things move when the words say they will, and the pictures are pretty.
- **Share it:** yes, the Tour plus Sub Ladder, with a friend who's never touched a synth. That's 16 Steps and they'd know what a waveform is.
- **Come back:** yes, to try Deep Breath's last line ("make a sound of your own"), and to switch on the Geek glasses now that I know what they're for.
- **Recommend the Tutorials to a beginner:** yes. Sub Ladder, Bass, Pluck and FM Ladder first. PWM Bass only once they love it.

## Since the last run (1.21.1, 2026-11-02)

| # | Finding then | Now |
|---|---|---|
| 1 | The end card names the next Tutorial but offers no button | **Answered.** "Next: Bass" and so on beside Done, on the laptop and on the phone, and the Tour ends with "Build a Sub Ladder" |
| 2 | The Spectrum's numbered places never introduced | **Answered.** Ring Bell 5 and Deep Breath 2 now say "the small numbers along the Oscillator Spectrum's top mark where each Harmonic belongs" |
| 3 | The frozen badge reads as a riddle; the Amp card is 168 words | **Answered for the badge** ("FROZEN Attack, the rise"). The card is 151 words, still the Tour's longest, and still names the Amp Spectrum, which is flat when frozen |
| 4 | Next before a Step says nothing | **Answered.** "Turn the ringed control first, or press Do it for me." |
| 5 | The Filter Envelope drill comes three times | **Partly.** Acid 6 and Pluck 11 set the four faders in one Step. Bass keeps four Steps, the first time it is met. The new PWM Bass brings the bass finish back for nine Steps (finding 1) |

New since then: the Tour has six cards (Synth Geek Layer and Tutorials added); Sub Ladder and PWM Bass were added, nine Tutorials in all; the menu has a line per Tutorial and ticks; Steps can set several faders at once; "Go to the control"; the end card says what differs from the Preset and offers "Match the Preset".

A note, not a finding: in my first, scripted pass, several end cards said "Not quite the Preset yet" and named controls whose readouts showed the asked number. Doing those Steps again by hand did not reproduce it: a knob let go at or near the number snapped to it, and the end card said "built by you". It looks like an artefact of the script.

## Findings, ranked

1. **PWM Bass is 19 Steps, the longest, and half of it is a bass already built.** Steps 7 to 10 bring Osc 2 in and take it out again, and Steps 11 to 19 (Sub, 24 dB, Cutoff, Resonance, Key Track, Velocity, Envelope Amount, three Filter faders, three Amp faders) repeat the finish of Bass, Acid and Wobble. Steps 1 to 6 are the lesson, and they are good. The menu doesn't show a Tutorial's length, so a learner going in order meets it sixth, with 106 Steps in all. Suggest folding the finish into one or two Steps ("Give it the bass finish: a dark, steep Filter that thumps on every Note", with "Do it for me" as the easy way), or a Step count in the menu.
2. **On the phone, Next moves between "not yet" and "done".** Before a Step is made, the row is Listen, Back, Go to the control, Do it for me, and Next wraps alone onto a second line at the left, dimmed. Once the Step is made, "Do it for me" goes and Next jumps to the right end of the first line. That happens on every Step of every Tutorial (screenshots: `pshots/Bass/08a-folded.png` and `08c-done.png`). A thumb that learnt where Next is taps empty space or Back. Suggest Next keeps one place, bottom right, in both states.
3. **On the phone, a Display Step done by hand hides what its note describes.** In Sub Ladder 4 and Bass 4 (Ideal) and Acid 2 (Snapshot), tapping the ringed option in the Display panel ticks the Step and shows the note, "A circle sits on each Harmonic of Osc 1…" or "The pictures now keep a faint trace…". But the panel stays open over the whole screen, so the circles and the trace can't be seen until Next closes it (`pi2.png`, `ps1.png`). On the laptop the panel leaves the Spectra in view. Suggest closing the panel once such a Step is made on a phone, or a note that starts "Close Display and look…".

## Lines for the inbox

- 2026-11-07, from review 16 (the synth neophyte) on 1.26.1: PWM Bass is 19 Steps, the longest, and Steps 7 to 19 bring Osc 2 in and out again and then repeat the bass finish of Bass, Acid and Wobble. Fold the finish into one or two Steps, or show each Tutorial's Step count in the menu.
- 2026-11-07, from review 16 on 1.26.1: on a phone, a Tutorial's Next button wraps alone to the bottom-left while a Step is not yet made, then jumps to the right end of the first row once it is, on every Step; keep it in one place.
- 2026-11-07, from review 16 on 1.26.1: on a phone, turning on Ideal (Sub Ladder 4, Bass 4) or taking the Snapshot (Acid 2) by hand leaves the Display panel over the whole screen, so the circles or trace the note describes are hidden until Next.
