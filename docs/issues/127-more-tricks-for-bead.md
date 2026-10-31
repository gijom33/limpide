# 127: More tricks for Bead

**What to build:** Claude's ideas for Bead's tricks (inbox, 2026-10-30), which the owner asked to keep ("Put all the animations and trick ideas for Beads in inbox"), each a yes or no. Bead itself is [115](./115-an-easter-egg.md).

Set off by the controls, each showing what the control does:

- **Its tail as the Waveform:** the Oscillator's Waveform changed, the tail is redrawn as that wave (saw, square, triangle, sine), Bead looking at it proudly.
- **Detune splits it in two:** two Beads drifting slightly apart and wobbling against each other, merging back when Detune is back to 0.
- **The Cutoff as weather:** with the Filter fully closed it freezes into an ice cube and shivers; opening it melts it back.
- **A screaming Resonance:** its eyes go wide and its tail stands straight.
- **The Noise:** it turns fuzzy, its pixels crackling with static.
- **Surfing the Oscillator Scope:** it hops onto the trace and rides it, smooth on a sine, stepping on a square, sliding down a saw's ramp.

Words spelled with Notes, as B, E, A, D is, four Notes or more so none comes by accident:

- **D, E, A, D:** it plays dead, X eyes, then peeks to see if anyone noticed.
- **F, A, D, E:** it fades to a ghost and back.
- **C, A, F, E:** a tiny coffee cup, and a faster Bead for a while.
- **D, E, A, F:** it covers its ears.
- **B, A, G, G, A, G, E:** it drags a suitcase along its edge.

The pointer and the page:

- **Picked up and thrown:** dragged and let go, it flies under its own gravity and splats.
- **Its eyes follow the pointer** while it is near.
- **The theme switched:** to dark it puts on a nightcap, to light it squints and shades its eyes.
- **On dates:** a ghost sheet on 31 October, a Christmas hat, a party hat on Limpide's birthday.
- **Turning a knob itself:** it strains at a knob that does not move (Bead never changes the sound) and gives up with a huff.
- **During the Demo:** it conducts with a tiny baton, or plays air guitar on its tail.

Water drop gags, among the funny turns when nothing is played:

- **Evaporating:** a little sun comes out, it shrinks into steam, becomes a cloud and rains itself back down.
- **A soap bubble:** it blows one, gets caught inside and floats up a little, then the bubble pops.
- **Skipping rope** with its own tail.
- **Fishing** off its edge, pulling up a little ♪.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-10-30): every decision below, with the owner's changes from trying it (15 to 21); for the owner to try before the release.

## Questions for the owner

1. **The tail as the Waveform?** Claude's recommendation: yes, first: the tail is already the logo's wave in pixels, so four more tails show the four Waveforms where the player is looking.
2. **Detune splitting it?** Claude's recommendation: yes: two drops drifting against each other is what Detune does to two Oscillators.
3. **The Cutoff as weather?** Claude's recommendation: yes, at the ends only: frozen with the Filter fully closed, melting as it opens, so a Cutoff swept every frame keeps walking it as now.
4. **A screaming Resonance?** Claude's recommendation: yes, past three quarters of its range, a pose and no more.
5. **The Noise's static?** Claude's recommendation: yes, while the Noise's fader is up and the Noise is heard.
6. **Surfing the Scope?** Claude's recommendation: no: Bead would cover the trace it teaches, against 115's rule that it covers nothing, and it would need the Scope's trace each frame.
7. **Words spelled with Notes?** Claude's recommendation: yes, the four four-Note words, heard only while Bead is out, so B, E, A, D stays the one way in and the words a secret within the secret; B, A, G, G, A, G, E too if seven Notes within the phrase's time feel right.
8. **Picked up and thrown?** Claude's recommendation: yes, beside the click: a press that moves more than a few pixels picks it up, one that does not is a click and sprays as now; a throw counts towards running off like a tickle.
9. **Its eyes on the pointer?** Claude's recommendation: yes, within about 150 px, glancing back to the music when the pointer leaves.
10. **The theme switched?** Claude's recommendation: yes, a reaction lasting a few seconds.
11. **On dates?** Claude's recommendation: yes, by the visitor's own date: 31 October, 24 to 26 December, and 24 October, the day Limpide went on GitHub, as its birthday.
12. **Turning a knob itself?** Claude's recommendation: no: to reach a knob it would leave its edge and cover a control.
13. **During the Demo?** Claude's recommendation: yes, conducting, its baton on the Demo's Notes; the air guitar as a funny turn some other time.
14. **The water drop gags (evaporating, the soap bubble, skipping rope, fishing)?** Claude's recommendation: yes, all four, dealt into the shuffled deck of funny turns.

## Decisions (triage, 2026-10-30, decided by the owner)

1. The tail as the Waveform: yes, briefly: the Waveform changed, the tail takes that wave for a few seconds, then goes back to the logo's saw softening into a sine.
2. Detune splitting it: yes: two drops drifting apart as Detune grows, wobbling against each other, merging back at 0.
3. The Cutoff as weather: yes, at the ends: frozen into an ice cube with the Filter fully closed, melting as it opens; sweeping the Cutoff still walks it left and right.
4. A screaming Resonance: yes, past three quarters of its range: eyes wide, tail straight.
5. The Noise's static: yes, while the Noise is heard, more crackle the louder it is.
6. Surfing the Oscillator Scope: yes, during the Demo only, covering the trace for that part (an exception to 115's rule that Bead covers nothing).
7. Words spelled with Notes: all five, heard only while Bead is out: D, E, A, D; F, A, D, E; C, A, F, E; D, E, A, F; B, A, G, G, A, G, E.
8. Picked up and thrown: yes: a press that moves picks it up, one that does not is a click that sprays as now; a throw counts towards running off like a tickle.
9. Its eyes on the pointer: yes, within about 150 px, glancing back to the music when the pointer leaves.
10. The theme switched: yes, a reaction of a few seconds: a nightcap for dark, squinting and shading its eyes for light.
11. On dates, by the visitor's own date: a ghost sheet on 31 October, a Christmas hat from 24 to 26 December, a party hat on 24 October, the day Limpide went on GitHub.
12. Turning a knob itself: no: it would leave its edge and cover a control.
13. During the Demo: conducting with a tiny baton, air guitar on its tail and surfing the Scope take turns, one per Demo part.
14. The water drop gags: all four (evaporating, the soap bubble, skipping rope, fishing), dealt into the shuffled deck of funny turns.

15. Bead rides the LFO shapes instead of the Oscillator Scope's waveform: the surfing part of the Demo is on an LFO's plot (replaces decision 6's Scope). Decided by the owner, 2026-10-30.
16. Fishing, its line goes much longer, down past the bottom of the window. Decided by the owner.
17. Drinking, the glass's rim is really over its mouth (issue 115's glass, moved again), then a bit higher. Decided by the owner.
18. Its tail is the Limpide logo whenever no special animation is on: Resonance's straight tail and wide eyes come for a moment as it is turned past three quarters, not for as long as it stays there (amends decision 4). Decided by the owner.
19. Fishing, the line does not turn with Bead: it hangs straight down from the rod's tip, the hook going down, and coming back up with the ♪, properly animated. Decided by the owner.
20. A funny turn plays to its end before any big movement: Bead had jumped while fishing. Decided by the owner. Which moves wait (a visit to another section, the dance step and hop on each Note, a control's walk or other answer, the Demo's surfing) and which do not (a tickle, a click, being picked up, a word, being sent away, the ice): Claude's call, open to the owner.
21. Bead surfs an LFO's plot only while that LFO is on, its Depth above 0; with neither on, the part is conducting or air guitar instead. Decided by the owner.

Claude's calls, open to the owner: "a few seconds" for the tail is 3 s; the words get the same 4 s from first Note to last as B, E, A, D, BAGGAGE's seven Notes included; the air guitar is for the Demo only; where the Scope is out of view (a phone scrolled away from it), a surfing part becomes conducting or air guitar.

## Agent Brief

**Category:** enhancement
**Summary:** Bead, the hidden mascot, gains tricks that show what some controls do, five words spelled with Notes, ways to play with it by pointer, the theme and the date, three acts during the Demo and four more funny turns.

**Desired behavior:**
- **Controls:** a Waveform change redraws the tail as that wave for 3 s; Detune splits Bead into two drops whose gap grows with Detune, merging at 0; the Cutoff fully closed freezes it into an ice cube that melts as the Cutoff opens, the Cutoff's walking kept; Resonance past three quarters widens its eyes and straightens its tail; the Noise heard makes it fuzzy and crackling, more so the louder. Each reads the Patch or the sound the Viewers already read and changes nothing heard.
- **Words:** while Bead is out, D, E, A, D (plays dead, X eyes, then peeks), F, A, D, E (fades to a ghost and back), C, A, F, E (a tiny coffee cup, then faster strolls for a while), D, E, A, F (covers its ears) and B, A, G, G, A, G, E (drags a suitcase along its edge), played by hand within 4 s, any octave, from the same inputs as B, E, A, D. A Note may count towards several words at once; B, E, A, D still sends it away. While Bead is not out, the words do nothing.
- **Pointer:** a press on Bead that moves more than a few pixels picks it up; let go, it flies under its gravity and splats on the edge it reaches (or its own); a press that does not move is a click, spraying as now; a throw adds to the tickles that run it off. Its eyes follow a pointer within about 150 px.
- **Theme and dates:** switching the theme gives a reaction of a few seconds (a nightcap for dark, shading its eyes for light). By the visitor's date: a ghost sheet on 31 October, a Christmas hat from 24 to 26 December, a party hat on 24 October.
- **The Demo:** each Demo part, one of three acts in turn: conducting with a tiny baton on the Notes, air guitar on its tail, or surfing an LFO's plot (decision 15; the Oscillator Scope's trace at first), where one is in view, else another act; back to its edge at the part's end.
- **Funny turns:** evaporating (a little sun, steam, a cloud raining it back), a soap bubble (blown, caught inside, floating up a little, popping), skipping rope with its tail, fishing off its edge for a little ♪, all in the shuffled deck.
- **Unchanged:** it makes no sound, takes no focus, is heard by no screen reader, is left out of the tips and the README; with reduced motion it only changes pose.

**Acceptance criteria:**
- [ ] Changing the Waveform shows the tail as that wave, back to the logo 3 s later
- [ ] Detune up splits Bead in two, Detune at 0 merges it
- [ ] The Cutoff fully closed freezes it, opening it melts it
- [ ] Resonance past three quarters, and the Noise heard, change its pose
- [ ] Each of the five words does its trick while Bead is out and nothing while it is not; B, E, A, D still sends it away
- [ ] Dragging and letting go throws it; a click still sprays; enough throws run it off
- [ ] Its eyes follow a nearby pointer
- [ ] A theme switch, and each of the three dates (with the date injected), dress it as decided
- [ ] During the Demo each part has one of the three acts, surfing only where an LFO plot is in view
- [ ] The four new funny turns come up in the deck
- [ ] An offline render with all of it matches one without (no sound changed); the page's frame work stays within budget

**Out of scope:**
- Turning a knob itself (decision 12)
- Any sound of Bead's own
- A mention in the tips or the README

## How it was built

- **The words** (`src/input/callingPhrase.ts`). `createCallingPhrase` takes any phrase of pitch classes (B, E, A, D by default); `createWordsHeard` hears the five words at once, each on its own, so a Note can end one and start the next (D, E, A, D, E, A, F is both DEAD and DEAF). App hears them from the same presses as B, E, A, D and passes a word on only while Bead is up.
- **The looks** (`src/ui/mascotMotion.ts`, `looksOf` in `src/ui/mascotGestures.ts`, the pictures in `src/ui/mascotPictures.ts`). New pose fields: `tail` (the logo, a Waveform, straight), `hat`, `ice`, `fuzz`, `twin`, `size`, and eyes `wide`, `dead`, `peek`. A Waveform chosen (Osc 1's or Osc 2's) draws the tail as that wave, a cycle and a half in the logo's four colours, for 3 s. Resonance turned past three quarters: wide eyes and a straight tail for 3 s (decision 18). Detune, while both Oscillators are in the Mixer: a twin drawn behind it, off to its left by up to 16 px at 50 cents, wobbling in and out faster the more the cents, as two detuned Oscillators beat. The Cutoff at its lowest: frozen in an ice cube over 0.4 s, still and shivering; opened, it melts over 1.2 s, dripping; a Cutoff turn still walks it. The Noise heard: pixels of static flickering about it, more the higher the Noise's fader.
- **The tricks** (`src/ui/mascotTricks.ts`). For the words: `playDead` (onto its back about its left foot, lifted so it lies on its edge, tail up, crosses for eyes, a peek), `ghost`, `coffee` (then strolls 1.8 times faster and sooner for 12 s), `earsCovered`, `suitcase` (dragged 60 px along). For the theme: `nightcap` and `shades`, the latter a hand shading its eyes; Bead reacts once Display (or any panel) is closed, so the reaction is seen. In the deck of funny turns: `evaporate` (a sun beside it, rising steam, a cloud low over it raining it back, all under the header at three across), `bubble`, `skipRope` (its tail turned five times round, a hop each time it passes under), `fishing` (decisions 16 and 19: over 5.6 s, a cast, the hook falling past the window's bottom as a weight falls, bobbing while Bead looks about, a bite tugging it in jerks with the rod bent, then reeled up with a ♪ on it, which ends dangling at the rod's tip; the pose gives the hook's depth, `hook`, and `caught`, and the line, hook and ♪ are drawn on a layer of the page, straight down from where Bead's lean and turn put the rod's tip).
- **Picked up and thrown** (`src/ui/mascotPlace.ts`: `hold`, `toss`, the `held` and `thrown` states). A press on it that moves 6 px picks it up; let go, it flies at the pointer's speed over the last tenth of a second (at most 1,800 px/s) under gravity, bouncing off the window's sides at half speed, and lands on the first section edge it comes down onto under it, splashing as hard as it fell; on a large screen it stays on that section for a visit. Under its line, it flies back up with its tail. A press that does not move is a click, as before; a throw counts towards running off as a click does. With reduced motion it is not picked up. Its eyes follow a mouse pointer within 150 px.
- **The date**: `hatOn` reads the visitor's date: a ghost sheet (drawn under its eyes) on 31 October, a Christmas hat from 24 to 26 December, a party hat on 24 October.
- **The Demo** (`act`): each part in turn, conducting (the baton down on each Note), air guitar (its tail held across it, strummed on each Note) and surfing: on the first LFO plot in view whose LFO is on, its Depth above 0 (decision 21), sliding end to end along it, its foot where the plot draws the LFO under its middle (`lfoSwingAt` over the plot's second, as `LfoPlot` draws it); with no such plot in view, conducting or air guitar instead, and back home if its LFO is turned off mid-ride. The Demo's dancing steps go on under the first two.
- **The glass** (decision 17): turned 100° rather than 135°, its rim's middle over the mouth, under the eyes, then raised by about 1.5 px; the glass runs off to the left just under the left eye, touching its lowest pixel.
- **A funny turn plays to its end** (decision 20): while one is under way a control turned only keeps Bead listening (no gesture, no walk, no new turn on the Filter Slope's cue), a Note brings no hop and no dance step, a Demo part's act waits to move it, and no visit to another section starts. Tickles, clicks, a pick-up, a word and B, E, A, D still act at once.
- **Its frame cost.** The draw-cost test (`it adds under a millisecond…`) failed in WebKit while other test runs loaded the machine, at 1.6 to 2.4 ms, before this issue as after it (measured on the commit before 127, in a worktree). Two changes keep 127 within it: the twin's copy of its drawing is linked to the drawing only while Detune shows it (WebKit copied it again at every change while hidden), and the page's position is read with the sections at the start of each frame, before anything is written, rather than after the parts are shown (a read after a write had WebKit work out the page's styles in the middle of the frame). On a quiet machine it then passes three runs in three, as the commit before 127 does.
- **Its element** says what it is doing, for the tests: `data-doing`, `data-tail`, `data-hat`, `data-act`, `data-moving`, `data-prop`. Its new styles are written only as they change, keeping its frame cost within the draw-cost test's budget.
- **Tests.** Unit: the words (3), the tricks (5 more), the looks, words, theme, dates, coffee, pointer and acts (10), a turn played to its end (1; the deck's test now lets each turn end before the next cue), throwing (5), `looksOf` (2), the tails drawn unbroken (2), steam (1). Playwright (`e2e/mascot.spec.ts`, both browsers): the words while out and not before; a Waveform's tail and back; dragged and thrown onto an edge; the ghost sheet on 31 October; the theme's reaction once Display is closed; the Demo's three acts, conducting rather than surfing while both LFOs are off, and surfing LFO 1's plot once its Depth is turned up.

