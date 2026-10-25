# 31: LFO retrigger

**What to build:** Each LFO can optionally restart its cycle at every Note (key sync), so a Note always starts at the same point of the wobble. Off by default, so Patches and links sound as before; saved in the Patch. The LFO plot, the modulation rings and the piano's pitch dot follow the restarted cycle. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] Patch: a retrigger switch per LFO, off by default, in saved Patches and Share links
- [ ] Modulation model: the LFO's phase restarts at each Note-on when the switch is on (tested)
- [ ] Sound: the engine restarts the LFO at each Note-on, in time with the model
- [ ] UI: a switch beside each LFO's shapes, with a tooltip; the plot shows the restart
