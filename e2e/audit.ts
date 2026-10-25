/**
 * The design principles' measurable rules (docs/design-principles.md), checked on the page as drawn: text contrast,
 * the contrast of what draws a control (its border or fill, a knob's groove and arc, a fader's track and fill), and
 * the size of what a pointer can hit. Runs inside the page (Playwright's evaluate), so it is one self-contained
 * function.
 */
export type Rule = 'text' | 'boundary' | 'target';

export interface Finding {
  rule: Rule;
  /** Where it is and its name or text, e.g. `div.keyboard > button.tool "Octave down"`. */
  what: string;
  /** What was measured: a contrast ratio or a size. */
  measured: string;
}

export interface AuditOptions {
  rules: Rule[];
  /** The smallest target a pointer may have to hit, in CSS px. */
  minTarget: number;
  /** Today's known failures: a finding on an element matching one of these is expected, not reported. */
  known: { rule: Rule; selector: string }[];
}

/** The findings no known failure accounts for, and the known failures that matched something. */
export interface AuditResult {
  unexpected: Finding[];
  matched: string[];
}

export function auditPage({ rules, minTarget, known }: AuditOptions): AuditResult {
  // Any CSS colour, as sRGB 0–255 and alpha 0–1, by painting it.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const paint = canvas.getContext('2d', { willReadFrequently: true })!;
  type RGBA = [number, number, number, number];
  const parse = (css: string): RGBA => {
    paint.clearRect(0, 0, 1, 1);
    paint.fillStyle = '#000';
    paint.fillStyle = css;
    paint.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = paint.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const over = (top: RGBA, under: RGBA, alpha = top[3]): RGBA => [
    top[0] * alpha + under[0] * (1 - alpha),
    top[1] * alpha + under[1] * (1 - alpha),
    top[2] * alpha + under[2] * (1 - alpha),
    1,
  ];
  const luminance = ([r, g, b]: RGBA) => {
    const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const contrast = (a: RGBA, b: RGBA) => {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  /** What is painted behind an element: every background from the page down to its parent, one over the other. */
  const backdrop = (el: Element): RGBA => {
    const chain: Element[] = [];
    for (let e = el.parentElement; e; e = e.parentElement) chain.unshift(e);
    let colour: RGBA = [255, 255, 255, 1];
    for (const e of chain) {
      const bg = parse(getComputedStyle(e).backgroundColor);
      if (bg[3] > 0) colour = over(bg, colour);
    }
    return colour;
  };
  /** Its own opacity and its ancestors', multiplied. */
  const opacity = (el: Element) => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  };
  const shown = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && el.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  };
  // Inactive controls are greyed out on purpose (WCAG 1.4.11 and 1.4.3 leave them out).
  const inactive = (el: Element) => !!el.closest('[data-inactive], [aria-disabled="true"], :disabled');
  const kind = (el: Element) => {
    const role = el.getAttribute('role');
    const cls = [...el.classList].filter((c) => !c.startsWith('has-'))[0];
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${role ? `[role=${role}]` : ''}`;
  };
  const where = (el: Element) => {
    const parent = el.parentElement?.closest('[class]');
    return parent ? `${kind(parent)} > ${kind(el)}` : kind(el);
  };
  const name = (el: Element) =>
    (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
  const unexpected: Finding[] = [];
  const matched = new Set<string>();
  const fail = (rule: Rule, el: Element, measured: string) => {
    const excused = known.filter((k) => k.rule === rule && el.matches(k.selector));
    for (const k of excused) matched.add(`${k.rule} ${k.selector}`);
    const what = `${where(el)} "${name(el)}"`;
    if (!excused.length && !unexpected.some((f) => f.rule === rule && f.what === what)) unexpected.push({ rule, what, measured });
  };
  const scope = [...document.querySelectorAll('header, main, .section-strip, dialog[open]')];
  const all = scope.flatMap((s) => [s, ...s.querySelectorAll('*')]);

  // Text: 4.5:1, or 3:1 when large (24 px, or 18.66 px bold).
  for (const el of rules.includes('text') ? all : []) {
    if (el.closest('svg, canvas') || inactive(el) || !shown(el)) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (!own) continue;
    const style = getComputedStyle(el);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
    const behind = parse(style.backgroundColor)[3] > 0 ? over(parse(style.backgroundColor), backdrop(el)) : backdrop(el);
    const ink = parse(style.color);
    const ratio = contrast(over(ink, behind, ink[3] * opacity(el)), behind);
    if (ratio < (large ? 3 : 4.5)) fail('text', el, `${ratio.toFixed(2)}:1`);
  }

  // What draws a control: 3:1 against what is behind it.
  const drawn = (el: Element, paints: string[]) => {
    if (inactive(el) || !shown(el)) return;
    const behind = backdrop(el);
    const o = opacity(el);
    for (const css of paints) {
      const c = parse(css);
      if (c[3] === 0) continue;
      const ratio = contrast(over(c, behind, c[3] * o), behind);
      if (ratio < 3) fail('boundary', el, `${ratio.toFixed(2)}:1`);
    }
  };
  const boundaries = rules.includes('boundary') ? all : [];
  const controls = boundaries.filter((el) => el.matches('button, input, select, [role="radio"], [role="tab"], [role="menuitemradio"]'));
  for (const el of controls) {
    if (el.closest('.piano')) continue; // keys are ivory and black, as on a piano: their edges are each other
    const style = getComputedStyle(el);
    const border = parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none' ? style.borderTopColor : 'transparent';
    // A control is drawn by its border or its fill: the stronger of the two must stand out.
    if (!inactive(el) && shown(el)) {
      const behind = backdrop(el);
      const o = opacity(el);
      const [b, f] = [parse(border), parse(style.backgroundColor)];
      if (b[3] === 0 && f[3] === 0) continue; // drawn by its text alone
      const ratio = Math.max(contrast(over(b, behind, b[3] * o), behind), contrast(over(f, behind, f[3] * o), behind));
      if (ratio < 3) fail('boundary', el, `${ratio.toFixed(2)}:1`);
    }
  }
  for (const el of boundaries.filter((e) => e.matches('.knob-groove, .knob-arc, .knob-ring'))) drawn(el, [getComputedStyle(el).stroke]);
  for (const el of boundaries.filter((e) => e.matches('.fader'))) drawn(el, [getComputedStyle(el, '::before').backgroundColor]);
  for (const el of boundaries.filter((e) => e.matches('.fader-fill'))) drawn(el, [getComputedStyle(el).backgroundColor]);

  // Targets: what a pointer can hit, extended by an absolutely placed ::before or ::after (a finger-sized pad).
  const targets = (rules.includes('target') ? all : []).filter((el) => el.matches('button, input, select, a[href], [role="slider"], [role="radio"], [role="tab"], [role="menuitemradio"]'));
  for (const el of targets) {
    if (!shown(el) || el.closest('p, dd, li') && el.matches('a')) continue; // a link inside a sentence is exempt
    const r = el.getBoundingClientRect();
    let [w, h] = [r.width, r.height];
    for (const pseudo of ['::before', '::after']) {
      const s = getComputedStyle(el, pseudo);
      if (s.content === 'none' || s.position !== 'absolute') continue;
      const inset = (side: string) => Math.max(0, -parseFloat(s.getPropertyValue(side)) || 0);
      w = Math.max(w, r.width + inset('left') + inset('right'));
      h = Math.max(h, r.height + inset('top') + inset('bottom'));
    }
    if (w < minTarget - 0.5 || h < minTarget - 0.5) fail('target', el, `${Math.round(w)}×${Math.round(h)}`);
  }
  return { unexpected, matched: [...matched] };
}
