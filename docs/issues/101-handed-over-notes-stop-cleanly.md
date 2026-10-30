# 101: Handed-over Notes stop cleanly

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 9, [report](../reviews/2026-10-30/9-ts-react-webaudio.md)). The players (Demo, Song, Hold) hand Notes to the engine ahead of time, and three things go wrong around those handed-over Notes, all measured with the real engine offline:

- A key that takes over the Demo, or Hold going off, within the look-ahead plays two copies of each Oscillator until the handed-over Note was due: a restart earlier than a pending one stops only the newest node, so the node it replaced plays on (the LFOs' restarts do the same). A bare sine peaks at 2.0 against 1.0, then clicks at the handed-over time.
- Stopping the Demo, the Song or the Hold rhythm on a Patch of several Voices lets the Notes already handed over play in full: Note Off closes only Voices with no release recorded, and a handed-over Note has its future release recorded already. With 4 Voices a full Note plays after the stop; with 1 Voice, nothing.
- Each restarted Oscillator's frequency and detune connections are never removed (4,874 made, none removed over 90 s of Demo). Chromium collects the nodes anyway; WebKit and Firefox were not measured.

**Blocked by:** none

**Status:** done (2026-10-30). A key or a stop that comes before a Note the players handed over leaves one copy of each Oscillator and LFO sounding, a stopped player's handed-over Notes release from the stop on any number of Voices, and an ended Oscillator is disconnected both ways. Not yet heard by the owner.

**Since then:** a stop before a Note handed over no longer restarts that Note's Oscillators inside the Release: a Gate off before its Note has started calls the restart off ([102](./102-a-note-during-a-release-clicks.md), 2026-10-30). The "Not changed" note below no longer holds.

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
- [x] An engine test: a key taking over within the look-ahead peaks as one Note does, not two (a bare sine stays at 1.0)
- [x] The existing engine test of a stopped player, extended to several Voices, finds silence after the Release
- [x] An engine test counts the connections made and removed over many Notes and finds them equal once the nodes end

**Out of scope:**
- How long the look-ahead is
- Whether each Note restarts the Oscillators (issue 94; the click during a Release is [102](./102-a-note-during-a-release-clicks.md))

## How it was built

- **One node at a time.** The Oscillators and the LFOs now share one helper, `createTakeover` in `src/engine/synthEngine.ts`, which keeps every node not yet ended with when it stops. A restart stops every node still due to sound past its moment there: the one playing and, when it comes before a restart handed over already, the node that one was replacing (the reviewer's fix, `stop(t)` on the previous node, covered two restarts but not three handed over in a row). A node scheduled to start later is stopped before its start, so it never sounds; Chromium still sends its ended event (checked offline). A new wave or LFO Rate reaches every node not yet ended, as before.
- **Disconnected both ways.** An ended Oscillator is disconnected from its frequency and detune sources as well as from its outputs, as the reviewer suggested; an LFO's oscillator has no inputs.
- **Note Off.** The engine's Note Off closes every Voice whose Note has no release recorded or one later than the Note Off, so a Note a player handed over ends at the stop on several Voices as on one. The Transport's stop therefore closes the Gate once, now: its second Gate off just past the look-ahead served nothing any more and is gone (Claude's call, approved by the owner on 2026-10-30); issue 75 has a "Since then" line.
- **Tests** (`src/engine/synthEngine.browser.test.ts`). A bare sine, the Demo's next Note handed over for 0.5 s and a key taking over at 0.3 s (A4 in phase): the peak was 2.0 times one Note's, now 1.0. A square LFO retriggered by the key at 0.6 s, the Demo's handed over for 0.8 s: the sound sat at 440 Hz (the two LFOs cancelling) against the model's semitone up; now it follows the model. The stopped-player test runs on 1 and 4 Voices and renders the sound: on 4 Voices the handed-over chord played after the stop and the model showed it sounding; now both are silent after the Release. A count of connections over 30 Notes on 4 Voices with retriggering LFOs finds none left on any of the 100-odd Oscillators that ended (2 each before). The Transport's stop test expects one Gate off. Vitest: 833 passed. Playwright not run in this lane.
- **Not changed.** A Note handed over still restarts its Voice's Oscillators at its time after a stop, inside the Release: the click that makes is issue 102's.
