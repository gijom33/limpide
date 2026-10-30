# 120: Recording to a WAV file

**What to build:** From Claude's brainstorm, accepted by the owner in triage ([117](./117-more-to-play-and-hear.md), decision 6, 2026-10-30): a small record button that captures what is played and saves a WAV file, so a sound can be shared and not only a link. The PRD's Out of Scope amended the same day.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** One button records what Limpide plays and, when stopped, saves it as a WAV file named after the Patch.

**Desired behavior:**
- A Record button in the Patch panel, beside Share (Claude's call, open to the owner): pressed, it records the synth's output, everything heard (played Notes, the Demo, the Song); pressed again, or after 5 minutes, it stops and the browser saves a 16-bit stereo WAV at the page's sample rate, named "Limpide – <Patch name> – <date>.wav".
- While recording, the button shows it (a red dot and the elapsed time), and the Patch panel can be closed without stopping it.
- The recording is taken from the output the speakers get, after the limiter, through the browser's own nodes ([ADR-0001](../adr/0001-native-web-audio-nodes-over-custom-dsp.md)); nothing in the audio path changes, and nothing is sent anywhere.
- A browser that cannot record hides the button.
- The PRD gets a user story for it.

**Key interfaces:**
- The engine's output, and the Patch panel's row of buttons

**Acceptance criteria:**
- [ ] A test records two seconds of a Note and gets a valid WAV of about two seconds, its level matching the output's
- [ ] Recording changes nothing heard (an offline render with and without matches)
- [ ] The button works by keyboard and is named for screen readers
- [ ] The 5-minute limit stops and saves

**Out of scope:**
- Compressed formats (MP3, Ogg), uploading or sharing a recording
- MIDI recording or a sequencer
