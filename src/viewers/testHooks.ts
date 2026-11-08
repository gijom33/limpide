// The Viewers' test hooks (issue 257): what a Scope or Spectrum drew, as `data-*` attributes on its canvas, which the
// end-to-end tests read (no stylesheet uses them). A draw hands them back; the render loop's write phase writes them.
import { writeChanged } from './renderLoop';

/** A frame's test hooks, by dataset key: undefined takes the hook away. */
export type TestHooks = Record<string, string | undefined>;

/** Writes a frame's test `hooks` (none for a frame at rest) to a canvas's dataset: only those that changed. */
export function writeTestHooks(dataset: DOMStringMap, hooks: TestHooks | undefined) {
  if (!hooks) return;
  writeChanged(dataset, hooks, (key, value) => {
    if (value === undefined) delete dataset[key];
    else dataset[key] = value;
  });
}
