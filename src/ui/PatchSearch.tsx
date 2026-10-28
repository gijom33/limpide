import { type RefObject, useEffect, useState } from 'react';
import type { Patch } from '../patch/patch';
import { CATEGORIES, type Category, categoryLists, inCategory, isSearch, resultRows, searchPresets } from '../patch/presetSearch';
import type { Preset } from '../patch/presets';
import { TutorialIcon } from './icons';
import { radioGroupKeys, radioTabIndex } from './radioGroup';
import { Tooltip } from './Tooltip';

interface Props {
  /** The sound loaded, marked in the lists. */
  name: string;
  query: string;
  onQuery(query: string): void;
  category: Category;
  onCategory(category: Category): void;
  /** The search box, which the panel focuses when Escape clears the search. */
  searchBox: RefObject<HTMLInputElement | null>;
  /** The Presets that have a Tutorial, and whether it has been played to the end. */
  tutorials: readonly { preset: string; finished: boolean }[];
  /** My Patches as the panel lists them, the search and category applied: Enter loads the first when no Preset is found. */
  mine: readonly { name: string; patch: Patch }[];
  onLoad(name: string, patch: Patch): void;
  onTutorial(preset: string): void;
}

const TUTORIAL_TIP = { title: 'Tutorial', body: 'Build this sound step by step, from Init: turn each control yourself, and hear and see what it does.' };
/** How long typing pauses before the number found is said (issue 72): said at each key, it would talk over the typing. */
const ANNOUNCE_MS = 600;

/**
 * The Patch panel's Presets: the search box, the categories, and what they find (issue 69): the Tutorials, then the
 * Presets by group, or while searching, by name then by description. The panel keeps the search and the category, so
 * they stay until the page reloads.
 */
export function PatchSearch({ name, query, onQuery, category, onCategory, searchBox, tutorials, mine, onLoad, onTutorial }: Props) {
  const searching = isSearch(query);
  const all = searchPresets(query, 'All');
  // A Tutorial is found by its Preset's name, whatever category its Preset is in.
  const shownTutorials = categoryLists(category).tutorials ? tutorials.filter((t) => all.byName.some((p) => p.name === t.preset)) : [];
  const rows = resultRows(inCategory(all, category), searching);
  const count = shownTutorials.length + rows.reduce((n, row) => n + row.presets.length, 0) + mine.length;
  const nothing = searching && count === 0;

  // The number found, said to a screen reader once typing pauses (WCAG 4.1.3); nothing while no search is typed.
  const said = searching ? (nothing ? 'Nothing found' : `${count} found`) : '';
  const [announced, setAnnounced] = useState('');
  useEffect(() => {
    if (!said) return setAnnounced('');
    const timer = setTimeout(() => setAnnounced(said), ANNOUNCE_MS);
    return () => clearTimeout(timer);
  }, [said]);

  // The search box takes the focus on a computer, to type at once; not on a touch screen, whose keyboard would cover the list.
  // A search kept from before is selected, so typing starts a new one and Enter still loads its first.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on opening only; the ref is the panel's, the same each render
  useEffect(() => {
    if (!matchMedia('(pointer: coarse)').matches) searchBox.current?.select();
  }, []);

  /** Enter loads the first sound found, or plays the first Tutorial when they are what is listed. */
  const loadFirst = () => {
    const first = rows[0]?.presets[0] ?? mine[0];
    if (first) onLoad(first.name, first.patch);
    else if (shownTutorials[0]) onTutorial(shownTutorials[0].preset);
  };
  const clear = () => {
    onQuery('');
    searchBox.current?.focus();
  };
  const presetItem = (p: Preset) => {
    const item = (
      <Tooltip key={p.name} content={{ title: p.name, body: p.about }}>
        <button type="button" className="patch-item" aria-current={p.name === name || undefined} onClick={() => onLoad(p.name, p.patch)}>
          {p.name}
        </button>
      </Tooltip>
    );
    if (!tutorials.some((t) => t.preset === p.name)) return item;
    // One pill, as in the Tutorials row: the cap opens its Tutorial, the name loads the Preset.
    return (
      <span key={p.name} className="patch-split">
        <Tooltip content={TUTORIAL_TIP}>
          <button type="button" className="patch-item patch-tutorial" aria-label={`Tutorial: ${p.name}`} onClick={() => onTutorial(p.name)}>
            <TutorialIcon />
          </button>
        </Tooltip>
        {item}
      </span>
    );
  };

  return (
    <section className="patch-presets">
      {/* The search and the categories on the heading's line, so the Presets keep the panel's height. */}
      <div className="patch-filters">
        <div className="patch-search">
          <h3>Presets</h3>
          {/* "Search", not "Search Presets": it narrows the Tutorials and My Patches too (issue 72). */}
          <input
            ref={searchBox}
            type="search"
            aria-label="Search"
            placeholder="Search names and descriptions"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              // Escape is the panel's (it clears the search first). Enter loads the first found, once something is typed.
              if (e.key === 'Enter') {
                e.preventDefault();
                if (searching) loadFirst();
              }
            }}
          />
          {query && (
            <button type="button" className="patch-search-clear" aria-label="Clear the search" onClick={clear}>
              ×
            </button>
          )}
        </div>
        <div className="patch-categories" role="radiogroup" aria-label="Category" onKeyDown={radioGroupKeys}>
          {CATEGORIES.map((c, i) => (
            <button key={c} type="button" role="radio" className="patch-category" aria-checked={c === category} tabIndex={radioTabIndex(c === category, i, true)} onClick={() => onCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <span className="visually-hidden" role="status">
        {announced}
      </span>
      <div className="patch-results">
        {/* The Tutorials first, a row like a group's, so the panel grows by one row only. */}
        {shownTutorials.length > 0 && (
          <div className="patch-group" role="group" aria-label="Tutorials">
            <span className="patch-group-name" aria-hidden="true">
              Tutorials
            </span>
            <div className="patch-list">
              {shownTutorials.map((t) => (
                <Tooltip key={t.preset} content={TUTORIAL_TIP}>
                  <button type="button" className="patch-item patch-tutorial-item" aria-label={`Tutorial: ${t.preset}${t.finished ? ', finished' : ''}`} onClick={() => onTutorial(t.preset)}>
                    <TutorialIcon />
                    {t.preset}
                    {t.finished && (
                      <span className="patch-finished" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
        {rows.map((row) => (
          <div key={`${row.kind} ${row.label}`} className="patch-group" role="group" aria-label={row.label}>
            <span className="patch-group-name" aria-hidden="true">
              {row.label}
            </span>
            <div className="patch-list">{row.presets.map(presetItem)}</div>
          </div>
        ))}
        {nothing && (
          <p className="patch-empty">
            {category === 'All' ? `Nothing matches “${query.trim()}”.` : `Nothing matches “${query.trim()}” in ${category}.`}
            {category !== 'All' && (
              <button
                type="button"
                className="patch-search-all"
                onClick={() => {
                  onCategory('All');
                  searchBox.current?.focus(); // the button goes with the message
                }}
              >
                Search All
              </button>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
