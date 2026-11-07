# 128: A Tour of the synth

**What to build:** The owner's idea (inbox, 2026-10-30): "Tutorial should come with a lesson on how synthesis works, defining the oscillator, filter, amp taps and the LFO sections, etc." Grilled with the owner on 2026-10-30. It became a Tour, a new term in the glossary: a first look at the instrument for someone who has never seen a synth. It goes through the Sections in the signal's order, and the synth turns each one's main controls itself while the person listens and watches. PRD story 97.

What exists already: Bass, the Tutorial the Welcome opens today ([58](./58-first-tutorials.md)), goes through the signal chain from left to right, but each of its Steps is about the bass being built, not about what the Section is. The Learner's review found that nothing shows the chain or says where to start ([40](./40-preset-tutorials.md), review 5). A diagram of the chain stays out of scope ([`.out-of-scope/signal-flow-view.md`](../../.out-of-scope/signal-flow-view.md)): the Tour says it in words.

**Blocked by:** none

**Status:** done (2026-10-31). Built on the branch `claude/tour-128-3e1430`: every decision below, with Claude's calls 14 to 24. Tried by the owner, "good enough for now", so both questions under Built are answered as built; released in 1.18.0.

## Decisions

Decided by the owner, 2026-10-30, unless marked otherwise:

1. **A tour, not a Tutorial.** It is called the Tour. A card for each Section says what the Section does while the synth turns its controls; the person turns nothing. It rebuilds no Preset.
2. **Kept apart from the Presets and the Tutorials,** so no one takes it for a Preset called Tour: it is not in the Patches panel. The Welcome offers the Demo and the Tour; the Tour takes the place of the Welcome's Tutorial button (Bass). The About offers the Tour every time it is opened.
3. **Four Sections, in the signal's order:** the Oscillators with the Mixer, the Filter, the Amp, the LFOs. FM, Ring, Glide and the Sub's options are left to their own Tutorials.
4. **The synth moves the controls itself:** the Oscillators' Waveform stepping saw, square, sine; the Filter's Cutoff sweeping down and up, then its Resonance; the Amp Envelope's Attack, then its Release; an LFO on the Cutoff, a control moving by itself.
5. **Its last card** offers Bass ("now build a sound yourself") or closes.
6. **Its own sound:** the Tour plays on a plain Patch of its own (Init, a saw). When it ends or is closed, the person's Patch comes back exactly as it was.
7. **Its Notes:** while a card turns a control, the synth plays a short phrase over and over, as Listen does in a Tutorial, so the change is heard.
8. **Its pace is the person's:** each card waits for Next (and Back); its control keeps moving, there and back, until then.
9. **Nothing is locked:** grabbing the control being turned takes it over, and its movement stops for that card. Notes played by hand join the phrase.
10. **The Viewers:** each card points at the Viewers at its Section's Tap and says what they show at that point in the chain (the Filter Spectrum: the high Harmonics going away). The LFO card points at the Envelope Timeline.
11. **The chain in words:** each card's first line says where the signal comes from and where it goes next ("the Filter takes what the Oscillators make…"). No diagram.
12. **Section in the glossary:** the page's four parts, defined in CONTEXT.md.
13. The Tour stops the Demo and the Song when it starts, and its card docks where a Tutorial's card does, the page bringing each Section and its Viewers into view, on a phone too. Claude's call, open to the owner.

Made while building it (2026-10-30), each Claude's call, open to the owner:

14. The button reads "Take the Tour", in the Welcome and the About alike, between "Play the Demo" and "Close".
15. Four cards, no fifth: the LFOs card is the last, its words ending "That is the whole chain. Now build a sound yourself", with "Build a Bass" and "Done" in place of Next. A closing card where nothing moves would break decision 8.

**Since then (2026-11-05, [233](./233-a-tutorial-on-each-waves-harmonics.md)):** the Tour's last card's button names the first Tutorial, "Build a Sub Ladder"; Bass comes after it.
16. Each card starts with every control the Tour turns back on Init's values, so each Section's change is heard alone; other controls the person turned stay as they are.
17. The moves: the Waveform Saw, Square, Sine, Square, 2.4 s each; the Cutoff 2 kHz down to 150 Hz and back, 4 s each way, then Resonance 20 % to 80 % and back, 3 s each way; the Amp's Attack 10 ms to 0.8 s and back, then its Release 0.4 s to 2 s and back, 4 s each way; LFO 1's Depth (a Sine at 2 Hz on the Cutoff, Init's) 0 to 60 %, held 3 s, and back. Knobs move evenly along their travel.
18. Each card has its own phrase, for what it shows: held Notes for the Waveform, running octaves for the Filter, Notes with rests for the Amp (so the Release is heard), long Notes for the LFO. It plays from the first card to the end; there is no Listen button.
19. A control the card turns, once turned by hand or by a Controller, stays where the person put it for the rest of that card, even if the synth had not reached it yet; the card's other control keeps moving.
20. The card rings the control being turned (and its section in the phone's strip), and brings into view its Viewers first, then its controls, then, where there is room, the Cutoff knob for the LFOs card, whose words speak of its dot.
21. A Patch the person loads during the Tour ends it and stays loaded. Starting the Demo or a Tutorial ends it too, giving the person's Patch back first. A page closed or reloaded mid-Tour also gives it back, saved as the Last session at once.
22. Starting the Tour while it runs goes back to its first card.
23. The card folds and moves as a Tutorial's does; its fold is remembered apart from theirs.
24. The README's "What you can do" gains a line for the Tour.

## Agent Brief

**Category:** enhancement
**Summary:** A Tour for someone who has never seen a synth: a card per Section, in the signal's order, while the synth turns that Section's main controls itself and plays a phrase.

**Desired behavior:**
- A Tour button in the Welcome takes the place of its Tutorial button; the About offers the Tour every time. The Patches panel does not list it.
- Starting the Tour stops the Demo and the Song, keeps the person's Patch aside, and loads a plain Patch of its own (Init, a saw).
- A card docked where a Tutorial's card docks shows one Section at a time, in order: the Oscillators with the Mixer, the Filter, the Amp, the LFOs. Each card's first line says where the signal comes from and goes next; then what the Section does; then what its Viewers show at that point.
- While a card is shown, the synth turns that card's control itself, there and back, over and over, and plays a short phrase over and over: the Waveform stepping saw, square, sine; the Cutoff sweeping, then the Resonance; the Amp Envelope's Attack, then its Release; an LFO on the Cutoff.
- The page brings the card's Section and Viewers into view on every layout, and the card never covers them.
- Next and Back move between cards. Grabbing the control being turned takes it over and stops its movement for that card; Notes played by hand join the phrase. Nothing is locked.
- The last card offers Bass, the first Tutorial, or closes. Ending or closing the Tour gives back the person's Patch exactly as it was.

**Key interfaces:**
- The Welcome and the About, the Tutorial player's card, the Patch, the Viewers' accessible names, Listen's phrase notation

**Acceptance criteria:**
- [x] The Welcome shows the Demo and the Tour, no Tutorial button; the About shows the Tour; the Patches panel has no Tour
- [x] Each of the four cards moves its control by itself and plays the phrase; the matching Viewer is in view at every layout
- [x] Grabbing the moving control stops the movement; Next, Back and Close work from the keyboard
- [x] After the Tour, ended or closed at any card, the Patch is the one the person had before, value for value
- [x] The last card's Bass button starts the Bass Tutorial
- [x] The cards' words are checked against the engine by the fact-check before the push (from the code, 2026-10-30; the release's fact-check renders them before the push)

**Out of scope:**
- A diagram of the signal chain
- FM, Ring, Glide, the Sub's options, the Noise
- Steps the person must complete, as a Tutorial has

## Built

2026-10-30. The Tour's cards and moves are data with a pure `tourAt` (unit tests); the Patch store keeps the person's Patch and gives it back, name and changed mark too (unit test); `e2e/tour.spec.ts` covers the Welcome and About, every card moving its control and playing, a grab, the keyboard, the Patch coming back closed at each card, the Bass button, and the Viewers clear of the header and the card on a phone, a short phone, 2 × 2, a laptop and a large screen.

**The fact-check** (the cards' words read against the engine, the Modulation model and the Viewers' code; nothing rendered): no false claim. Fixed from it: the Filter is fed by the Mixer ("as the Mixer sends it"), and the dot on the Cutoff knob swings "while a Note sounds". Left: under reduced motion the knob's dot is never drawn, so the LFOs card's words about it point at nothing there. The release's fact-check (2026-10-31) rendered the cards: no false claim. It dropped a second caveat (the Timeline's Cutoff line goes for one 40 ms tick in each 9 s pass, too short to see; near either end of a pass it is nearly flat), and found the Amp card loose: a Note takes the Attack set when its key goes down, so with the knobs' taper few Notes get the longest Attack (to the inbox).

**The code review** (Standards and Spec), fixed: comments that told history, a field no caller read, "master volume" and "shape" (avoided words) in the cards, a selector built twice, the Mixer named but never shown (the card now says it is on its own tab), the Amp Spectrum pointed at but not described, no test that the Song stops, the test names without the issue, and a tick that could write the Tour's values onto a Patch the person had just loaded. Noted, not changed:
- The Tour's hand keeps its own "turned by hand stays put" rather than the Demo's (`createDemoKnobs`), which turns only knobs; the Tour turns the Waveform too.
- `TourCard` repeats some of the Tutorial card's ringing and scrolling (the strip's mark, the click that re-marks after a tab switch, the delayed scroll); a shared helper is a possible tidy-up.
- The Last session is the Tour's Patch while the Tour runs; only a page closed or reloaded (`pagehide`) gives the person's back. A phone that kills a tab in the background without `pagehide` loses it. Giving it back when the page is hidden would end the Tour on every switch of tab.

**Questions for the owner:**
1. Init plays one Voice, so a Note played by hand takes that Voice from the phrase while held rather than sounding beside it (decision 9 says it joins). Should the Tour's Patch be Init with more Voices?
2. The timings and depths of decision 17, and the phrases of 18: right to the ear?

**The owner's answers (2026-10-31, decided by the owner):** having tried the Tour, "it's good enough for now". So both are left as built: the Tour's Patch stays Init with one Voice (a Note played by hand takes the phrase's Voice while held, which decision 9 had not foreseen), and the timings, depths and phrases stay as they are.

**Changed since (2026-11-01, [130](./130-the-tour-freezes-to-show-adsr.md)):** the Amp card no longer turns the Attack, then the Release, as decisions 4 and 17 and the brief above say. It turns all four stages of the Amp Envelope, Attack, Decay, Sustain and Release, one per Note at 60 BPM, each set before its Note and given back after, and freezes the Viewers for three seconds once each Note has faded. Its Viewers are the Envelope Timeline, the Amp Scope and the Amp Spectrum.

**Changed since (2026-11-03, [209](./209-about-holds-the-page-and-closes-with-a-cross.md)):** About has no Close button: a × in its top corner closes it, and "Take the Tour" sits beside "Play the Demo" alone (decision 14).

**Changed since (2026-11-03, [210](./210-the-tour-tells-of-the-layers-and-the-tutorials.md)):** the LFOs card is no longer the last (decision 15). Two cards follow the Sections, where nothing moves and nothing plays: the Synth Geek Layer with its History, then the Tutorials, the last, with "Build a Bass" and "Done"; the Tour has six cards. The owner asked for them (decision 1 of 210); their pace is still the person's (decision 8).

**Changed since (2026-11-05, [242](./242-three-shows-hand-over-alike.md)):** starting the Song during the Tour ends it, as its close does, the person's Patch given back, and the Song plays on it. Before, the Tour carried on silently and its next card stopped the Song.

**Since then (2026-11-07, [250](./250-tidy-ups-after-1-26.md))**: the Patch coming back closed is checked in the browser at cards 1 and 6; the rest are the Shows' unit tests.
