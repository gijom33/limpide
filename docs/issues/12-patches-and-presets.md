# 12: Patches and Presets

**What to build:** The current Patch autosaves. Users can save, name, load and delete Patches, and browse Presets (bass, lead, pluck, pad-ish, wobble) with next and previous. Patches export and import as JSON, and a share URL encodes the Patch. Patches from older versions load, with defaults for any missing Parameters.

**Blocked by:** 01

**Status:** done

- [x] JSON and URL round-trips, tested
- [x] Migration and validation (unknown fields dropped, missing fields defaulted, out-of-range values clamped), tested
- [x] Patch library over the Persistence interface (in-memory in tests), tested
- [x] Presets defined as data; next and previous wrap around
- [x] Patch bar on the header line (‹ name ›, changed dot) with a panel: Presets (lessons in tooltips), My Patches (load, two-step delete), Save as, Export file, Import file, Copy share link (#p=…, cleared from the address once loaded)
- [x] Start-up: share link, else last session's autosave, else Init (tested)
