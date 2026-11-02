# Persona review 17: the MIDI mapping geek, on 1.21.1

Read: the published site (1.21.1) at 1440 × 900 in Playwright Chromium, with no real hardware. A stand-in Web MIDI input, adapted from `e2e/fakeMidi.ts`, sent the messages, with one to three named ports ("Stand-in Controller", "Keystation 49", "TempoPAD C16", "Synido TempoPAD C16 BT Bluetooth"). Clock ticks were stamped as a DAW's or a Bluetooth link's would be. The code read was `src/midi` (parser, inputs, clock, control surface, Encoder Mode, C16), `src/play/tempoStore.ts`, `src/ui/hooks/useMidi.ts` and the engine's `setTempo`, plus issues 132, 136, 143, 145, 147 and 160 and the open inbox, so that no finding repeats one already filed. About 45 minutes, 2026-11-02. The scripts are in this session's scratchpad (`review-17/`), not in the repository.

## First impression

"It feels like a plugin now. I sent it a clock and it read 120 MIDI within half a second. I fed it a lost-signal Bluetooth clock and it didn't blink. I pressed pads and the Cutoff opened under the hardest one. My endless knob turned the Cutoff a semitone a click, which is the right resolution. Then I ran Quick Setup and turned my encoder the way everyone does, quickly. It was learned as Absolute, and after that the knob did nothing. My keyboard's panic button did nothing either."

## What they tried

1. **A DAW's clock, six ways.** 120 BPM with 1 ms of jitter: 120 held for 20 beats. 127.6 BPM: 128 held. 174 BPM delivered in 15 ms bunches with arrival stamps, as Bluetooth delivers: it settled on 174 and held. 4 ms jitter with 60–80 ms stalls in delivery: 120 held. A ramp from 100 to 140 over 12 s: followed one BPM at a time. Stop, then 1.5 s of silence: the MIDI mark went after a second and 140 stayed, the person's to change. Continue: marked again.
2. **A clock with a fault.** One tick lost in every 300: the readout went 120 → 119 → 118 → 119 → 120 over two seconds, each time. One tick doubled at 128: 128 → 129 → 130 → 129 → 128. A clean jump from 120 to 90 read 114, 103, 94, then 90 over about 2 s. Issue 136 says the readout passes "straight from one to the other".
3. **Aftertouch.** Polyphonic pressure on three held pads: the Cutoff's dot followed the hardest one. One pad released without a 0 first: the next highest took over. All released: no pressure. A pressure arriving just after its Note-off stayed, and opened the Cutoff for the next Note played. This is issue 132's decision 2 ("even a Note whose Note-on the page never heard"), but nothing clears it short of that Note being pressed and released again.
4. **Panic.** Two Notes held, then All Notes Off (CC 123), then All Sound Off (CC 120): both Notes still held. Pedal down, channel pressure at 100 and bend up, then Reset All Controllers (CC 121): the Note stayed held by the pedal, and the pressure stayed on the Cutoff.
5. **MIDI Learn on Actions** (issue 147): a toggle's lone 127 on Next Preset was learned as a toggle and stepped a Preset on every press. A momentary button's 127 then 0 on Previous Preset was learned as momentary and stepped once a press. Both right.
6. **MIDI Learn on switches and lists.** A toggle on LFO 1 Retrigger was learned as "Relative" and never switched it. A momentary button on Slope switched it only while held. On Osc 1 Waveform, the press gave Pulse and the release gave Sine, every time. These confirm the inbox's line of 2026-11-01 and are not repeated below.
7. **MIDI Learn on knobs.** A 64-centred encoder turned slowly (one click, then still) was learned as Relative. The same encoder turned briskly (66, 69, 71, 67), in Learn and in Quick Setup's first step, was learned as "Absolute, with Pickup". After that, 24 clicks up and 24 down left the Cutoff at 2.00 kHz. An Absolute fader at the bottom, nudged once to 1, was learned as Relative. The MIDI panel offers no way to change a Mapping's mode.
8. **A Relative encoder at speed** (issue 160), on Mappings learned slowly:
   - Cutoff: a semitone a click, 20 Hz to 20 kHz in about 120 clicks (five turns of a 24-detent encoder)
   - Resonance: 1 % a click
   - Attack and Release: 1 ms to 10 s in about 80 clicks
   - LFO Rate: 0.05 to 20 Hz in about 60 clicks
   - an accelerated +6 moved six steps
9. **The C16.** Its layout came in from either name, its Mappings marked "C16 only". A keyboard's sustain pedal (CC 64, bank B's M2) from another port no longer steps a Preset. With the C16 listed on USB and on Bluetooth at once (the panel shows "Connected: TempoPAD C16, Synido TempoPAD C16 BT Bluetooth"), each message arrived twice:
   - a press of bank D's R2 (LFO 1 Sync, a toggle) left Sync off
   - ten clicks of bank B's K1 moved the Cutoff 20 semitones rather than 10
10. **Dense streams.** Four pads' pressure at 100 messages a second each, channel pressure and the mod wheel at 200 a second: nothing was lost and no errors appeared. The frame rate in headless Chromium is no measure, so review 18 owns it.

## What worked

- **The clock follower is better than most plugins'.** It holds steady under jitter, delivery stalls and Bluetooth's bunching, a fractional DAW tempo holds one whole BPM, and Stop, silence and Continue each do what a player expects.
- **Polyphonic aftertouch from the pads**, the highest held pad's pressure, with its Destination in the MIDI panel, remembered.
- **Relative knobs step in each control's own unit:** a semitone of Cutoff a click is what a hardware synth's encoder does.
- **Issue 147:** toggle and momentary told apart on Actions, from the one press.
- **The C16's Mappings answer the C16 alone,** so last review's finding 2 (a keyboard's pedal and mod wheel hitting the layout) is gone.

## Where they got stuck

- **Quick Setup's first knob.** A brisk turn, the natural one, makes an accelerated encoder Absolute, and nothing on the page says so or offers Relative. The fix is to delete the Mapping and learn it again, slowly, which only works if the player guesses why it failed.
- **Stuck Notes.** A DAW's or keyboard's panic is ignored, so the cure is to find each stuck key and press it again, or to reload.
- **The C16 on USB and Bluetooth together:** its switches don't switch and its knobs run double. Whether the C16 offers both ports at once is last review's question 7, still unanswered.
- **The beats after a lost tick:** the count runs one tick (21 ms at 120 BPM) behind the DAW's until the next Start. Each further loss adds another tick.
- **Starting the DAW mid-song.** By the MIDI 1.0 spec, a DAW playing from anywhere but the top sends a Song Position Pointer, then Continue. Limpide skips the pointer (issue 136 put it out of scope), so its beats go on from wherever the last Stop left them, up to half a beat off. A synced 1/4 LFO then peaks on the off-beat. This is read from the code, not heard.

## Would they

- **Like:** yes. The clock and the pads' pressure are done properly.
- **Share:** yes, with a synth friend who has a DAW, with "turn your knobs slowly in Quick Setup".
- **Come back:** yes, for the C16 once the double-port question is answered.
- **Recommend:** not yet to a live player. Ignoring the panic is what keeps it from being trusted on a stage.

## Findings, ranked

1. MIDI Learn and Quick Setup learn an accelerated Relative encoder turned briskly (66, 69, 71, 67) as "Absolute, with Pickup", after which the knob moves nothing either way. An Absolute fader nudged once from the bottom is learned as Relative. The MIDI panel offers no way to change a Mapping's mode: read values all within a few steps of 64 (or of 0 and 127) as Relative even without a repeat, and let the panel switch a Mapping between Absolute and Relative.
2. All Notes Off (CC 123) and All Sound Off (CC 120), which a keyboard's or DAW's panic sends, leave every Note sounding. Reset All Controllers (CC 121) leaves the pedal, the bend and the aftertouch as they were: answer all three as the MIDI spec says, the pedal still holding Notes under CC 123.
3. A C16 listed on USB and on Bluetooth at once (both in the MIDI panel's Connected line) is heard twice: a press of a toggle switch (bank D's R2, LFO 1 Sync) switches it on and back off, and its knobs move double. Follow one port of a known Controller, the first connected, and say so in the panel.
4. A MIDI clock with one tick lost or doubled reads as a tempo change (120 → 119 → 118 → 119 → 120 over two seconds), and the beat count stays a tick (21 ms at 120 BPM) off the DAW's until the next Start, each loss adding one. Count a gap of about two ticks as a missed tick rather than a slower tempo. Also, a jump from 120 to 90 reads 114, 103, 94, 90, against issue 136's "straight from one to the other".
5. A DAW playing from anywhere but its start sends a Song Position Pointer, then Continue (MIDI 1.0). Limpide skips the pointer, so its beats go on from where the last Stop left them, up to half a beat off the DAW's, and a synced LFO peaks off the beat. Song Position Pointer is out of issue 136's scope: worth reconsidering, since it is two bytes the parser already skips.
