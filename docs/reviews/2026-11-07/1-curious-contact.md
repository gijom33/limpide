# Persona review 1: the curious contact

Ran on version 1.26.1 (build 38df0ad) on 2026-11-07, on the live site.

iPhone 15 emulation in Playwright WebKit (touch, mobile), 393 × 852, and again at 393 × 659 (the page Safari leaves once its bars are drawn) · a first pass of 60 s, then a second look of about 2 min · fresh browser with nothing stored each run.

Screenshots and scripts: `/private/tmp/rev1-curious/`; below, screenshots are named by their file name in that folder.

Sound was not checked by ear. The audio engine was running from the first tap (its state read `running`), keys lit up with the notes and the pictures moved, so sound was very likely playing.

## First impression

"A dark box with a rainbow squiggle and a little pixel water drop. *A synthesizer you can see through: the wave and its Harmonics after every stage, as you play.* See-through synth, OK, it's about music and pictures of it. 'Hear what it can do, or start playing.' 'Touch and hold any control to see what it does.' Then credits, and two big buttons at the bottom: green **Play the Demo**, orange **Take the Tour**. I'll take the green one." (`01-landing.png`, `09-landing-659.png`)

In ten seconds: a music toy that shows you the sound, made by Guillaume with an AI, free. The buttons were in sight at both heights, with Play the Demo already highlighted. "Harmonics" and "every stage" meant nothing to them, but "see through" did.

## What they tried

**First pass, 60 s**

1. Tapped **Play the Demo**. The box closed, the page slid down to the pictures, and a card docked at the bottom: **Kick**, "A kick drum, made by the synth: a tone that falls fast in pitch, each hit a little deeper." with Stop and a row of 15 little bars. (`02-demo-1000.png`)
   - *"A drum made by the synth. Fine, I get that."*
2. **Acid** at 8 s: "The Filter opens bit by bit and starts to ring: a squelchy, talking bass line." The orange picture went spiky.
3. **Poly Pluck** at 19 s ("Notes plucked like strings… the sound turns thin and glassy"), then **Strings** at 28 s: "Held chords that shimmer, the shimmer speeding up until it buzzes." Three keys lit green on the piano, the orange wave above wobbled. (`03-demo-28.png`)
   - *"Oh, the keys light up. And that shape is the shimmer."*
4. **Tremolo Keys** at 35 s, **Self-Oscillation** at 48 s: "A whistle climbing from low to high over a low buzz… the Filter, its Resonance at full, rings at its Cutoff as it sweeps up." (`03-demo-48.png`)
   - *"A whistle, yes. The second half is for someone else, but I don't need it."*
5. At 60 s, **Wobble**: "A deep bass going 'wah-wah' in time with the beat".

At 60 s they had heard sound, read six captions, understood the first half of every one, and were curious for more.

**Second look, about 2 min**

6. Let it run to **Double Wobble** at 66 s ("a second, faster LFO moves the Filter too. The Cutoff knob's blue ring stretches to cover both"): eight bars of fifteen. (`03-demo-end.png`)
7. Closed the Demo and tapped a white key on the piano: a note, and a sawtooth drawn in green with a comb of lines under it. (`05-key.png`)
8. Remembered "touch and hold" and held the **Cutoff** knob: "Where the Filter starts to take Harmonics away… turn it down for a darker, muffled sound, up for a brighter one." (`05-hold-cutoff.png`)
   - *"Darker, muffled, brighter. That I get."*
9. In a fresh visit, tapped **Take the Tour** instead. Six cards, the synth playing itself: "Watch the wave change shape: the synth is switching Osc 1 from Saw to Square to Sine." The wave on screen did change. (`07-tour-1.png`, `11-tour659-1.png`)
   - *"That's the 'see the sound' thing. Nice."*
10. Next: Filter ("Watch the lines on the Filter Spectrum sink as the synth turns the Cutoff down"), Amp, LFOs, then **Synth Geek Layer 5 of 6** ("Find the ringed Display button: its Geek toggle, a pair of glasses…"), then **Tutorials 6 of 6**, whose big orange button says **Build a Sub Ladder**, beside Back and Done. (`11-tour659-5.png`, `07-tour-6.png`)
    - *"Geek layer? Sub ladder? I'll press Done."*
11. Tapped **Song**: a house loop started and the Song button lit. Nothing else changed on screen and no card said what to do. They tapped **›** beside "Init" by chance: Pure Sine, Soft Triangle, Hollow Square, the tune carrying on under each. (`08-song.png`, `08-song-preset-2.png`)
    - *"Wait, the tune keeps going and the sound changes? That's the fun bit. Why didn't anything tell me?"*
12. Tapped "Init ▾": a sheet of Presets opened on Tutorials, Start, Shapes (Pure Sine, Hollow Square, Thin Pulse…). They stopped there, at about 3 minutes. (`16-preset-sheet.png`)

## What worked

- The welcome now shows its two buttons at both heights, with Play the Demo focused first. One tap, sound and a caption.
- Every Demo caption now opens with a picture anyone gets ("a whistle climbing", "a deep bass going wah-wah", "held chords that shimmer"), and only then the synth words. They could stop reading at the colon and lose nothing.
- The Demo's bars can be tapped to jump to a part.
- The Tour's first card is the best thing on the site for this person: the synth changes the wave and you watch it change.
- Touch and hold still explains in plain words.
- The Song plays on while you change the sound: the most fun they had.

## Where they got stuck or gave up

- The Song gives no sign of what to do with it. They found Preset-flipping only by luck.
- The Tour's last two cards point to the Synth Geek Layer and to "Build a Sub Ladder", words they could not place, so the Tour ended on "Done" and not on something to play.
- The › arrow and the Preset sheet start with lessons (Pure Sine, Soft Triangle, Hollow Square). The basses, pads and drums are further down.
- They stopped at about 3 minutes, in the Preset sheet.

## Would they

- **Like the post: yes.** One tap and it plays and explains itself; it looks polished; "a synthesizer you can see through" is a line they can repeat.
- **Share it: maybe.** They now have the words ("a synth that shows you what the sound looks like") and the Demo opens plainly. A repost would need a preview picture: the link card would show only "Limpide" and the line, with no image.
- **Come back: maybe.** The Song with Presets is something to show a friend; the Tutorials are a laptop job.
- **Recommend it: yes**, to anyone who plays music or a curious kid: "press Play the Demo, then hold any knob."

Could they say "it shows you what sound looks like"? Yes, in the Tour's first card's own words: "watch the wave change shape".

## Since the last run (1.16.0, 2026-10-30)

Better:
- Finding 1 is fixed: the welcome's buttons sit at its bottom in sight at 393 × 659, Play the Demo has focus, and the box closes with ×.
- Finding 2 is mostly fixed: each Demo caption leads with a plain picture before the synth words.
- The welcome's line is new ("A synthesizer you can see through…" in place of "subtractive synthesizer"), and it is also the page's description.
- New: the Tour (6 cards, the synth playing each change itself) is the welcome's second button; Bead, the pixel drop, walks the page; the Demo's parts can be tapped.

Unchanged:
- The › arrow and the Preset sheet still start with lesson sounds.
- The welcome still holds all of About's credits, though now the buttons stay in view.
- Finding 3 (the Bass Tutorial's step 4) was not rechecked: this person did not reach the Tutorials.

Also noticed, not ranked:
- The shared link's preview has no image (no `og:image`). That is known and was left for later in issue 236's decision 2, but for a LinkedIn post it is what this person sees first.
- The Tour's Amp card keeps the AMP tab ringed while, for most of the card, the page shows the LFO & ENV section and its Envelope Timeline (`11-tour659-3.png`). The page moves from the control to the picture by design (issue 206), but the ring stays on a tab you are no longer looking at.
- In one Demo frame Bead stood over the LFO's "Cutoff" label, hiding "Cut" (`03-demo-48.png`). It may have been walking by; issue 181 covers where it rests.
- The later captions' second halves are still for synth people: FM Bell ("a sine swung by another 3.56 times higher") and Split Octave Bass ("Osc 1 an octave down by its own Octave, Osc 2 on the Note, a few cents off").
- No page errors in any run.

## Three findings, ranked

1. **The Song says nothing once started.** Tapping Song plays a loop; only the lit button shows it. Nothing suggests flipping Presets with › or turning a knob while it plays, though that is the most fun a non-musician has here. Screenshots: `/private/tmp/rev1-curious/08-song.png`, `/private/tmp/rev1-curious/08-song-preset-2.png`.
2. **The Tour ends on geek extras.** Card 5 is the Synth Geek Layer (a Geek toggle "a pair of glasses" in Display), and card 6's main orange button is "Build a Sub Ladder". A newcomer leaves the Tour by Done, with nothing to play. Screenshots: `/private/tmp/rev1-curious/11-tour659-5.png`, `/private/tmp/rev1-curious/07-tour-6.png`.
3. **The fun sounds sit behind the lessons.** › from Init goes Pure Sine, Soft Triangle, Hollow Square. The Preset sheet opens on Tutorials, Start and Shapes, with Bass, Pads and Drums far below. This is unchanged since 1.16.0. Screenshot: `/private/tmp/rev1-curious/16-preset-sheet.png`.

For the inbox, one line each:

- Review 1 (1.26.1): the Song shows no word once started; nothing invites flipping Presets or turning knobs over it, the most fun a non-musician finds.
- Review 1 (1.26.1): the Tour's last two cards (Synth Geek Layer, "Build a Sub Ladder") end a newcomer's Tour on jargon instead of on something to play.
- Review 1 (1.26.1): the › arrow and the Preset sheet open on lesson sounds (Pure Sine, Soft Triangle, Hollow Square); the fun ones are far down.
