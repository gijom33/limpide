# 128: A Tour of the synth

**What to build:** The owner's idea (inbox, 2026-10-30): "Tutorial should come with a lesson on how synthesis works, defining the oscillator, filter, amp taps and the LFO sections, etc." Grilled with the owner on 2026-10-30. It became a Tour, a new term in the glossary: a first look at the instrument for someone who has never seen a synth. It goes through the Sections in the signal's order, and the synth turns each one's main controls itself while the person listens and watches. PRD story 97.

What exists already: Bass, the Tutorial the Welcome opens today ([58](./58-first-tutorials.md)), goes through the signal chain from left to right, but each of its Steps is about the bass being built, not about what the Section is. The Learner's review found that nothing shows the chain or says where to start ([40](./40-preset-tutorials.md), review 5). A diagram of the chain stays out of scope ([`.out-of-scope/signal-flow-view.md`](../../.out-of-scope/signal-flow-view.md)): the Tour says it in words.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Grilled on 2026-10-30, the owner's answers below.

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
- [ ] The Welcome shows the Demo and the Tour, no Tutorial button; the About shows the Tour; the Patches panel has no Tour
- [ ] Each of the four cards moves its control by itself and plays the phrase; the matching Viewer is in view at every layout
- [ ] Grabbing the moving control stops the movement; Next, Back and Close work from the keyboard
- [ ] After the Tour, ended or closed at any card, the Patch is the one the person had before, value for value
- [ ] The last card's Bass button starts the Bass Tutorial
- [ ] The cards' words are checked against the engine by the fact-check before the push

**Out of scope:**
- A diagram of the signal chain
- FM, Ring, Glide, the Sub's options, the Noise
- Steps the person must complete, as a Tutorial has
