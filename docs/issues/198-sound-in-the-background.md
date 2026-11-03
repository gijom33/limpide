# 198: The players keep time when the page is in the background

**What to build:** The owner's bug (inbox, 2026-11-02): "When webpage loses focus, the sound is not fully processed and some of it is skipped. Can we force this not to happen?" A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1. Which browser, and which sound (the Demo, the Song, Hold's rhythm, or Notes played by hand or from the C16), is asked of the owner; the brief covers each

## Decisions

Decided by the owner, 2026-11-02:

1. **Sound is not skipped** when the page loses focus or goes to the background ("Can we force this not to happen?").

Claude's calls, open to the owner:

2. **The likely cause, to confirm first:** the players (the Demo, the Song, Hold's rhythm) hand their Notes to the engine from the page's main thread, 100 to 150 ms ahead of the audio clock, on a timer every few tens of milliseconds. A browser slows a background page's timers to about once a second (Safari also an unfocused or covered window), so Notes come late, bunched, or are lost. The sound itself runs on the audio thread and is not slowed; Notes played by hand or from MIDI should not be touched, which the reproduction checks.
3. **The fix keeps the look-ahead short in front:** the players' tick comes from a clock the browser does not slow (a timer in a worker, or the audio thread's own), and while the page is hidden the look-ahead widens (to about 2 s) so a slowed tick still finds its Notes handed over. In front again, it narrows, so a Stop or a change of Preset is still heard at once.
4. **What can't be forced:** a browser may still suspend a page it freezes (a phone's locked screen, an old background tab). That is the browser's, not Limpide's; the page then resumes cleanly, with no burst of late Notes.

## Agent Brief

**Category:** bug
**Summary:** With the page unfocused or in the background, the players' Notes are skipped or late, though the sound keeps running.

**Current behavior:** The owner (2026-11-02): when the page loses focus, part of the sound is skipped. The players schedule their Notes from the page's main thread a short look-ahead ahead, on a timer that browsers slow in the background, so Notes due between two slowed ticks may come late or be lost.

**Desired behavior:**
- First, reproduce: the Demo, the Song and Hold's rhythm, in Chromium and WebKit, with the page hidden (another tab) and unfocused (another window in front), recording which Notes start and when on the audio clock. Notes played by hand or by MIDI too. Record what is found in this issue.
- The players keep time in the background: every Note starts on its beat, none lost, none bunched. A Note already past its start when it is handed over is dropped, not played late in a burst.
- In front, the look-ahead stays as short as now, so Stop, Freeze, a Preset change and a tempo change are heard as quickly as now.
- Coming back in front plays on smoothly.

**Key interfaces:**
- The Transport (its tick and look-ahead) and the players built on it: the Demo, the Song, Hold's rhythm
- The page's visibility and focus
- The audio clock

**Acceptance criteria:**
- [ ] The reproduction recorded in this issue, per browser and per player, with and without the fix
- [ ] A unit test: with ticks slowed to once a second, every Note of a phrase is handed over before its start, none twice, none after it
- [ ] A unit test: a Note whose start has passed is dropped, not played late
- [ ] An e2e test in both browsers: the Demo with the page hidden for 5 seconds starts every Note of those seconds on time (as the engine records them)
- [ ] Stop, a Preset change and a tempo change in front are as quick as before; every test passes in Linux's fonts too

**Out of scope:**
- A page the browser freezes or suspends (decision 4)
- The Viewers, which need not draw while hidden
