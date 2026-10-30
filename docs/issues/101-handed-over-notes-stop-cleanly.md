# 101: Handed-over Notes stop cleanly

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 9, [report](../reviews/2026-10-30/9-ts-react-webaudio.md)). The players (Demo, Song, Hold) hand Notes to the engine ahead of time, and three things go wrong around those handed-over Notes, all measured with the real engine offline:

- A key that takes over the Demo, or Hold going off, within the look-ahead plays two copies of each Oscillator until the handed-over Note was due: a restart earlier than a pending one stops only the newest node, so the node it replaced plays on (the LFOs' restarts do the same). A bare sine peaks at 2.0 against 1.0, then clicks at the handed-over time.
- Stopping the Demo, the Song or the Hold rhythm on a Patch of several Voices lets the Notes already handed over play in full: Note Off closes only Voices with no release recorded, and a handed-over Note has its future release recorded already. With 4 Voices a full Note plays after the stop; with 1 Voice, nothing.
- Each restarted Oscillator's frequency and detune connections are never removed (4,874 made, none removed over 90 s of Demo). Chromium collects the nodes anyway; WebKit and Firefox were not measured.

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** A Note the players handed over ends when the player or the key says so, with one copy of each Oscillator and nothing left connected.

**Current behavior:**
- A restart scheduled earlier than one already pending leaves the node the pending restart was replacing playing, for the Oscillators and the LFOs.
- Stopping a player closes only the Voices with no release recorded, so on several Voices the handed-over Notes play out.
- A restarted Oscillator's old node is disconnected from its outputs only; the control signals feeding its frequency and detune stay connected to it.

**Desired behavior:**
- However restarts are scheduled (earlier or later than one pending), exactly one node per Oscillator and per LFO sounds at any moment.
- Stopping the Demo, the Song or the Hold rhythm silences every Note it handed over, on one Voice or several, with the Patch's Release from the stop.
- A node that has ended is disconnected from everything that fed it as well as from what it fed.

**Key interfaces:**
- The engine's restartable Oscillators and LFOs
- The engine's Note Off, and the shared transport's stop

**Acceptance criteria:**
- [ ] An engine test: a key taking over within the look-ahead peaks as one Note does, not two (a bare sine stays at 1.0)
- [ ] The existing engine test of a stopped player, extended to several Voices, finds silence after the Release
- [ ] An engine test counts the connections made and removed over many Notes and finds them equal once the nodes end

**Out of scope:**
- How long the look-ahead is
- Whether each Note restarts the Oscillators (issue 94; the click during a Release is [102](./102-a-note-during-a-release-clicks.md))
