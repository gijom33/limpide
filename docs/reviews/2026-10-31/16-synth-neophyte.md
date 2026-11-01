# Persona review 16: the synth neophyte

Read: the published site, version 1.19.0 (build `b1e3e63`), 2026-10-31. The welcome, the Tour's four cards and all seven Tutorials in the menu's order (Bass, Acid, Pluck, Wobble, FM Ladder, Ring Bell, Deep Breath), every card and every Step's `say` and `note`. First on a laptop (1440 × 900, Playwright Chromium, no MIDI), then on a phone (375 × 812, Playwright WebKit, touch). Bass's first two Steps were done by hand (a fader dragged, Listen pressed); the rest used "Do it for me", with a screenshot before and after each Step. The Tour cards were left to run for about 8 seconds each so the moving controls could be seen. Profile and brief: [42](../../issues/42-reviews.md), profile 16. The review feeds [129](../../issues/129-words-fun-to-read.md).

**Not checked:** the sound. The browser ran headless, so nothing was heard. Where a note says what to hear ("a 'yow' on every Note", "a hollow, woody colour"), only the picture it points to was checked, not the sound. The fact-checker (13) checks those claims against the engine. The phone was 375 × 812 as briefed, not the profile's 393 × 852. On the phone, the run's third trip to the Tutorial menu once timed out after Acid. A fresh page then ran the other five Tutorials normally, and a person tapping the menu did not hit it. This is probably the test script, not the page.

## First impression

"It's pretty, and it moves on its own: nice. The first card of the Tour told me the sound starts in the Oscillators and that the Filter, the Amp and the LFOs come after. That much I got. Then every card leaned on a word I didn't have, Harmonics, and by the end of the Bass I'd turned fifteen controls and could not have told you what a Harmonic is. I did learn what the Filter, the Amp and an LFO do, and the Tour is why."

## What they tried

1. **The welcome.** "A subtractive synthesizer that shows you what each stage does to the sound." I didn't know what subtractive meant, so I picked "Take the Tour".
2. **Tour card 1, Oscillators and Mixer.** The wave picture changed by itself from a ramp to a staircase to a smooth wave: fun. The card says "here only Osc 1's fader is up", but the Mixer tab wasn't showing, so I couldn't see any fader. It names "the Oscillator Scope" and "the Oscillator Spectrum", and the screen gives neither picture a name. I guessed the top one was the Scope.
3. **Tour card 2, Filter.** The spikes on the right sank as the Cutoff knob turned down, and a bump rose when Resonance went up. That matched the words. "Darker" made sense even without sound.
4. **Tour card 3, Amp.** The Attack fader moved by itself and the card explained Attack and Release well. Decay and Sustain, the two faders between them, were never mentioned.
5. **Tour card 4, LFOs.** "An LFO is an Oscillator too slow to hear as a pitch": I liked that. But "the dot on the Cutoff knob swings up and down" pointed at a knob that had scrolled off the top of the screen, on the laptop and on the phone. The orange dotted line on the Timeline did rise and fall.
6. **"Build a Bass".** The orange ring around the control and its "→ 50 %" label are great: I always knew where to look and how far to go. Dragging the Osc 2 fader to 50 % by hand ticked the Step. Pressing Next before the Step was done did nothing, and nothing said why.
7. **Bass, Step 4:** "Open Display and see that Ideal is on (turn it on if not)." It was already ticked before I did anything, so I never opened Display and never found out what Ideal is. The note then talks about circles and squares.
8. **Bass, Steps 8 to 15:** a Filter Envelope the Tour never mentioned, then eight Envelope settings in a row ("Set its Decay to about 180 ms", "Lower its Sustain to about 15 %", …). This is where I got bored.
9. **Acid.** The intro promised "the classic acid line", which means nothing to me, but "squelchy" and the "yow" got me going. Step 2 asked for a Snapshot, "a faint copy of the Viewers", and that grey copy then stayed on the pictures through Pluck, Wobble and FM Ladder, with no word about it.
10. **Pluck.** "That fade is a pluck" was the best moment of the session. Then the same four Filter Envelope Steps came round again.
11. **Wobble.** The first three Steps are the Bass's first three, word for word. The LFO Steps were fun: I could watch the ring around the Cutoff knob.
12. **FM Ladder, Ring Bell, Deep Breath.** Lost. "Sum and difference", "about 3.38 and 1.38 times the Note", "a minor third", "partial", "3 dB an octave". Each ends with the same three Steps (Cutoff to 20 kHz, Resonance down, Sustain up) and the same notes.
13. **The phone.** The same words, in a card showing two lines until it is opened. On the Tour, those two lines are the least useful sentence ("The sound starts here: … sends it on to the Filter.…"). On a Tutorial's first card, Start sits under two lines of the densest text in the app. Opened, a card covers about half the screen, but the control and its picture still fit above it.

## Could they say what each part does?

- **Oscillators:** "They make the sound: a wave shape played over and over, and the shape changes the sound." Yes.
- **Filter:** "It makes the sound darker by cutting off the top. Resonance makes a peak where it cuts." Yes.
- **Amp:** "How loud a Note is over time: how fast it starts and how long it fades after you let go." Yes, but only Attack and Release. Decay and Sustain came later, from the Pluck, not from a definition.
- **LFO:** "A slow wobble that turns a knob for you, over and over." Yes. The Tour's best line.
- **Harmonics:** "The spikes in the bottom picture?" That is as far as they got, after 32 uses of the word.

They finished Bass and Acid because they wanted to, and the rest because they were asked to. They would have stopped after Pluck.

## What was fun

- The Tour turning its own knobs while the pictures change: the best way into the page.
- The ring and the target label ("→ Square", "→ 50 %") on the control a Step wants. You never hunt for it.
- "Do it for me", for when a knob won't land.
- The lines that use everyday words: "That fade is a pluck." "a 'yow' on every Note", "when it moves, you will hear it talk", "like breath or distant surf", "struck, not bowed", "That fall is the thump", "the acid slide. Watch the pitch dot glide along the piano". These are 129's voice already.
- The tick on a Step, and the end card's "This is the Bass Preset, built by you."

## Where they got bored

- **The Envelope drill.** Bass Steps 9 to 15, Acid 6 to 9 and 12 to 14, Pluck 3 to 6 and 11 to 14: "Pull … all the way down", "Set its Decay to about N ms", "Lower its Sustain", "Shorten its Release". That is three Tutorials in a row with the same four-fader drill, each Step a number and a one-line note.
- **The same notes again.** "Above the Cutoff, Harmonics now fall away twice as fast: the Curve steepens and the upper bars sink." appears 4 times (Bass 6, Acid 1, Pluck 7, Wobble 4). "Nothing is lifted at the Cutoff any more: wide open, the Filter leaves the sound as it is." appears 3 times (FM Ladder 5, Ring Bell 8, Deep Breath 7). Bass 1 to 3 and Wobble 1 to 3 are the same Steps with the same notes. In all, 7 notes are repeated across 17 Steps.
- **The long notes:** FM Ladder 3 (51 words), Ring Bell 6 (46), Deep Breath 5 (44), Ring Bell 4 (40), Deep Breath 2 (38). The notes average 19 words, and each Tour card runs to about 100 to 125 words.

## Where they got lost: each synth word met unexplained

The first place each word appears, in the order a neophyte meets them. "Unexplained" means no card or Step says what it is in plain words. The tooltips do, but a neophyte doesn't hover.

| Word | First met | What happened |
|---|---|---|
| subtractive | Welcome: "A subtractive synthesizer" | Never explained in the Tour or the Tutorials. Only the Filter's tooltip says it |
| Waveform, cycle | Tour 1: "An Oscillator plays its Waveform, one cycle after another" | Not said to be a wave's shape |
| timbre | Tour 1: "the Waveform sets the timbre" | Its only use, unexplained |
| source | Tour 1: "how much of each source goes on" | The sources (Osc 1, Osc 2, Ring, Noise, Sub) aren't named |
| Scope, Spectrum | Tour 1: "The Oscillator Scope draws the Waveform; the Oscillator Spectrum, its Harmonics" | Neither picture is labelled on screen or ringed by the card |
| **Harmonics** | Tour 1: "its Harmonics: a saw has every one, a square only the odd ones, a sine just one" | **Never explained, and used 32 times.** The key word of the whole app |
| Curve | Tour 2: "go away under the Curve" | The dashed line is never pointed at |
| Envelope (Amp) | Tour 3: "following the Amp Envelope" | Explained through Attack and Release; Decay and Sustain never are |
| Depth | Tour 4: "as the synth raises its Depth" | Understood from the moving knob |
| Envelope Timeline | Tour 4 | Found by elimination |
| Init | Every Tutorial's first card: "Build it from Init" | Never said to be the plain starting sound |
| 24 dB, Slope, dB | Bass intro: "a 24 dB Filter", Bass 6: "Choose the Filter's 24 dB Slope" | The note helps ("fall away twice as fast"); dB itself is never explained |
| **Filter Envelope**, Amount | Bass intro: "a 24 dB Filter whose Envelope gives each Note a thump"; Bass 8: "Set the Filter Envelope's Amount to +2.5 octaves" | The Tour only had an Amp Envelope. The note's "Each Note now opens the Filter, then lets it close again" is good but comes after the number |
| Display, Ideal | Bass 4: "Open Display and see that Ideal is on (turn it on if not)." | The Step is ticked already, so Display is never opened. Ideal is used 4 times and never explained |
| Hz, kHz, ms | Bass 5: "about 280 Hz"; Bass 9: "about 2 ms" | Units never explained |
| Decay, Sustain | Bass 10 and 11 | Learnt from what happened, best in Pluck 3 |
| acid (the style), squelchy, Glide | Acid intro: "slide between Notes for the classic acid line" | Glide's Step explains it well. "Acid line" is never explained |
| Snapshot, Viewers | Acid 2: "a faint copy of the Viewers" | Viewers is never explained. The copy then stays through 4 later Tutorials |
| Velocity | Acid 10: "Raise the Filter's Velocity to 50 %." | The note explains it ("Harder Notes now open the Filter further") |
| Pulse, Pulse Width | Pluck intro and 1: "the Pulse Width (25 %) decides where" | Never explained |
| retriggered, low-pass, LFO again | Wobble intro: "The LFO sweeping a resonant 24 dB low-pass, retriggered" | Five synth words in the first line, which is the line the phone shows |
| FM, vibrato | FM Ladder intro: "swinging Osc 1 hard (FM)"; FM 3: "too fast to hear as vibrato" | FM is never spelt out, vibrato never explained |
| partial, rung, ladder, spike, bars | FM 4: "lets every partial through"; Bass 6: "the upper bars sink" | Five names for what is shown as one thing |
| Ring, sum and difference, minor third, Semitone | Ring Bell intro and 4 to 5 | Explained as arithmetic ("about 3.38 and 1.38 times the Note"), which is no help to a neophyte |
| Sub, "Sub Two Down", Pink/White Noise | Deep Breath intro: "Sub Two Down with a breath of Pink Noise" | "Sub Two Down" is another Preset's name, given without saying so |

## Would they…

- **Like it:** yes. It looks alive, and the Tour is a real "oh, I see" moment.
- **Share it:** yes, the Tour, with a friend who makes music.
- **Come back:** maybe, for the Tour and Pluck. Not for FM Ladder or Ring Bell as they read today.
- **Recommend the Tutorials to a beginner:** Bass and Pluck, yes. The others, not until the words change.

## Findings, ranked

Each finding quotes the live text and gives a suggested rewrite in 129's voice: light and warm, short sentences, one idea, a synth word explained the first time. The rewrites are drafts for the owner and the fact-checker, who checks each claim against the engine.

1. **"Harmonic" is never explained, though the Tour and Tutorials use it 32 times.** Tour 1's last paragraph is the place.
   - Now: "The Oscillator Scope draws the Waveform; the Oscillator Spectrum, its Harmonics: a saw has every one, a square only the odd ones, a sine just one."
   - Rewrite: "Two pictures show it. The top one, the Scope, draws the wave's shape. The bottom one, the Spectrum, shows its Harmonics: every Note is really a stack of pitches, the Note plus fainter ones above it, and each spike is one of them. A saw has them all, so it buzzes. A square has every other one, so it sounds hollow. A sine has just the Note, so it sounds pure."
   - And per 129's decision 2, the first note in each Tutorial that uses the word says it again in a few words ("Harmonics, the fainter pitches stacked above the Note, …").

2. **Tour 1 packs four new words into one sentence and points at a tab that isn't shown.**
   - Now: "An Oscillator plays its Waveform, one cycle after another, as many times a second as the Note's pitch, and the Waveform sets the timbre. The synth is stepping Osc 1 from Saw to Square to Sine. The Mixer, on its own tab, sets how much of each source goes on: here only Osc 1's fader is up."
   - Rewrite: "An Oscillator draws one wave shape, its Waveform, over and over, hundreds of times a second. How fast sets the pitch; the shape sets the colour of the sound. Watch: the synth is switching Osc 1 from Saw to Square to Sine. (The Mixer, on its own tab, is where you set how loud each Oscillator is.)"

3. **The Filter Envelope arrives unannounced and fills half the Bass.** The Tour shows one Envelope, the Amp's, and only its Attack and Release. Bass Steps 8 to 12 then set a second Envelope's Amount, Attack, Decay, Sustain and Release.
   - Tour 3, now: "Attack is how long a Note takes to rise once a key goes down, Release how long it takes to fade once the key is let go."
   - Rewrite: "Its Envelope is four faders, a Note's life story: Attack, how fast it rises; Decay, how fast it drops back; Sustain, the level it holds while you keep the key down; Release, how long it fades once you let go. Watch the synth stretch the Attack, then the Release."
   - Bass 8, now: say "Set the Filter Envelope's Amount to +2.5 octaves." and note "Each Note now opens the Filter, then lets it close again: play one and watch the Curve jump up and fall back."
   - Rewrite: say "The Filter has an Envelope too. Set its Amount to +2.5 octaves." and note "Now every Note flings the Filter open, then lets it close: the same four faders as the Amp's, but shaping brightness instead of loudness. Play one and watch the dashed line jump up and fall back."

4. **The Tutorial's first card leads with the densest text in the app, and 129 leaves it out of scope.** That first paragraph is the Preset's description (129's decision 3 keeps descriptions as they are), and on a phone it is the only text shown above Start. For example, Wobble: "The LFO sweeping a resonant 24 dB low-pass, retriggered: every Note starts its wobble at the Cutoff and opens from there, so it lands on the beat. Watch the Timeline restart." Ring Bell's runs to 38 words. Only Bass has a Tutorial `intro` of its own.
   - Suggest: give every Tutorial its own intro in the new voice, shown first (or instead of the description). Wobble: "A bass that wobbles. An LFO, a slow invisible hand, opens and closes the Filter three times a second, and starts over on every Note so the wobble lands on the beat." Deep Breath: "A deep, round hum with a breath of air on top: a very low sine under the saw, and soft Noise like wind."

5. **Tour 4 points at a knob that is off screen,** at 1440 × 900 and on the phone: "the dot on the Cutoff knob swings up and down on its own while a Note sounds". Either bring the knob into view or point at what is shown.
   - Rewrite: "LFO 1 is aimed at the Cutoff. As the synth turns up its Depth, the Cutoff starts swinging on its own: watch the orange dotted line on the Timeline rise and fall, and hear the sound open and close with it."

6. **Five names for one thing:** Harmonics, partials, rungs, spikes, bars. Use "Harmonics" for the idea and "spikes" for what is seen. Where the Harmonics leave their line (FM, Ring), say so in words, not with a new term.
   - Now (FM Ladder 4, Ring Bell 7, Deep Breath 6): "The Filter now lets every partial through: the Filter Spectrum shows the whole ladder just as the Oscillator Spectrum does."
   - Rewrite: "Wide open, the Filter lets every spike through: its picture now matches the Oscillators' one."
   - Now (Bass 6 and three more): "the Curve steepens and the upper bars sink." Rewrite: "the dashed line gets steeper and the high spikes sink."

7. **Ring Bell and FM Ladder explain in arithmetic.**
   - Ring Bell 4, now: "Ring is Osc 1 times Osc 2. Two sines multiplied give their sum and their difference: here 3 times the Note, a new spike in the Oscillator Spectrum, and 1 times, under Osc 1's own. The Ideal's diamonds mark them."
   - Rewrite: "Ring multiplies the two waves, and something odd happens: you get two new pitches, one above and one below. Look for the new spike on the Spectrum."
   - Ring Bell 5, now: "The sum and the difference leave the ladder, at about 3.38 and 1.38 times the Note: the diamonds move between the Harmonics in the Oscillator Spectrum, and the sound turns metallic."
   - Rewrite: say "Move Osc 2's Semitone to +3, three piano keys up." and note "The two new pitches slide off the neat row of Harmonics and land between them. That's what makes metal sound like metal: a bell."
   - FM Ladder 3 (51 words), now: "Osc 2 now swings Osc 1's pitch up and down at its own frequency, the Note's: too fast to hear as vibrato, it becomes tone. …"
   - Rewrite: "FM, short for frequency modulation: Osc 2 bends Osc 1's pitch up and down, hundreds of times a second. Too fast to hear as a wobble, it turns into a new, buzzier tone. On the Spectrum, the single spike grows a ladder of new ones."

8. **Bass Step 4 is ticked before it is done, so Display and the Ideal stay a mystery.** Ideal comes up 4 times and is never explained.
   - Now: say "Open Display and see that Ideal is on (turn it on if not)." and note "Circles mark where Osc 1's saw puts its Harmonics, squares where Osc 2's square puts its own: an octave down, they fall in between."
   - Rewrite: say "See the little circles and squares on the Spectrum? They're the Ideal: where each wave's Harmonics should land. (Display turns them on and off.)" and note "Circles for Osc 1's saw, squares for Osc 2's square. One octave down, the squares slot in between the circles."

9. **The same notes again, and the Envelope drill.** Seven notes repeat across 17 Steps (see "Where they got bored"), and three Tutorials end with the same three tidy-up Steps. Give each repeat a fresh line tied to that sound, and give each `say` a reason before its number.
   - Acid 1, now: "Above the Cutoff, Harmonics now fall away twice as fast: …". Rewrite: "Steeper: the Filter now cuts like a thick blanket, not a thin one. Acid needs it sharp."
   - Bass 10, now: say "Set its Decay to about 180 ms." Rewrite: "Make the thump short: Decay to about 180 ms (under a fifth of a second)."
   - FM Ladder 4 to 6: "Turn the Filter's Cutoff all the way up …", "Pull Resonance all the way down.", "Raise the Amp's Sustain all the way." Rewrite the first say as "Now get the Filter out of the way: Cutoff all the way up, so you see the raw sound." The next two notes can then be one short line each.

10. **Units and numbers are never explained:** Hz, kHz, ms, dB, octaves, semitones. Explain each the first time a Tutorial uses it, in brackets.
    - Bass 5, now: "Turn the Filter's Cutoff down to about 280 Hz."
    - Rewrite: "Turn the Filter's Cutoff down to about 280 Hz (that's low: only the bottom of the sound gets through)."
    - Deep Breath 5, now: "Pink has the same energy in every octave, so it falls 3 dB an octave". Rewrite: "Pink is White with the hiss turned down. It's softer and darker, like distant surf, and on the Spectrum its floor tilts down to the right."

11. **"Init" is never explained,** though every Tutorial starts from it.
    - Now: "Build it from Init, one control at a time. Play any Note, or press Listen, to hear each change."
    - Rewrite: "Start from Init, the plain sound every Tutorial begins with, and change one control at a time. Press Listen, or play any key, to hear each change."

12. **The phone's folded Tour card shows the least telling line.** Folded, each card shows its `chain` ("The sound starts here: the Oscillators make it, and the Mixer sends it on to the Filter.…"), not what to watch.
    - Suggest: lead with what is happening now ("Watch the wave change shape: the synth is switching Osc 1 from Saw to Square to Sine."), then where it sits in the chain.

13. **The end card doesn't invite the next Tutorial, and the menu gives bare names.** "This is the Bass Preset, built by you." then Done. The menu lists "FM Ladder", "Ring Bell" and "Deep Breath" with no hint of what each teaches.
    - Suggest an end line per Tutorial: "Next: Acid, the same bass with a squelch and a slide. It's under Tutorial, at the top."

14. **The Acid Snapshot stays on the pictures through the next Tutorials** (a grey copy behind Pluck, Wobble and FM Ladder), and nothing says so. Acid's last note could say: "The faint grey copy stays until you clear it in Display." Or the Snapshot could be cleared when a new Tutorial starts (Claude's call, open to the owner).

15. **Next does nothing until a Step is made, and doesn't say why.** On the laptop it looks only slightly dimmer. A hint such as "Turn the ringed control first, or press Do it for me" would help the first time.

## Lines for the inbox

- Harmonic, the word the Tour and Tutorials lean on most, is never explained: Tour card 1 should say what it is, and each Tutorial's first use again (129).
- Tour card 1 packs Waveform, cycle, pitch and timbre into one sentence, and says "only Osc 1's fader is up" while the Mixer tab is hidden (129).
- The Filter Envelope arrives unannounced in the Bass, and Decay and Sustain are never explained: the Tour's Amp card should name all four faders (129, 130).
- A Tutorial's first card leads with the Preset's description, which 129 leaves alone and which is the densest text in the app: give each Tutorial its own intro in the new voice (129).
- Tour card 4 says to watch the dot on the Cutoff knob, which is off screen at 1440 × 900 and on a phone.
- Harmonics are also called partials, rungs, spikes and bars: one word for the idea, one for the picture (129).
- Ring Bell and FM Ladder explain in arithmetic (sum and difference, 3.38 times the Note): rewrite as what you see and hear (129).
- Bass Step 4 (Display, Ideal) is ticked before it is done, so Ideal is never explained.
- Seven notes repeat word for word across Tutorials, and three end with the same three tidy-up Steps (129).
- Hz, ms, dB and Init are never explained (129).
- On a phone, the folded Tour card shows the chain line, not what to watch (129).
- The end card doesn't point to the next Tutorial, and the menu's names give no hint of what each teaches.
- Acid's Snapshot stays on the pictures through the following Tutorials, unexplained.
