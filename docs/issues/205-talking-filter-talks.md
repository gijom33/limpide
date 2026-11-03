# 205: Talking Filter talks

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [166](./166-the-edges-three-findings.md): "Talking filter alternate a voicy sound and a bip: That's wrong." 166 retuned Talking Filter once Resonance could no longer go below its floor: LFO 2, a square, now flips its band-pass every 0.7 s between its widest (Q 0.5, the "voicy" sound) and narrow (Q 14, a whistle the owner hears as a beep). The Preset should sound as its description says: "vowels that never settle, like a robot mumbling." Polish of v1's Presets ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

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
- [ ] No moment of the held C4 has a Q above the chosen narrow end (about 6), measured on what the engine plays
- [ ] The band moves between vowels without a flip (LFO 2 a Sine or Triangle, or a reason given)
- [ ] Loudest 100 ms on C4 within 1 dB of today's
- [ ] Profile 15's ear check: it mumbles, no beep
- [ ] The Preset's browser test passes with the new settings

**Out of scope:**
- The Resonance floor (166)
- Other Presets
