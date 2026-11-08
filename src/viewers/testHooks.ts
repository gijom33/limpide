// The Viewers' test hooks (issue 257): what a Scope or Spectrum drew, as `data-*` attributes on its canvas, which the
// end-to-end tests read (no stylesheet uses them). A draw hands them back; the render loop's write phase writes them.

/** A frame's hooks, by dataset key: undefined takes the hook away. */
export type Hooks = Record<string, string | undefined>;

/**
 * Writes a frame's `hooks` (none for a frame at rest) to a canvas's dataset: only those that changed, so a steady
 * picture writes nothing, frame after frame.
 */
export function writeHooks(dataset: DOMStringMap, hooks: Hooks | undefined) {
  if (!hooks) return;
  for (const [key, value] of Object.entries(hooks)) {
    if (value === undefined) {
      if (key in dataset) delete dataset[key];
    } else if (dataset[key] !== value) dataset[key] = value;
  }
}
