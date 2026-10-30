# 31: LFO retrigger

**What to build:** Each LFO can optionally restart its cycle at every Note (key sync), so a Note always starts at the same point of the wobble. Off by default, so Patches and links sound as before; saved in the Patch. The LFO plot, the modulation rings and the piano's pitch dot follow the restarted cycle. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** done. Each LFO's oscillator feeds a bus, so a retriggering Note swaps in a new oscillator that starts its cycle there; the model's clock takes a restart mark at the same moment (and accepts marks out of order, for Notes handed over ahead). A chord's Notes restart it once. On compact laptop windows the LFO plots are narrower, so the two LFOs still sit side by side.

**Since then:** a retriggered LFO starts each Waveform where it classically starts (a Saw at its foot, a Saw Down at its top), no longer at the browser oscillator's phase 0, the middle of a saw's ramp ([124](./124-where-a-retriggered-lfo-starts.md), 2026-10-30).

- [x] Patch: a retrigger switch per LFO, off by default, in saved Patches and Share links
- [x] Modulation model: the LFO's phase restarts at each Note-on when the switch is on (tested)
- [x] Sound: the engine restarts the LFO at each Note-on, in time with the model
- [x] UI: a switch beside each LFO's shapes, with a tooltip; the plot shows the restart
