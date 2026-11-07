/**
 * The controls Safari's Tab passes over unless its settings ask for them ("Press Tab to highlight each item"), as
 * Firefox on a Mac does under the system's own setting: buttons and links. One with a tabindex of its own is reached
 * either way; a roving one (a radio, a piano key, a menu's item) keeps the one it has.
 */
const PASSED_OVER = 'button:not([tabindex]), a[href]:not([tabindex])';

function makeReachable(element: Element) {
  if (element.matches(PASSED_OVER)) element.setAttribute('tabindex', '0');
  for (const control of element.querySelectorAll(PASSED_OVER)) control.setAttribute('tabindex', '0');
}

/**
 * Gives every button and link under `root` a tabindex of 0, as it comes onto the page, so Tab reaches it whatever the
 * browser's settings (issue 253, WCAG 2.1.1): Patch, a Preset, Demo and About as well as the knobs. A tabindex of 0 is
 * where Tab goes in Chromium anyway, so its order there is the same.
 */
export function tabToButtons(root: Element) {
  makeReachable(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) makeReachable(node);
  });
  observer.observe(root, { childList: true, subtree: true });
}
