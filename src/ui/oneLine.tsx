import { type ReactNode, useLayoutEffect, useRef } from 'react';
import { screenForms } from './shortForms';

/**
 * Whether all of an element's text sits on one line, inside its box: no second line, and none of it running past its
 * edges (a word kept from wrapping, `white-space: nowrap`, runs past them instead).
 */
export function onOneLine(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  const [left, right] = [box.left + parseFloat(style.paddingLeft), box.right - parseFloat(style.paddingRight)];
  const tolerance = parseFloat(style.fontSize) / 2;
  const tops: number[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (!r.width) continue;
      if (r.left < left - 0.5 || r.right > right + 0.5) return false;
      if (!tops.some((top) => Math.abs(top - r.top) < tolerance)) tops.push(r.top);
    }
  }
  return tops.length <= 1;
}

/**
 * A name's forms on screen (`screenForms`), one element each, the longest shown until `useOneLine` measures the room.
 * The name itself is what a screen reader hears: the label carries it (an `aria-label`, or a group's name).
 */
export function Forms({ name }: { name: string }) {
  return screenForms(name).map((form, i) => (
    <span key={form} data-form={i} hidden={i > 0}>
      {form}
    </span>
  ));
}

/** Shows each `Forms` in an element (those `within` a selector, if given) at a step of shortening: its form there, or its shortest. */
function showStep(el: HTMLElement, step: number, within = '') {
  const groups = new Set([...el.querySelectorAll(`${within} [data-form]`)].map((form) => form.parentElement!));
  for (const group of groups) {
    const forms = [...group.children].filter((c): c is HTMLElement => c instanceof HTMLElement && 'form' in c.dataset);
    forms.forEach((form, i) => {
      form.hidden = i !== Math.min(step, forms.length - 1);
    });
  }
}

/**
 * "One line, shorter words" (the design principles, issue 156): the element's labels (`Forms`) take the longest forms
 * that keep all its text on one line in the room it has, measured, so it holds in any font; at worst their shortest.
 * Measured again whenever its room changes, the fonts arrive, or what it holds changes (`holds`, its names in a word). Its `data-step` says
 * which step it took, 0 for the longest; `data-shortest` marks the last, where its styles may tighten too.
 */
export function useOneLine<T extends HTMLElement>(holds: string) {
  const ref = useRef<T>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `holds` says what the element holds, which it measures
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const steps = Math.max(1, ...[...el.querySelectorAll('[data-form]')].map((f) => Number((f as HTMLElement).dataset.form) + 1));
    const shorten = () => {
      for (let step = 0; step < steps; step++) {
        el.dataset.step = String(step);
        el.toggleAttribute('data-shortest', step === steps - 1); // its styles may tighten there too
        showStep(el, step);
        if (onOneLine(el)) break;
      }
    };
    shorten();
    let live = true;
    document.fonts?.ready.then(() => live && shorten());
    const observer = new ResizeObserver(shorten);
    observer.observe(el);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [holds]);
  return ref;
}

/** The knobs' and faders' names in a row, the step they shorten together. */
const ROW_NAMES = '.knob-label';

/**
 * Whether a row's controls sit on one line, their names inside it: every name's top the same (a control wrapped to a
 * second line sits lower), none running past the row's edges (a row kept from wrapping runs past them instead).
 */
function rowOnOneLine(row: HTMLElement): boolean {
  const box = row.getBoundingClientRect();
  const names = [...row.querySelectorAll<HTMLElement>(ROW_NAMES)].map((n) => n.getBoundingClientRect()).filter((r) => r.width);
  const tops = names.map((r) => r.top);
  if (!tops.length) return true;
  return Math.max(...tops) - Math.min(...tops) < 2 && names.every((r) => r.left >= box.left - 0.5 && r.right <= box.right + 0.5);
}

/**
 * A row of knobs and faders whose names take shorter forms where the row runs short (issue 223): a knob's column is as
 * wide as its name, so a name runs short when its row would wrap a control to a second line, as a wider font (Linux's,
 * a larger text setting) can make it. Every name in the row steps down together, as the Timeline's key does, the
 * longest forms that keep the row on one line; at worst their shortest. Measured again as the row's size, its
 * controls or the fonts change.
 */
export function KnobRow({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    const shorten = () => {
      const steps = Math.max(1, ...[...row.querySelectorAll(`${ROW_NAMES} [data-form]`)].map((f) => Number((f as HTMLElement).dataset.form) + 1));
      for (let step = 0; step < steps; step++) {
        showStep(row, step, ROW_NAMES);
        if (rowOnOneLine(row)) break;
      }
    };
    shorten();
    let live = true;
    document.fonts?.ready.then(() => live && shorten());
    const sized = new ResizeObserver(shorten);
    sized.observe(row);
    const changed = new MutationObserver(shorten);
    changed.observe(row, { childList: true });
    return () => {
      live = false;
      sized.disconnect();
      changed.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className={className ? `knobs ${className}` : 'knobs'}>
      {children}
    </div>
  );
}
