import { useLayoutEffect, useRef } from 'react';
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

/** Shows each `Forms` in an element at a step of shortening: its form there, or its shortest. */
function showStep(el: HTMLElement, step: number) {
  const groups = new Set([...el.querySelectorAll('[data-form]')].map((form) => form.parentElement!));
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
