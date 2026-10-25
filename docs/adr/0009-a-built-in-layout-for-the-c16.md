# A built-in layout for the C16, beside MIDI Learn

Supersedes ADR-0004's "Limpide ships no hard-coded CC table" for the TempoPAD C16 alone. ADR-0004 chose MIDI Learn first because the C16's factory assignments were unknown and its Encoder Mode could vary. The owner has since read them off the device (2026-10-25): channel 1; each of its 4 banks has its own CCs (knobs from 1, faders from 33, buttons from 49, one bank after another); its buttons are toggles. Trying Quick Setup on the real C16 also showed that walking through every control is slow and error-prone, so the owner asked for the C16 to work the moment it is plugged in.

So Limpide ships one layout, for the C16: each bank plays one section (A the Oscillators, B the Filter, C the Amp, D the LFOs), and its first buttons are the Actions on every bank (`src/midi/c16.ts`). It is applied by itself once, the first time a C16 is seen with nothing mapped, and the MIDI panel puts it back on request. Everything else in ADR-0004 stands: every other Controller is mapped by MIDI Learn or Quick Setup, any control can be relearned, and Pickup applies to Absolute Mappings. The one fact still unknown, the knobs' Relative format, is not assumed: each knob finds its Encoder Mode on its first turn.

The cost: the layout assumes factory settings. A C16 reassigned on the device needs MIDI Learn, as any other Controller does.
