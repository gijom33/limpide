# 12: Patches and Presets

**What to build:** The current Patch autosaves. Users can save, name, load and delete Patches, and browse Presets (bass, lead, pluck, pad-ish, wobble) with next and previous. Patches export and import as JSON, and a share URL encodes the Patch. Patches from older versions load, with defaults for any missing Parameters.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] JSON and URL round-trips, tested
- [ ] Migration and validation (unknown fields dropped, missing fields defaulted, out-of-range values clamped), tested
- [ ] Patch library over the Persistence interface (in-memory in tests), tested
- [ ] Presets defined as data; next and previous wrap around
- [ ] Patch browser UI, import and export, and a copy-share-link control
