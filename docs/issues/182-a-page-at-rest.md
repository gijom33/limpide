# 182: A page at rest when nothing plays

**What to build:** Review 18's findings 1, 3 and 5 on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)), its first run: with nothing playing, the Viewers redraw silence at 60 fps, holding about 30 % of a main-thread core and 17 % of the GPU process; Cycle Lock is the hottest function; the Envelope Timeline recomputes every column every frame and every Viewer reads its colours from the page every frame.

**Blocked by:** none

**Status:** superseded · enhancement. Split by the owner on 2026-11-03 into [213](./213-viewer-colours-read-once-and-a-silent-scope-skipped.md) (the colours and a silent Scope), [214](./214-the-silent-viewers-rest.md) (the silent Viewers rest), [215](./215-the-envelope-timeline-draws-only-new-columns.md) (the Timeline's new columns) and [216](./216-the-sound-engine-pauses-in-a-long-silence.md) (the engine's pause), each ready for an agent

## Decisions

Claude's call, let stand by the owner in 1.22.0 (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **Measured before and after,** as review 18 measured (idle, the Demo, an 8-Voice chord, at 1×, 1.25× and 4× throttling), each change kept only if it shows.
2. **What the person sees does not change:** a Viewer still answers the first Note, knob or Bead move within a frame.

Decided by the owner, 2026-11-03, answering the questions below:

3. **Question 1, the LFO plot in silence: it keeps moving** ("Keep it moving"). The LFO plots and the modulation rings go on with the LFOs' clock with nothing playing, as now, so the page is never wholly at rest while they are on screen; the rest of the page (the silent Viewers, the Timeline, the colours) is what rests.
4. **Question 2, one issue or four: split in four** ("Split in four"), as recommended, into 213 to 216.

## Agent Brief

**Category:** enhancement
**Summary:** The page costs about 30 % of a core while silent, and its Viewers do full work every frame whether or not anything changed.

**Current behavior:** The render loop draws every Viewer every frame, silent or not; Cycle Lock runs a windowed DFT over 8,192 samples with three trig calls a sample per Scope per frame; the Envelope Timeline recomputes the modulation model for every pixel column each frame (1.3–2.2 ms); every Viewer reads computed styles for its colours each frame. Idle falls to 55 fps at 4× throttling.

**Desired behavior:** While every Tap is silent and nothing moves, the Viewers are drawn once and frames are skipped until a Note, a knob, Bead or a Display change; after a while of silence the audio context is suspended and resumed on the next Note without a click or a late first Note. Cycle Lock computes its window once, uses a sin/cos recurrence and is skipped on a silent Tap. The Timeline scrolls its drawn canvas and computes only the new columns. Theme colours are read once and again on a theme change.

**Since then (2026-11-02, issue 180's decision 8, the owner's):** 180 rebuilt Cycle Lock (shipped in 1.22.0), the window computed once and the trig replaced by rotations, so its part above is done; this issue keeps only skipping a silent Scope.

**Key interfaces:**
- The render loop and each Viewer's draw
- Cycle Lock's skipping when its Tap is silent

- The Envelope Timeline's drawing
- The audio context's suspend and resume
- The theme's colours

**Acceptance criteria:**
- [ ] Idle main-thread cost under a third of today's at 1×, and 60 fps idle at 4× (review 18's method)
- [ ] The Demo's frame rate at 4× no lower than today
- [ ] The first Note after a silence plays on time and without a click (an engine test)
- [ ] Every Viewer test passes unchanged; the design audit passes; every test passes in Linux's fonts too

**Out of scope:**
- What the Viewers show
- Bead's cost (issue 184)
- The Demo's Patch writes (issue 183)

## Questions for the owner

The night of 2026-11-02: its builder read the issue and the code and stopped before writing any, since it is five changes, each measured before and after with review 18's method rebuilt, and could not be finished well in the night's last 90 minutes.

1. **The LFO plot never rests.** It draws against the engine's clock every frame, so it scrolls in silence and the page is never at rest; the modulation rings, the Pitch Marker and Bead may do the same. Stopping it changes what a Viewer shows, which this issue puts out of scope. Claude's recommendation: at rest (no Voice sounding, no player, no Hold), the LFO plot and the rings hold their last frame and move again with the next Note.
2. **One issue or four.** Claude's recommendation: split it, each part small enough to build and measure alone: (a) the theme's colours read once (and on a theme change) and Cycle Lock skipped on a silent Tap; (b) the render loop at rest, once question 1 is answered; (c) the Envelope Timeline drawing only its new columns; (d) the AudioContext suspended after a silence and resumed on the next Note, with its engine test.

