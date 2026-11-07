/**
 * The controls Safari's Tab passes over unless its settings ask for them ("Press Tab to highlight each item"), as
 * Firefox on a Mac does under the system's own setting: buttons and links. One with a tabindex of its own is reached
 * either way; a roving one (a radio, a piano key, a menu's item) keeps the one it has.
 */
const PASSED_OVER = 'button:not([tabindex]), a[href]:not([tabindex])';

function reachable(element: Element) {
  if (element.matches(PASSED_OVER)) element.setAttribute('tabindex', '0');
  for (const control of element.querySelectorAll(PASSED_OVER)) control.setAttribute('tabindex', '0');
}

/**
 * Gives every button and link under `root` a tabindex of 0, as it comes onto the page, so Tab reaches it with any
 * browser's settings (issue 253, WCAG 2.1.1): in Safari, as it comes, a keyboard reached the knobs but not Patch, a
 * Preset, Demo or About. A tabindex of 0 is where Tab already went in Chromium, so its order there stays the same, and
 * nothing looks or acts otherwise.
 */
export function tabToButtons(root: Element) {
  reachable(root);
  const added = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) reachable(node);
  });
  added.observe(root, { childList: true, subtree: true });
}
