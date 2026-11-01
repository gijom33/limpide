# 173: A Circuit Tracks layout: the research pass

The research pass for [issue 173](../issues/173-a-circuit-tracks-layout.md): what Novation's Circuit Tracks sends and receives over MIDI, so the owner's grilling can decide a built-in layout for it, as [145](../issues/145-the-c16-layout-strip-by-strip.md) did for the C16. It ends with design facts for the grilling, not decisions. Claude's research pass, 2026-10-31, open to the owner.

## How to read it

Each fact carries a confidence mark, as in the research for [134](./134-history-in-the-tooltips.md):

- **A**: read in a primary source, Novation's own guide, reference or help article, read for this pass.
- **B**: primary, but only partly settled by it: a table that lists a message without saying which way it travels, a behaviour read from the code of Novation's Components rather than from a document, or a reasonable reading of a sentence that does not say it outright.
- **C**: secondary only (community code, forums).
- **U**: not sourced. Kept so the grilling knows the gap is there; most can be settled in a minute with the owner's device and a MIDI monitor.

The PDFs were read as extracted text; "p. n" is the guide's printed page number, which is also its PDF page.

## Sources

Primary, read:

- **[S1]** *Circuit Tracks User Guide*, Version 3, English, © 2022 Focusrite Audio Engineering (PDF created 2022-10-19). The current English PDF on Novation's downloads page. <https://fael-downloads-prod.focusrite.com/customer/prod/downloads/circuit_tracks_user_guide_v3_en.pdf>
- **[S2]** *Circuit Tracks User Guide*, Version 6.0, the online edition on Novation's user guide site (articles updated 2026). Its pages refuse automated fetches; they were read through the site's public Help Centre API, which returns the same article bodies. Its MIDI chapters say the same as [S1] word for word. The articles used:
  - Appendix (Setup View, MIDI channels, MIDI I/O, clock): <https://userguides.novationmusic.com/hc/en-gb/articles/25494477003154-Circuit-Tracks-appendix>
  - Synths, MIDI tracks and drums: <https://userguides.novationmusic.com/hc/en-gb/articles/26207128061458-Using-Circuit-Tracks-Synths-MIDI-Tracks-and-Drums>
  - Mixing and performing (tempo, external clock, mixer, FX, filter): <https://userguides.novationmusic.com/hc/en-gb/articles/26207162799506-Mixing-and-performing-on-your-Circuit-Tracks>
  - Introduction and hardware overview: <https://userguides.novationmusic.com/hc/en-gb/articles/25494476232594-Introduction-to-the-Circuit-Tracks>, <https://userguides.novationmusic.com/hc/en-gb/articles/25494476280850-Circuit-Tracks-hardware-overview>
  - A caution: the online appendix names the Bootloader buttons as "Sample Rec, Sample and Note", which are Circuit Rhythm's; [S1] and [S7] say Scales, Preset and Note. The online copy is not error-free.
- **[S3]** *Circuit Tracks Programmer's Reference Guide*, Version 3 (PDF created 2020-10-20, the launch year). Read in full. <https://fael-downloads-prod.focusrite.com/customer/prod/downloads/circuit_tracks_programmer_s_reference_guide_v3.pdf>. Its tables give a CC or NRPN number for each parameter under the heading "Send messages on MIDI Channel 1 for Synth 1 and Channel 2 for Synth[ 2]", that is, what the Circuit Tracks responds to; they do not say what it transmits.
- **[S4]** Novation Downloads, *Circuit Tracks*: lists [S1] and [S3] as the current English documents, and the Windows USB driver. <https://downloads.novationmusic.com/novation/circuit/circuit-tracks>
- **[S5]** Novation Help Centre, *Keeping multiple Circuit Tracks and Circuit Rhythm(s) in sync* (updated 2026-05-15). <https://support.novationmusic.com/hc/en-gb/articles/24060538791570-Keeping-multiple-Circuit-Tracks-and-Circuit-Rhythm-s-in-sync>
- **[S6]** Novation Help Centre, *Circuit Tracks Components guide* (updated 2026-09-04). <https://support.novationmusic.com/hc/en-gb/articles/360020976619-Circuit-Tracks-Components-guide>
- **[S7]** Novation Help Centre, *Updating Circuit Tracks Firmware*. <https://support.novationmusic.com/hc/en-gb/articles/360019538120-Updating-Circuit-Tracks-Firmware>
- **[S8]** Novation Help Centre, *Sending a MIDI Input to a MIDI out via a MIDI Track with Circuit Tracks*. <https://support.novationmusic.com/hc/en-gb/articles/360021264240-Sending-a-MIDI-Input-to-a-MIDI-out-via-a-MIDI-Track-with-Circuit-Tracks>
- **[S9]** Novation Components, the web app's shipped JavaScript as served on 2026-10-31 (<https://components.novationmusic.com/>, bundle `assets/main-D3lNZfPT.js`): its Circuit Tracks device class (how it recognises the port, the settings it asks the device for, a message the device sends when its view changes) and its MIDI template model. The maker's own code, but not a document: any fact from it is **B**, and may change with any release.
- **[S10]** *Circuit Programmer's Reference Guide* 1.3 (the original Circuit, for comparison). <https://fael-downloads-prod.focusrite.com/customer/prod/downloads/Circuit%20Programmer's%20Reference%20Guide%201.3_2.pdf>
- **[S11]** W3C, *Web MIDI API*, Working Draft. <https://www.w3.org/TR/webmidi/>

Secondary:

- **[S12]** `namirsab/circuit-tracks-tools` (a community Python library) connects to a port named "Circuit Tracks MIDI". <https://github.com/namirsab/circuit-tracks-tools>
- **[S13]** CIRCUIT-HACKS-RC wiki, *MIDI* (a community firmware mod; its "stock" notes give the macro positions as CC 80–87). <https://github.com/Ghillermo/CIRCUIT-HACKS-RC/wiki/MIDI>

---

## The device, as the panel shows it

- **Eight macro knobs, endless encoders, each with an RGB LED** whose brightness shows the value: "The rotary controls are 'endless'; the LEDs therefore provide an indication of the parameter value" ([S1] p. 34; p. 15). **A**
- **Their panel legends,** "as applied to the synth tracks for the default Patches" ([S1] p. 15): 1 Oscillator, 2 Oscillator Mod, 3 Amp Envelope, 4 Filter Envelope, 5 Filter Frequency, 6 Resonance, 7 Modulation, 8 FX. **A** (read from the panel drawing on p. 15)
- **They sit in a zig-zag:** the odd knobs (1, 3, 5, 7) on a lower row, the even knobs (2, 4, 6, 8) on an upper row, each even knob up and to the right of its odd one: four pairs across the panel ([S1] p. 15, the drawing). **A**
- **A Master Filter knob** with a centre detent: low-pass turning left, high-pass turning right, no filtering at the detent; "always active", on the whole mix ([S1] p. 15, p. 94). **A**
- **A Master Volume knob,** not on MIDI in any table of [S3]. **A** (as an absence in [S3])
- **A 4 × 8 grid of 32 velocity-sensitive RGB pads** ([S1] p. 15; [S2] introduction). **A**
- **Eight track buttons:** Synth 1, Synth 2, MIDI 1, MIDI 2, Drum 1 to 4; and view buttons (Note, Velocity, Gate, Pattern Settings, Scales, Preset, Patterns, Mixer, FX, Tempo/Swing, Clear, Duplicate, Save, Projects, Shift, Record, Play, the two arrow buttons) ([S1] pp. 15–17). **A** No table in [S3] gives a message for any button. Whether a button sends anything over MIDI: **U** (the documents suggest not).
- **No faders, no Bluetooth.** Its MIDI connections are the USB-C port and 5-pin DIN In, Out and Thru ([S1] p. 18). **A**

The knobs' meaning changes with the selected track and View: on a synth track they are that synth's macros; on a MIDI track they send the MIDI template's CCs; on a drum track only the even knobs work (2 Pitch, 4 Decay, 6 Distortion, 8 EQ); in Mixer View they are the eight tracks' levels (or pans); in FX View the eight tracks' reverb or delay sends; in Tempo View Macro 1 sets the tempo, 2 the swing, 5 the click level ([S1] pp. 15, 17, 57, 63, 85–91). **A**

## The name it gives over USB, and over DIN

- **Its USB port is class compliant:** "The port is MIDI class compliant" ([S1] p. 18). No driver is needed on a Mac; Novation offers a USB driver for Windows ([S4]). **A**
- **Its port's name contains "Circuit Tracks".** Components recognises the device by a port name that includes "Circuit Tracks" and none of "MIDI 2", "MIDI 3", "DAW", "DIN", "MIDIIN", "MIDIOUT", and recognises its bootloader by a name containing both "Circuit Tracks" and "Boot" ([S9]). **B**
- **The exact name on a Mac in Chrome is "Circuit Tracks MIDI"** by a community library ([S12]). **C**: the owner's device should be checked (the MIDI panel or Audio MIDI Setup).
- **How many USB MIDI ports it shows** (one is assumed): **U**.
- **Over DIN through an interface,** the port's name is the interface's, not the Circuit Tracks': Web MIDI gives "the system name of the port" ([S11]). **A** for Web MIDI; so a page cannot tell a Circuit Tracks on DIN by its name.
- **The synths' parameters go out over USB only:** "automated MIDI template controls will send data to the MIDI Out DIN port as well as the USB port, unlike parameters on the other tracks, which are only sent to the USB port" ([S1] p. 57; [S2]). **A** Over DIN, then, the synth macros, the mixer and the FX sends would not arrive; notes, clock and the MIDI tracks' CCs would.
- **SysEx replies go to USB only,** even when the request came by DIN ([S3] p. 13). **A**

## Channels: what each track sends and receives on

- **Factory defaults:** Synth 1 channel 1, Synth 2 channel 2, MIDI 1 channel 3, MIDI 2 channel 4, Drums 1–4 channel 10 ([S1] p. 103; [S2] appendix). **A**
- **Settable** in Setup View (Shift + Save): each of Synth 1, Synth 2, MIDI 1, MIDI 2 and the drums to any channel 1–15; "Channel 16 is reserved for the Project"; the four drum tracks share one channel; "No two tracks can transmit on the same MIDI channel" ([S1] p. 103). **A**
- **The Project's channel 16** carries the mixer, the FX sends, the Master Filter and Project selection ([S3] pp. 10, 12). **A** (as received; see below for sent)
- **A page can read the channels:** Components sends `F0 00 20 29 01 64 49 F7` and reads, from a reply whose seventh byte is 9, the channels of Synth 1, Synth 2, MIDI 1, MIDI 2 and the drums (0-based) and the current Pack ([S9]). **B**: undocumented; it needs SysEx access.

## What the knobs send

### On a synth track (Synth 1 on channel 1, Synth 2 on channel 2)

- **Macros 1–8 are CC 80–87, "macro knob n position", range 0–127, default 0** ([S3] pp. 5–8; [S13] agrees). **A** for what it receives; **B** that turning a knob sends these same CCs: [S1] p. 57 says the synth tracks' parameters are sent (to USB), without naming the messages.
- **Absolute, not relative:** each is a position 0–127 that the device keeps; the encoder is endless, but the value it holds and (by [S3]) sends is a position. **B**
- **Each Patch stores its macros' positions and up to four destinations each** (NRPN 3:0–3:127, and bytes 204–339 of a patch) ([S3] pp. 5–8, 20–22; [S1] p. 34). **A** So a Patch change on the device moves every macro's value at once. Whether it then sends the new positions: **U**.
- **How far a turn moves the value** (steps per revolution, any acceleration): **U**.
- **The synth's other parameters** (filter frequency CC 74, resonance CC 71, the envelopes CC 73/75/70/72, oscillators, mixer, effects) have CCs or NRPNs on the synth's channel ([S3] pp. 3–5). **A** for receiving. The knobs reach them only through a Patch's macro destinations, so a knob does not send them by itself: **B**.

### On a MIDI track (MIDI 1 on channel 3, MIDI 2 on channel 4)

- **The eight knobs send the selected MIDI template's CCs,** on the track's channel, "depending on the selected MIDI template"; the default template sends CC 1, 2, 5, 11, 12, 13, 71, 74 on knobs 1–8; all eight factory templates are the same ([S1] pp. 57–58). **A**
- **Each knob's range is set in Components** (the value fully anticlockwise and fully clockwise); its polarity changes only its LED ([S1] p. 58). **A**
- **A template knob can also have its own channel** rather than the track's, and sends a CC only (no NRPN, no Program Change) ([S9]: each control has a channel, "-1" meaning the track's, a CC number, a top and a bottom value, a bipolar flag; its one control type is a CC). **B**
- **Eight templates on the device,** any one per MIDI track, chosen with Preset on that track ([S1] p. 57). **A** Whether choosing a template sends anything: **U**.
- **A MIDI track makes no sound of its own;** its knobs also set the levels, pans and FX sends of the two audio inputs in Mixer and FX Views ([S1] p. 57). **A**
- **Its CCs go to USB and to DIN Out** ([S1] p. 57). **A**

### On a drum track (channel 10)

- Only the even knobs work: 2 Pitch, 4 Decay, 6 Distortion, 8 EQ ([S1] p. 63). **A**
- Their CCs, per drum: Drum 1 pitch 14, decay 15, distortion 16, EQ 17; Drum 2 34, 40, 42, 43; Drum 3 46, 47, 48, 49; Drum 4 55, 57, 61, 76; and per drum a level, a pan and a sample select (CC 8, 18, 44, 50, 0–63) ([S3] p. 11). **A** for receiving; **B** for sending.

### In Mixer View and FX View

- **Synth levels** CC 12 (Synth 1) and 14 (Synth 2), **pans** CC 117 and 118, on channel 16; **drum levels** CC 12, 23, 45, 53 and pans 77–80 on channel 10 ([S3] pp. 11–12). **A** received, **B** sent.
- **Reverb sends** CC 88, 89 (synths), 90, 106, 109, 110 (drums); **delay sends** CC 111–116; all on channel 16 ([S3] p. 12). **A** received, **B** sent.
- **The audio inputs' level, sends and pan** (CC 13, 15, 31–36) are listed with no channel ([S3] p. 9); their numbers overlap the synth's CCs, so presumably channel 16. **U** for the channel.

### The Master Filter

- **Channel 16, CC 74:** "0-63=Low Pass, 64=OFF, 65-127=High Pass"; **resonance CC 71** (default 30) ([S3] p. 12). **A** for receiving. Whether turning the knob sends CC 74: **U**. For the original Circuit, Novation says the filter knob "is global" and cannot be recorded ([Help Centre](https://support.novationmusic.com/hc/en-gb/articles/207556365-I-can-t-record-Circuit-s-filter-knob-in-my-track)). **A**, for the original Circuit only.

## The pads, the Patches and Program Change

- **Synth pads send notes** on the synth's channel, from Note View and from the sequencer; MIDI tracks' pads likewise on theirs ([S1] p. 57; Setup View's Note Tx, p. 104). **A** The pads play only the notes of the chosen Scale (16 scales, a root note); Chromatic gives every note; Expanded Note View shows four rows ([S1] pp. 30–38). **A**
- **Drums are notes 60, 62, 64, 65** (Drums 1–4) on channel 10 ([S3] p. 11). **A** received; **B** sent.
- **The pads are velocity-sensitive,** with a Fixed velocity option (Shift + Velocity) ([S1] p. 11). **A**
- **Patches by Program Change:** channel 1 PGM 0–63 selects Synth 1's patch, channel 2 Synth 2's ([S3] p. 10; [S1] p. 34). **A** But the device has 128 Patches per synth, "four pages of 32" ([S1] pp. 12, 33), and the table is the original Circuit's, which had 64 ([S10]). How Patches 65–128 are reached by MIDI, and whether Bank Select is read: **U**.
- **Whether choosing a Patch on the device sends a Program Change:** **U**. Setup View has a "Program Change Tx" switch ([S1] p. 104), so something is sent; the one thing documented is the Project's.
- **Projects by Program Change on channel 16:** 0–63 change Project at once, 64–127 queue the change ([S3] p. 10). Since firmware 1.2.1 the Circuit Tracks also *sends* these when its own Project is changed, queued or instant ([S5]). **A**
- **Scenes, Patterns and pattern chains** have no MIDI message in [S3]; Scenes are 16 pads in Mixer View, queued to the end of Drum 1's pattern ([S1] pp. 81–84). **A** for the absence in the documents; **U** whether anything is sent.

## Clock and transport

- **Messages supported:** Start, Stop, Continue, Timing Clock; Song Position Pointer and Song Select ([S3] p. 10). **A** that they are supported; the table does not say which way.
- **Setup View switches** Note, CC, Program Change and Clock, each Rx and Tx on its own; all on by default ([S1] p. 104; [S2] appendix). **A**
- **Clock Tx on:** "Circuit Tracks is the clock master and its clock – whatever the source – will be available as MIDI Clock at the rear panel USB and MIDI Out connectors" ([S1] p. 105). **A**
- **Start and Stop are sent with Play:** with one Circuit leading another, "press Play on the leader device and see the follower begin to play as well" ([S5]). **B** (it shows a Start reaches the follower, without naming the message).
- **Continue and Song Position sent:** **U**. On the device, Shift + Play resumes from the stopped step ([S1] p. 38). **A**
- **Whether the clock runs while stopped:** **U**. (It matters for [136](../issues/136-following-midi-clock.md)'s "when the clock stops".)
- **Clock Rx on (AUTO):** a valid clock at MIDI In or USB sets the tempo; without one the internal clock runs; it follows 30–300 BPM, fractions included; if the clock goes away "Circuit Tracks will stop playing" ([S1] pp. 85–86, 105). **A**
- **Internal tempo:** 40–240 BPM, whole numbers only, default 120; set with Macro 1 in Tempo View, or Tap Tempo (Shift + Tempo) ([S1] pp. 85–86). **A** No CC carries the tempo; only the clock's rate does ([S3], an absence). **A**
- **Analogue Sync Out:** 1, 2, 4, 8 or 24 pulses a quarter note, default 2 ([S1] p. 105). **A** (not MIDI)

## What it can receive back

- **Macro positions,** CC 80–87 on a synth's channel ([S3] pp. 5–8). **A** A received position presumably moves the knob's value, and so its LED and the synth's sound. **B**
- **Every synth parameter's CC or NRPN** on the synth's channel, the drums' on channel 10, the Project's on 16 ([S3] pp. 3–12). **A**
- **Notes** on a synth's channel play that synth; on channel 10, notes 60/62/64/65 play the drums ([S1] p. 38; [S3] p. 11). **A** Whether received notes light the pads: **U**.
- **Program Change** (Patches, Projects), above. **A**
- **SysEx:** replace the current patch, replace a stored patch, dump the current patch; Novation's ID `00 20 29`, product type 1, product number 100 (`64` hex); at least 20 ms between messages ([S3] pp. 13–14). **A**
- **No message for lighting a pad, an LED or the display** as a host would want: none in [S3]. **A** for the absence. The macro LEDs follow the value, so moving a value is the only way to light them. **B**
- **It also reports which synth is shown:** Components listens for `F0 00 20 29 01 64 04 03 0p …`, p = 0 for Synth 1 and 1 for Synth 2, a "layout change" ([S9]). **B**: undocumented, SysEx.

## What Novation Components changes for MIDI

- **MIDI templates** for the MIDI tracks: each knob's CC, range and polarity ([S1] p. 58; [S6]), and its channel ([S9], **B**); up to 8 on the device; sent as a `.syx` file ([S6], [S9]). **A**
- **Synth patches:** in the Synth Editor's Modulation tab, each macro's up-to-four destinations and their ranges; "On factory patches, these tend to follow a pattern so that the controls match the labelling on the hardware, but you can set up any control on any macro" ([S6]). **A** Editing a patch live needs "MIDI CC In/Out" on ([S6]). **A**
- **Firmware updates, Packs, Projects, samples** ([S1] p. 101; [S7]). **A**
- **Not in Components:** the MIDI channels and the Rx/Tx switches, set on the device in Setup View ([S1] pp. 102–105). Components reads the channels ([S9]) but no Components page sets them. **B**
- **Components runs in Chrome over Web MIDI;** its firmware update asks the browser for MIDI access ([S1] p. 101; [S7]). **A**

## For a web page using Web MIDI in Chrome

- **No SysEx is needed** for notes, CCs, Program Change and the clock: without SysEx access, Web MIDI discards incoming SysEx and refuses to send it ([S11]). **A** SysEx is needed only to read the channels, the selected synth or patches ([S3], [S9]).
- **On a Mac,** no driver; the device also shows as a USB drive (the Easy Start tool) unless that is switched off in Advanced Setup View ([S1] pp. 8, 106). **A**
- **Recognise the device by a name containing "Circuit Tracks", and not its bootloader** (a name with "Boot") ([S9]). **B**
- **Components and Limpide open at once:** on a Mac, CoreMIDI lets several apps share a port: **C** (general knowledge, not checked with this device). On Windows, the class driver is single-client: **C**.
- **Over USB the Circuit Tracks is also powered and charged** from the computer ([S1] p. 9). **A**

## Not sourced

Facts this pass could not source (**U**), each checkable on the owner's device with a MIDI monitor:

1. How many USB MIDI ports it shows, and their exact names in Chrome on a Mac (the community says "Circuit Tracks MIDI", **C**).
2. Whether a Patch change on the device sends the macros' new positions.
3. How far a turn of a macro moves its value (messages per revolution, acceleration).
4. Which channel the audio inputs' CCs (13, 15, 31–36) are on.
5. Whether the Master Filter knob sends CC 74 on channel 16.
6. Whether choosing a Patch sends a Program Change; how Patches 65–128 are reached by MIDI; whether Bank Select is read.
7. Whether choosing a MIDI template, a Scene, a Pattern or a track sends anything (other than the SysEx of [S9]).
8. Whether any button sends MIDI.
9. Whether Continue and Song Position Pointer are sent.
10. Whether the clock is sent while the sequencer is stopped.
11. Whether received notes light the pads.

The many **B**s on what is *sent* rest on one sentence ([S1] p. 57: the synth tracks' parameters "are only sent to the USB port") and on [S3]'s tables, which say what the device responds to: one session with a MIDI monitor and the device would turn most of them into **A**s.

---

## Design facts for the grilling

What the device makes easy or hard for a layout like the C16's. None of this decides anything.

- **Eight knobs, no faders, no MIDI buttons.** The C16 offered 24 controls a bank (8 knobs, 4 faders, 12 buttons); the Circuit Tracks offers 8 knobs a track and the pads. Limpide's Actions (the Preset arrows, Freeze, Hold, Snapshot) and its switches have no button to sit on; the pads send notes, which play Limpide.
- **Four tracks could stand for four Sections.** Synth 1, Synth 2, MIDI 1 and MIDI 2 each have eight knobs and their own channel (1, 2, 3, 4 by default), so the channel of a CC says which track sent it: 32 knob places, one track per Section, as the C16's four banks are. The player chooses a track with its button; the choice itself sends nothing documented (only the synth choice, by SysEx).
- **The two kinds of track behave differently.** A synth track's knobs send fixed CCs (80–87), absolute positions stored in the device's own Patch, and turning them also changes the Circuit Tracks' own synth sound (unless muted or its level is down). A MIDI track's knobs make no sound of their own, send whatever CCs a Components template says (any CC, range and channel), reach DIN as well as USB, and Limpide could offer that template as a `.syx` file, as the C16 has its card.
- **Absolute knobs mean Pickup or a jump.** Whichever track, the knobs send positions 0–127, not the C16's Relative steps: after a Preset change in Limpide the knob and the control disagree. Limpide could answer with Pickup, with a jump, or by sending the positions back (CC 80–87 on a synth track moves the knob's value and LED, and the device's sound with it; a MIDI track's template values cannot be sent back).
- **The panel already speaks a synth's language.** The legends, in four zig-zag pairs (1 Oscillator, 2 Oscillator Mod; 3 Amp Envelope, 4 Filter Envelope; 5 Filter Frequency, 6 Resonance; 7 Modulation, 8 FX), are close to Limpide's Sections. A layout that follows them on one track would let a player read the panel; one that gives each track to a Section would not match the legends on the other three.
- **Scenes and pages do not reach MIDI.** The device's Scenes, Patterns and Patch pages send no documented message, so they cannot stand for Sections; the tracks (by channel) can. Projects send Program Change on channel 16 (since firmware 1.2.1).
- **The Master Filter** is a centre-detent low-pass/high-pass DJ filter on the whole mix (channel 16, CC 74, 64 = off), bipolar, not a Cutoff knob; whether it sends at all is unknown.
- **The clock leads by default.** Clock Tx is on from the factory, at USB and DIN; Play sends a Start. With [136](../issues/136-following-midi-clock.md), a Circuit Tracks plugged in would set Limpide's tempo whenever it plays, and could start and stop Limpide's Song or Demo if the grilling wants it to.
- **Recognised over USB only.** Its name contains "Circuit Tracks"; through a DIN interface the name is the interface's, and the synth tracks' CCs do not reach DIN at all.
- **Beside a C16.** Both send on channel 1 by default (the C16 always, the Circuit Tracks' Synth 1), and the C16's bank D buttons use CC 85–96, overlapping the synth macros' CC 80–87. ADR-0017's rule (a built-in layout answers its own input alone) keeps them apart, as it does a keyboard's mod wheel today.
- **The sequencer can play Limpide.** A MIDI track's notes and its knobs' automation (recorded per step) go out on its channel, so a Circuit Tracks pattern could play and move Limpide's controls without a hand on it.
