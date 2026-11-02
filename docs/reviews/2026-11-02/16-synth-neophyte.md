# Persona review 16: the synth neophyte, second read

Read: the published site, version 1.21.1 (build `3015b1a`), 2026-11-02. The welcome, the Tour's four cards (each left running about 14 seconds), and all seven Tutorials in the menu's order (Bass, Acid, Pluck, Wobble, FM Ladder, Ring Bell, Deep Breath): every first card, every Step's instruction and note, every end card. First on a laptop (1440 × 900, Playwright Chromium, no MIDI), then on a phone (393 × 659, Playwright WebKit, touch), where the folded Tour cards were opened and closed. The Steps were made with "Do it for me", with a screenshot before and after each. Next was pressed once before a Step was made. Listen was then pressed on 14 Steps whose notes say what the pictures will do (Bass 1, 3, 8 and 15, Pluck 3 and 10, Wobble 7 and 11, FM Ladder 3, Ring Bell 4, 6 and 10, Deep Breath 5), with screenshots during the loop. Profile and brief: [42](../../issues/42-reviews.md), profile 16. Last read: [the 1.19.0 report](../2026-10-31/16-synth-neophyte.md). The words were rewritten since in [129](../../issues/129-words-fun-to-read.md).

**Not checked:** the sound. The browser ran headless, so nothing was heard. Where a note says what to hear ("a 'yow' on every Note", "like a clarinet"), only the picture it points to was checked. On the phone, Playwright's WebKit left a mouse pointer where a tap had been, so a Viewer's hover tooltip opened over the card in the first phone run. The tooltip opens only for a mouse, so an iPhone would not show it: the phone was run again with the pointer moved away, and that run is the one judged. The screenshots are in the session's scratchpad, not in the repository.

## First impression

"It still moves on its own, and now it talks to me. The Tour's first line on every card tells me what to watch ('Watch the wave change shape'), and I watched it happen. By the third card I knew what an Envelope was, all four faders of it. Then I built seven sounds and could tell you what each one did. I wanted to keep going, which I didn't last time."

## What they tried

1. **The welcome.** Same words as before ("A subtractive synthesizer…"). Subtractive is still not explained there, but the Tour's Filter card says what a Filter takes away, so it stopped mattering. "Take the Tour".
2. **Tour card 1, Oscillators and Mixer.** "Watch the wave change shape" came first, and the top picture went from ramp to staircase to smooth. "The top picture… The one below…" told me which picture was which. Harmonics are "the stack of pitches every Note is made of, one line each". Got it. Saw buzzes, square hollow, sine pure: I'll remember that.
3. **Tour card 2, Filter.** "A tone knob you can sweep." Lines sank, a bump rose. Clear.
4. **Tour card 3, Amp.** The best card now. Before each Note the synth changes one stage, and the pictures freeze with a FROZEN badge. All four stages are named in plain words. The card is long (168 words) and the badge reads oddly (finding 3).
5. **Tour card 4, LFOs.** The Depth knob is ringed and in view, and the orange dotted line on the Timeline rises and falls, as the words say. "Like a slow, invisible hand on a knob." The card ends with "Build a Bass".
6. **Bass.** Its own first card, in plain words. "Start from Init, the plain sound every Tutorial begins with". Pressing Next before the Step: the button is dimmer and nothing happens, still with no word why (finding 4). Step 4 is no longer ticked in advance: Ideal is off, the Step says what it is, and turning it on drew circles and squares that "slot in between". Steps 5 to 7 explain Hz, dB and Resonance in brackets. Step 8 announces the Filter's Envelope ("The Filter has an Envelope too…"), and with Listen I could see the dashed line jump and fall and the Timeline's dotted line spike on every Note.
7. **Acid.** "A squelchy, talking bass, the sound of acid house." The Snapshot left a faint trace for the rest of Acid, and it was gone when Pluck started.
8. **Pluck.** "That fade is a pluck" is still the best moment. With Listen, the Timeline drew one fading peak per Note.
9. **Wobble.** "The 'wub wub' of dubstep": I laughed. Steps 1 to 3 are the Bass's first three, but each note is new. Sync and the triplet (Steps 9 and 10) were the hardest read of the session but made sense: "three wobbles in the time of two beats".
10. **FM Ladder.** Six Steps. "FM, frequency modulation, lets Osc 2 bend Osc 1's pitch", and with Listen one line grew a ladder. No arithmetic left.
11. **Ring Bell.** "That is what makes metal sound like metal." Step 5 says the new pitches "slide off the neat row of Harmonics and land between its lines", but with two sines on screen there are only three lines and no row (finding 2).
12. **Deep Breath.** Step 2's "the Sub's square fills every other place, Osc 1 every fourth, and some places stay empty": which places? (finding 2). "Like breath or distant surf" for Pink Noise: lovely.
13. **Each end card** says "This is the … Preset, built by you" and names the next Tutorial in words, "It is under Tutorial, at the top". I had to open the menu each time (finding 1). The last one says "The synth is yours now: start from Init and make a sound of your own."
14. **The phone.** Each folded Tour card now shows what to watch, and on every Step the ringed control sat clear above the card. Bead stood beside it most of the time. A Tutorial's end card, folded, shows only the summary's first two lines, so the line naming the next Tutorial is hidden behind "+".

## Could they say what each part does?

- **Oscillators:** "They draw a wave shape over and over. How fast is the pitch, the shape is the colour: saw buzzy, square hollow, sine pure." Yes.
- **Harmonics:** "The stack of pitches a Note is made of, one line each on the Spectrum." Yes, which was a no last time.
- **Filter:** "A tone knob: it turns the high pitches down above the Cutoff. Resonance makes a ringing peak there." Yes.
- **Amp:** "How loud a Note is over time: Attack up, Decay down to a level, Sustain held, Release when you let go." Yes, all four this time.
- **LFO:** "A slow invisible hand that turns a knob for you. Sync ties it to the beat." Yes.
- **FM and Ring:** "One wave bending another's pitch so fast it becomes a new tone; two waves multiplied into a bell." Yes, roughly.

They finished all seven Tutorials. They wanted to for Bass, Acid, Pluck, Wobble and Ring Bell, and FM Ladder and Deep Breath were short enough not to mind.

## What was fun

- The Tour's "Watch…" first lines, and the Amp card's freezes: watching the shape of a Note stop on the screen.
- The everyday pictures: "like a clarinet", "a thick blanket instead of a thin sheet", "the 'wub wub' of dubstep", "what makes metal sound like metal", "like breath or distant surf", "That fade is a pluck."
- The ring, the "→ 50 %" label and Bead beside the control: no hunting, on the laptop or the phone.
- The plain line under the Patch's name as the sound changes ("a saw with a square below, muffled, opening on each Note, sustained"): a running summary of what I'd done.
- The end card's "built by you".

## Where it was dull

- **The Filter Envelope drill is still there.** Bass 8 to 12, Acid 5 to 9 and Pluck 10 to 14 are each five Steps on the same five controls. Each now says why before the number, so it is a lot better, but the third time round is still a chore.
- **The refrain.** Taken in order, the same plain glosses come back: "The Cutoff is where the Filter starts to cut; Hz counts vibrations a second" four times, "(dB, decibels, is how loudness is counted.)" four times, "A Note is a stack of pitches, its Harmonics, and the … Spectrum draws each as a line" five times. 129's decision 2 chose this so that each Tutorial stands alone, and it is the right call for someone who starts at Ring Bell. For someone going in order it is a refrain, not a wall.
- **The Tour's cards are longer:** 131, 143, 168 and 150 words, against about 100 to 125 last time. The "Watch…" line first makes up for it on the laptop, and on the phone the card folds. Only the Amp card felt long.

## Words still met without a plain gloss

| Word | Where | Note |
|---|---|---|
| subtractive | The welcome | Never said, but the Tour's Filter card carries the idea |
| the row, a place | Ring Bell 5 ("the neat row of Harmonics… between its lines"), Deep Breath 2 ("every other place") | The small numbers 2, 3, 4… along the Spectrum's top are never introduced (finding 2) |
| Pulse | Pluck 1: "Make it a Pulse." | Its note says what it does to the lines, not what it is. Pulse Width, the next Step, half explains it |
| the loop | Wobble 9: "each 'wub' lands on the loop's beat" | Listen's loop is never called a loop |
| FROZEN "down to a level" | The Tour's Amp card badge | See finding 3 |
| spike, fundamental, timbre, partial | The Viewers' tooltips ("one spike each… the fundamental first. Their heights are the recipe of the timbre") | 129 left the tips out on purpose (they are reference, read on demand). A neophyte who hovers a picture on the laptop meets the old words again. Noted, not a finding |

## The last report's findings

| # | Finding (1.19.0) | Now |
|---|---|---|
| 1 | Harmonic never explained | **Answered.** Tour card 1 and each Tutorial's first use: "the stack of pitches every Note is made of" |
| 2 | Tour 1's four-word sentence, and a fader on a hidden tab | **Answered.** Two short sentences, and "The Mixer, on its own tab, sets how loud each one is" |
| 3 | The Filter Envelope unannounced; Decay and Sustain unexplained | **Answered.** The Amp card names all four stages and the Filter's own Envelope; Bass 8 announces it |
| 4 | The first card leads with the Preset's dense description | **Answered.** Each Tutorial has its own warm intro |
| 5 | Tour 4 points at an off-screen knob | **Answered.** It points at the Timeline's dotted line, and the ringed Depth knob is in view |
| 6 | Five names for Harmonics | **Answered** in the Tour and the Tutorials ("lines" throughout). The tooltips still say spike and partial, by 129's decision |
| 7 | Ring Bell and FM Ladder in arithmetic | **Answered.** No 3.38, no minor third; "three piano keys up". Ring Bell 5's "neat row" leans on a picture never introduced (finding 2) |
| 8 | Bass Step 4 ticked in advance; Ideal unexplained | **Answered.** Ideal starts off, and the Step says what it is |
| 9 | Repeated notes and the Envelope drill | **Partly.** No note is repeated word for word, and each drill Step gives its reason first. The five-Step Filter Envelope drill comes three times, and the glosses form a refrain when the Tutorials are taken in order (see "Where it was dull") |
| 10 | Hz, ms, dB never explained | **Answered.** In brackets at first use, in every Tutorial |
| 11 | Init never explained | **Answered.** "Init, the plain sound every Tutorial begins with" on every first card |
| 12 | The phone's folded Tour card shows the chain line | **Answered.** It shows the "Watch…" line |
| 13 | The end card does not point on; the menu gives bare names | **Answered in words.** The menu has a line per Tutorial ("a Note that fades by itself, like a plucked string"), and each end card names the next. There is no button, and on the phone the line is folded away (finding 1) |
| 14 | Acid's Snapshot stays through later Tutorials | **Answered.** Cleared when Acid ends: Pluck shows no trace |
| 15 | Next does nothing before a Step is made, and does not say why | **Not answered.** Unchanged on both devices. 129 left it as a behaviour, not words, and it is not in the inbox (finding 4) |

## Would they…

- **Like it:** yes. The Tour is now a real lesson, and the Tutorials have jokes in them.
- **Share it:** yes, the Tour and Pluck, with a friend who has never touched a synth. That's a change: last time, only with a friend who makes music.
- **Come back:** yes, to make "a sound of my own" from Init, as the last card invites.
- **Recommend the Tutorials to a beginner:** yes, all seven, Bass and Pluck first.

## Findings, ranked

1. **The end card names the next Tutorial but offers no way there.** It says "Next: Acid, a talking bass… It is under Tutorial, at the top." and then only Done. The Tour's last card has a "Build a Bass" button, and the momentum is highest right here. On the phone the line is folded under "+", so the only pointer on is hidden. Suggest a primary button with the next Tutorial's name ("Next: Acid") beside Done, which also carries the phone.
2. **The Spectrum's numbered places are never introduced, and two notes lean on them.** Ring Bell 5: "The two new pitches slide off the neat row of Harmonics and land between its lines". With two sines there are three lines on screen and no row, only the small numbers 2, 3, 4… along the top. Deep Breath 2: "the Sub's square fills every other place, Osc 1 every fourth, and some places stay empty." Suggest one line in Tour card 1 ("the small numbers along the top mark where each Harmonic belongs: 2 is twice the Note, 3 three times…"), and these notes pointing at the numbers: "land between the numbers along the top".
3. **The Tour's frozen badge reads as a riddle.** "FROZEN down to a level: Decay", "FROZEN up: Attack", "FROZEN held: Sustain" (the stage's gloss before its name, as a label). It comes under a 168-word card, the longest in the Tour. Suggest the name first and the gloss after, as the card does: "Frozen: Decay, the fall to a steady level". The card could lose its "The Amp Scope is what you hear…" sentence, since the pictures freeze once the Note has faded and the Amp Scope is then a flat line.
4. **Next before a Step is made still does nothing and says nothing** (last report's 15, left out of 129 as behaviour). On the laptop and the phone the button only dims a little. Suggest a line the first time: "Turn the ringed control first, or press Do it for me."
5. **The Filter Envelope drill comes three times, five Steps each** (Bass 8 to 12, Acid 5 to 9, Pluck 10 to 14), and a learner who goes in order also meets the same glosses four or five times. 129 kept the Steps because each Preset needs them. Suggest that from the second Tutorial on, one Step sets the four faders together ("Shape its Envelope: a quick open, a short fall, nearly shut while held") with "Do it for me" as the easy way, or that the repeated glosses get shorter once a Tutorial has been finished.

## Lines for the inbox

- 2026-11-02, from review 16 (the synth neophyte) on 1.21.1: a Tutorial's end card names the next one ("It is under Tutorial, at the top") but has no button to start it, unlike the Tour's "Build a Bass", and on a phone that line is folded away.
- 2026-11-02, from review 16 on 1.21.1: Ring Bell 5 ("slide off the neat row of Harmonics and land between its lines") and Deep Breath 2 ("fills every other place") lean on the Spectrum's numbered places (2, 3, 4… along its top), which the Tour and the Tutorials never introduce.
- 2026-11-02, from review 16 on 1.21.1: the Tour's frozen badge puts the gloss before the stage ("FROZEN down to a level: Decay"), which reads as a riddle: name first, as the card does; the 168-word Amp card could lose its Amp Scope sentence, as that picture is a flat line once frozen.
- 2026-11-02, from review 16 on 1.21.1: Next before a Step is made still does nothing and says nothing (review 16's finding 15 of 2026-10-31, left out of 129 as behaviour).
- 2026-11-02, from review 16 on 1.21.1: the five-Step Filter Envelope drill comes three times (Bass, Acid, Pluck), and in order the same glosses recur four or five times: one Step for the four faders after the first Tutorial, or shorter glosses once one Tutorial is finished.
