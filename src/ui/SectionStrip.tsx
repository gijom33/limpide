import { useEffect, useRef, useState } from 'react';

/** The four sections, top to bottom on a phone: the strip's short word, and the section's own name. */
const SECTIONS = [
  { short: 'Osc', name: 'Oscillators' },
  { short: 'Filter', name: 'Filter' },
  { short: 'Amp', name: 'Amp' },
  { short: 'LFO & Env', name: 'LFO & Envelopes' },
] as const;

/** The gap left between the strip and a section it jumps to. */
const LANDING_GAP = 8;
/** Near the top of the page the header keeps its first row whichever way the page scrolls. */
const TOP = 80;
/** Scrolls smaller than this (a resting thumb, a bounce) do not change the header. */
const JITTER = 4;
/** A jump has ended once the page has not scrolled for this long. */
const STILL_MS = 150;

/** The header's first row (logo, Patch, Display) hidden or shown (CSS acts on it on phones only). */
const collapseHeader = (collapsed: boolean) => document.documentElement.toggleAttribute('data-header-collapsed', collapsed);

const section = (name: string) => document.querySelector<HTMLElement>(`section[aria-label="${name}"]`);

/**
 * Phones only (CSS hides it elsewhere, where every section is on screen at once): a strip of the sections, sticky
 * under the header. It shows which section is in view (the one a third of the way down what the header and strip
 * leave visible) and jumps to a section when tapped, landing its top just under the strip.
 */
export function SectionStrip() {
  const [current, setCurrent] = useState<string>(SECTIONS[0].name);
  // While a tapped jump scrolls, the header keeps the state the jump gave it: showing or hiding its first row changes
  // the page's height, which moves the scroll in Safari, which would read as the other direction and interrupt it.
  const jumping = useRef(false);

  // The header's height, so the strip sits right under it (the header is sticky too, and changes height).
  useEffect(() => {
    const header = document.querySelector('header')!;
    const set = () => document.documentElement.style.setProperty('--header-h', `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(set);
    observer.observe(header);
    set();
    return () => observer.disconnect();
  }, []);

  // Scrolling down the page hides the header's first row, so the piano and the strip take less of a small screen;
  // any scroll back up brings it back.
  useEffect(() => {
    let last = scrollY;
    let still: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (jumping.current) {
        clearTimeout(still);
        still = setTimeout(() => {
          jumping.current = false;
          last = scrollY;
        }, STILL_MS);
        return;
      }
      if (Math.abs(scrollY - last) < JITTER) return;
      collapseHeader(scrollY > last && scrollY > TOP);
      last = scrollY;
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      clearTimeout(still);
      collapseHeader(false);
    };
  }, []);

  useEffect(() => {
    const spy = () => {
      const strip = document.querySelector('.section-strip')!.getBoundingClientRect();
      if (!strip.height) return; // hidden: not a phone
      const line = strip.bottom + (innerHeight - strip.bottom) / 3;
      let found: string = SECTIONS[0].name;
      for (const s of SECTIONS) if ((section(s.name)?.getBoundingClientRect().top ?? Infinity) <= line) found = s.name;
      // At the very end of the page the last section is the one in view, however short it is.
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) found = SECTIONS[SECTIONS.length - 1].name;
      setCurrent(found);
    };
    addEventListener('scroll', spy, { passive: true });
    addEventListener('resize', spy);
    spy();
    return () => {
      removeEventListener('scroll', spy);
      removeEventListener('resize', spy);
    };
  }, []);

  const jump = (name: string) => {
    const target = section(name);
    if (!target) return;
    // Going down hides the header's first row and going up brings it back: settle that first, so the header is
    // measured at the height it will have when the page stops.
    collapseHeader(target.getBoundingClientRect().top > 0 && scrollY + target.getBoundingClientRect().top > TOP);
    // Where the strip's bottom will be once stuck under the header (overlapping its border by a pixel), not where it
    // is now (at the top of the page it is not stuck yet).
    const header = document.querySelector('header')!.getBoundingClientRect().height;
    const strip = document.querySelector('.section-strip')!.getBoundingClientRect().height;
    const top = target.getBoundingClientRect().top + scrollY - (header - 1 + strip) - LANDING_GAP;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    jumping.current = true;
    scrollTo({ top: Math.max(0, top), behavior: still ? 'auto' : 'smooth' });
    setCurrent(name);
  };

  return (
    <nav className="section-strip" aria-label="Sections">
      {SECTIONS.map((s) => (
        <button key={s.name} type="button" aria-label={s.name} aria-current={current === s.name || undefined} data-section={s.name} onClick={() => jump(s.name)}>
          {s.short}
        </button>
      ))}
    </nav>
  );
}
