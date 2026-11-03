# 119: Legato mode

**What to build:** From Claude's brainstorm, accepted by the owner in triage ([117](./117-more-to-play-and-hear.md), decision 1, 2026-10-30): a switch beside Glide, with one Voice, so that a Note played while another is held slides there and the Envelopes carry on, as on a classic monosynth. Today such a Note keeps the Oscillators running (issue 94) but starts both Envelopes again.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-10-31) on night/2026-10-31 and released; tried by the owner: "Perfect."

## Agent Brief

**Category:** enhancement
**Summary:** With Legato on and one Voice, a Note played over a held one changes pitch (gliding if Glide is up) without restarting the Envelopes or the retriggered LFOs.

**Current behavior:** with one Voice, every Note starts both Envelopes from their Attack, held key or not.

**Desired behavior:**
- A Legato switch beside Glide, part of the Patch, off by default; old Patches and Share links load with it off.
- With Legato on and one Voice: a Note played while another key is held changes pitch only (at once, or over the Glide time); the Amp and Filter Envelopes carry on from where they are, and LFOs set to retrigger on each Note do not restart. A Note played with no key held starts as now. Releasing the newest key back to a held one (PRD story 6) also slides without a restart.
- With several Voices, the switch greys out as other inactive controls do, with a description saying why.
- The Modulation model and the Timeline follow: a legato Note draws no new Attack.
- A tip says what it does and to try it with Glide; one Preset (a lead) uses it.
- On the C16, bank C's R2 button (a toggle) switches Legato ([145](./145-the-c16-layout-strip-by-strip.md)'s layout, which keeps that place for it); the printable C16 card shows it.

**Key interfaces:**
- The Patch and its Voice-related controls
- The engine's Note On for one Voice, the Modulation model's Gate history

**Acceptance criteria:**
- [x] An engine test: with Legato on, a second key held over the first gives no new Attack on the Amp Envelope; with it off, it does
- [x] The model's Envelope levels match the engine's for a legato line (the model-against-sound test)
- [x] A Patch without the field loads with Legato off; a Share link carries it
- [x] With 2 or more Voices the switch is greyed out and described
- [x] The C16's R2 on bank C switches Legato, and the C16 card shows it
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Legato with several Voices
- The Release click ([102](./102-a-note-during-a-release-clicks.md))

## How it was built (2026-10-31, on night/2026-10-31)

**What was built:**
- **In the Patch:** `legato`, off or on, off by default: a Patch or Share link from before loads with it off; a link carries it when on.
- **The engine:** with one Voice and Legato on, a Note played over a key still held changes the pitch alone, at once or over the Glide: no new Attack on either Envelope, no restart of the Oscillators or of an LFO set to Retrigger, and its Velocity is not taken (the line keeps its first Note's). The Modulation model records no Gate for it, so the Timeline draws one Attack for the line. Releasing the newest key back to a held one already slid without a restart (PRD story 6), Legato on or off. With every key up the next Note starts as any does.
- **The switch:** a slurred-Notes icon button named Legato, in the Amp, under the Voices numbers, its end by Glide; greyed out and described ("No effect with more than one Voice") with 2 or more Voices, as Glide is. Its tip says what it does and to try it with Glide. The LFOs' Retrigger and Sync and Legato now share one Switch component.
- **The C16:** bank C's R2 switches Legato (a toggle); the card and `docs/c16-card.pdf` show it; a C16 set up with issue 145's layout gains it where its own Mappings leave the place free.
- **A Preset:** Portamento (Leads) turns Legato on.
- **The record:** CONTEXT.md defines Legato (and Retrigger names the legato Note aside); the PRD gains story 102; issue 145 says 119 filled its place.
- **Tests:** engine tests (one Attack with Legato on, a new one with it off; the model against the sound along a legato line, and the line's sound against one Note held as long; a retriggered LFO runs on; no slide with every key up, under Hold, or on 2 Voices); the Note input's `afresh`; the Patch and Share link; the C16 layout; the edge sweep plays a legato line on every one-Voice Patch with Legato on, with a hard case of its own; Playwright for the switch, its place at every width from 340 to 1920 px, and the card.

**Claude's calls, open to the owner:**
1. **Where the switch is.** Right of Glide it wrapped onto a line of its own at many widths (375–402, 606–661, 781–822, 865–983, 1159–1221, 1334–1389 px), up to 27 px short. Under the Voices numbers, its end by Glide, it sits in the room Glide's name and value leave, and never wraps; the heading row is 10 to 30 px taller where the Voices name is above its numbers (phones, 2 × 2 and the narrower three-across).
2. **Hold:** with every key up and Hold (or a sustain pedal) keeping the last Note, the next key strikes afresh, with an Attack, as the issue and the tip say; a key played over one still down slides, Hold on or off. (A monosynth whose pedal keeps its Gate open would slide there too.)
3. **Velocity:** a legato Note keeps the line's first Velocity (the Amp's level and Velocity → Cutoff), since its Envelope is not struck again.
4. **Portamento's sound:** besides Legato, it gains a Filter Envelope (Amount 1.5 oct, Decay 0.6 s, Sustain 0.3), so the one Attack of a legato line is heard: before, its Envelopes were flat, and Legato changed nothing you could hear. Its description says so.
5. **The players** (the Demo, the Song, a Tutorial's Listen) hand each Note's release over before the next Note, so they never play legato: only keys held do.

**Tests run:** `npx tsc`, `npm run lint`, every Vitest test (1235, after the main build; the engine, input and session files again after the review's fixes), the whole Playwright suite in Chromium (526 passed; the mascot's 2 × 2 scroll and MIDI Learn's Tap timing failed under load and passed run alone), and the touched specs (voices, C16 card, LFO, keyboard access, Hold rhythm, MIDI keyboard, piano) in Chromium and WebKit after the fixes.

**Not verified here:** "every test passes in Linux's fonts too" (the branch run on GitHub will say; the switch's place under the numbers does not depend on the label's width).

**To try in the app:**
- Load Portamento. Hold a key and play others over it, without letting go: the pitch slides from Note to Note, the Filter's bite only on the first, and the Timeline draws one Attack. Let go of every key and play again: a new Attack.
- Init with Glide up: switch Legato on and off and play overlapping keys; set Voices to 2 or more: the switch greys out.
- An LFO with Retrigger on a slow rate: with Legato on, a legato line rides one cycle; with it off, each Note restarts it.
- Hold on, play a key, let go, play another: it strikes afresh with an Attack.
- On the C16: bank C's R2 switches Legato (set it to Toggle); the card in the MIDI panel shows it.

