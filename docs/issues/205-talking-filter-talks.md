# 205: Talking Filter talks

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [166](./166-the-edges-three-findings.md): "Talking filter alternate a voicy sound and a bip: That's wrong." 166 retuned Talking Filter once Resonance could no longer go below its floor: LFO 2, a square, now flips its band-pass every 0.7 s between its widest (Q 0.5, the "voicy" sound) and narrow (Q 14, a whistle the owner hears as a beep). The Preset should sound as its description says: "vowels that never settle, like a robot mumbling." Polish of v1's Presets ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, released in 1.23.0; tried by the owner: "All good."

## Decisions

Decided by the owner, 2026-11-02:

1. **No beep:** Talking Filter does not alternate between a voice and a beep ("That's wrong"); it mumbles, as its description says.

Claude's calls, open to the owner:

2. **Retuned, not rebuilt:** the same idea (a band-pass, LFO 1 on its Cutoff, LFO 2 on its Resonance at another speed) with settings that keep every moment vowel-like: the narrow end no narrower than a vowel's formant (Q about 4 to 6 rather than 14), and LFO 2 a Sine or Triangle so the band glides between vowels rather than flipping. The implementer tunes by ear and by the Spectrum, and may change other settings of the Preset only if those are not enough.
3. **Its level kept** within 1 dB of today's loudest 100 ms on C4, as 166 held it.
4. **Profile 15's ear check** (the sound designer) before the owner's, as for 166; then the owner hears it before the release.

## Agent Brief

**Category:** bug
**Summary:** The Talking Filter Preset alternates between an open, voice-like sound and a narrow whistle heard as a beep; it should mumble through vowels.

**Current behavior:** Held on C4, Talking Filter's band-pass is flipped by a square LFO on its Resonance every 0.7 s between its widest band and a very narrow one (Q 14), while another LFO sweeps its Cutoff at 2.5 Hz. The narrow half sounds like a beep, not a vowel.

**Desired behavior:**
- Held on C4 and across the keyboard, Talking Filter sounds like vowels that never settle, at every moment: no part of its cycle is a whistle or a beep.
- It still changes all the time, at two speeds, and still reads as the band-pass Preset of its group.
- Its description stays true; its level stays within 1 dB of today's.
- The Preset's existing browser test is updated to the new settings and still checks it talks.

**Key interfaces:**
- The Talking Filter Preset's settings (Filter Mode, Resonance, the two LFOs' shapes, Rates and Depths, Volume)
- The Resonance floor that 166 added (unchanged)

**Acceptance criteria:**
- [x] No moment of the held C4 has a Q above the chosen narrow end (about 6), measured on what the engine plays
- [x] The band moves between vowels without a flip (LFO 2 a Sine or Triangle, or a reason given)
- [x] Loudest 100 ms on C4 within 1 dB of today's
- [ ] Profile 15's ear check: it mumbles, no beep
- [x] The Preset's browser test passes with the new settings

**Out of scope:**
- The Resonance floor (166)
- Other Presets

## How it was built

**Talking Filter, retuned:** Resonance 0.45 → 0.35, LFO 2 Square → Triangle, its Depth 0.45 → 0.25, Volume 0.9 → 1; LFO 1 and the Rates (2.5 Hz and 0.7 Hz) unchanged. LFO 2 now glides the Resonance between 0.10 and 0.60, so the band's Q glides between 0.72 (an open "ah", a little narrower than the band-pass's widest) and 4.5 (a closed vowel), and back, every 1.4 s, while LFO 1 sweeps it an octave either way of 800 Hz. Before, it flipped between Q 0.5 and Q 14 every 0.7 s. The description stays as it is. *(2026-11-03: [226](./226-two-presets-high-up.md) moved the band to 1 kHz on C4 and gave it Key Track 0.5, so C5 keeps its vowels; this issue's test now holds it a band-pass by its fundamental and its top above 8 kHz, both more than 6 dB under the open saw, and its level is held by 226's test.)* *(2026-11-05: [231](./231-a-band-pass-not-so-much-quieter.md) gave the band-pass a make-up that follows the Resonance, so its narrow moments are no longer quieter; its Volume went from 1 to 0.27, which keeps its loudest moment on C4 where it was.)*

Measured offline on C4, held 4 s (the engine's render, the limiter's curve straight):

- **The band's Q:** 0.72 to 4.5 at every moment, by the model the engine follows (issue 166); before, 0.5 to 14.
- **The beep:** the strongest Harmonic's share of a 40 ms window, at most 77 % (89 % before), and above 70 % in 4 windows of 90 (26 before).
- **The level:** loudest 100 ms −21.9 dBFS (−21.7 before); C2 −26.9 (−26.0), C6 −21.3 (−21.3). Its swing from window to window is 12 dB (21 dB before). Its group's level test passes.

The Preset's test now checks LFO 2 a Sine or Triangle, the Q at or under 6 at every moment and moving across a factor of 4, no window with one Harmonic over 85 %, the sweep, the band-pass short of the open saw above 4 kHz, and the level within 1 dB of −21.7 dBFS. Issue 166's edge test reads LFO 2's foot where a triangle has it, and still tells the curved Q swing from a straight one.

### Calls made (Claude's call, open to the owner)

- **A Triangle rather than a Sine** for LFO 2: always moving, it spends less time at the narrow end than a Sine, which dwells at its ends.
- **The narrow end at Q 4.5,** at the low end of the issue's "about 4 to 6", and the wide end at Q 0.72 rather than the band-pass's widest (0.5), so the cycle's two ends are nearer each other and its level swings less; Volume up to its top, 1, to keep the level.
- **Profile 15's ear check, as a stand-in by measurement:** no ears at night, so the check is the numbers above, in profile 15's way (offline renders, the engine's model). The owner's ears are the real check.
- **Above C4, still one Harmonic at a time:** on C5 the strongest Harmonic is over 70 % of the sound in 46 windows of 90 (56 before), on C6 in all of them, before and now. Harmonics 523 Hz or more apart (C5 and up) rarely fit two in a band 90 to 350 Hz wide, however it moves; only a wider band, or a Cutoff following the Note (Key Track), would change that, and either changes the Preset's character. Left as it is, for the owner's ears: if C5 and up beep, Key Track on the Cutoff is the next thing to try.

### What to try

Load Talking Filter and hold C4: it should mumble without settling, the vowel opening and closing slowly under a quicker wobble, with no beep at any point of the cycle. Then try C3 and C5, and a short phrase.

**Since then (2026-11-06, [231](./231-a-band-pass-not-so-much-quieter.md)):** the band-pass is made up to about a low-pass's level, so Talking Filter's Volume is down from 1 to 0.27, matched on its loudest moment over its LFO cycle (231's decision 9).
