import { useEffect, useRef, useState } from 'react';
import type { Library } from '../patch/library';
import type { Patch } from '../patch/patch';
import { type Category, categoryLists, isSearch, matchesWords } from '../patch/presetSearch';
import { PRESETS, presetAfter, SHARED_NAME } from '../patch/presets';
import { patchFromJSON, patchToJSON, shareHash } from '../patch/serialize';
import type { PresetAbout } from './hooks/usePresetAbout';
import { useLearnable } from './learn';
import { PatchSearch } from './PatchSearch';
import { Tooltip } from './Tooltip';

interface Props {
  name: string;
  changed: boolean;
  patch: Patch;
  library: Library;
  /** Load a Patch and make it the new baseline for "changed". */
  onLoad(name: string, patch: Patch): void;
  /** The loaded Preset's about line, under the name until the sound changes (issue 109). */
  about: PresetAbout;
  /** The Presets that have a Tutorial, and whether it has been played to the end. */
  tutorials: readonly { preset: string; finished: boolean }[];
  onTutorial(preset: string): void;
}

/**
 * The current Patch's name with Preset arrows, and a panel to save, load, delete, export, import and share. The panel's
 * search and category (`PatchSearch`) narrow what it lists, and stay until the page reloads (issue 69).
 */
export function PatchBar({ name, changed, patch, library, onLoad, about, tutorials, onTutorial }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [link, setLink] = useState('');
  const [saveName, setSaveName] = useState(name);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [, refresh] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const learnPrevious = useLearnable({ kind: 'action', id: 'previousPreset' });
  const learnNext = useLearnable({ kind: 'action', id: 'nextPreset' });
  const wrapper = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const searchBox = useRef<HTMLInputElement>(null);
  const queryRef = useRef(query);
  queryRef.current = query;
  /** The panel closes, and the focus goes back to the button that opened it, not to the page (issue 51). */
  const closeToOpener = () => {
    setOpen(false);
    opener.current?.focus();
  };
  // The arrows step from the sound just chosen, even when clicked again before React has re-rendered.
  const stepping = useRef({ name, from: name });
  if (stepping.current.from !== name) stepping.current = { name, from: name };

  // biome-ignore lint/correctness/useExhaustiveDependencies: closeToOpener is rebuilt each render, the same each time
  useEffect(() => {
    if (!open) return;
    // Escape clears the search first, wherever the focus is in the panel, then closes it back to its button; a press
    // elsewhere closes it and leaves the focus where the press went.
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== 'Escape') return;
        if (queryRef.current) {
          setQuery('');
          searchBox.current?.focus();
        } else closeToOpener();
      } else if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, [open]);

  // The arrows step through sounds and close the panel; picking in the open panel keeps it open, to audition.
  const step = (delta: number) => {
    setOpen(false);
    const preset = presetAfter(stepping.current.name, delta);
    stepping.current.name = preset.name;
    onLoad(preset.name, preset.patch);
  };
  /** Loading a sound is the end of the visit: the panel closes so the sound can be played at once. */
  const load = (next: string, patch: Patch) => {
    onLoad(next, patch);
    closeToOpener();
  };
  const tutorial = (preset: string) => {
    setOpen(false);
    onTutorial(preset);
  };
  const toggle = () => {
    setOpen((o) => !o);
    setSaveName(PRESETS.some((p) => p.name === name) || name === 'Last session' || name === SHARED_NAME ? '' : name);
    setStatus('');
    setLink('');
    setConfirming(null);
  };
  const save = () => {
    if (!saveName.trim()) return setStatus('Give the Patch a name first.');
    library.save(saveName, patch);
    onLoad(saveName.trim(), patch);
    setStatus(`Saved “${saveName.trim()}”.`);
    refresh((n) => n + 1);
  };
  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([patchToJSON(patch)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${name.replace(/[^\w -]+/g, '') || 'patch'}.limpide.json` });
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Exported as a file.');
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = patchFromJSON(await file.text());
      onLoad(file.name.replace(/\.limpide\.json$|\.json$/i, ''), imported);
      setStatus(`Imported “${file.name}”.`);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };
  const share = async () => {
    // The name travels too, unless it says nothing of its own.
    const keep = name !== 'Last session' && name !== SHARED_NAME;
    const url = `${location.origin}${location.pathname}#${shareHash(patch, keep ? name : undefined)}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Link copied: anyone who opens it hears this Patch.');
    } catch {
      setStatus('Copy the link below to share this Patch.');
    }
  };

  // My Patches as the search and category leave them, by name: they have no description.
  const saved = open ? library.list() : [];
  const listsMine = categoryLists(category).mine;
  const mine = listsMine ? saved.filter((p) => matchesWords(query, p.name)) : [];

  return (
    <div className="patch-bar" ref={wrapper}>
      <button type="button" className="tool tool-icon" aria-label="Previous Preset" {...learnPrevious} onClick={() => step(-1)}>
        ‹
      </button>
      <Tooltip content={{ title: 'Patch', body: 'The sound you are playing. Open to save, load, export or share it. A dot means it has changed since it was loaded or saved; it is kept automatically either way.' }}>
        <button ref={opener} type="button" className="tool patch-name" aria-label={`Patch: ${name}`} aria-expanded={open} data-changed={changed || undefined} onClick={toggle}>
          <span>{name}</span>
          {changed && <span className="patch-changed" aria-hidden="true" />}
        </button>
      </Tooltip>
      <button type="button" className="tool tool-icon" aria-label="Next Preset" {...learnNext} onClick={() => step(1)}>
        ›
      </button>
      {/* The sound loaded, said to a screen reader, after the arrows, a Preset picked or a Controller's pad (issue 51),
          with its about line when one shows; the line itself under the name, over the page, so nothing moves. */}
      <span className="visually-hidden" role="status">
        {about.text ? `${name}. ${about.text}` : name}
      </span>
      {about.shown && (
        <p className="patch-about" aria-hidden="true">
          {about.text}
        </p>
      )}

      {open && (
        <div className="patch-panel" role="dialog" aria-label="Patches">
          <PatchSearch
            name={name}
            query={query}
            onQuery={setQuery}
            category={category}
            onCategory={setCategory}
            searchBox={searchBox}
            tutorials={tutorials}
            mine={mine}
            onLoad={load}
            onTutorial={tutorial}
          />
          <section>
            <h3>My Patches</h3>
            <div className="patch-list">
              {/* A category without them says where they are, or that there are none (issue 72). */}
              {saved.length === 0 && (!listsMine || !isSearch(query)) && <p className="patch-empty">None saved yet.</p>}
              {saved.length > 0 && !listsMine && <p className="patch-empty">Your saved Patches are under All and My Patches.</p>}
              {mine.map((p) => (
                <span key={p.name} className="patch-mine">
                  <button type="button" className="patch-item" aria-label={`Load ${p.name}`} aria-current={p.name === name || undefined} onClick={() => load(p.name, p.patch)}>
                    {p.name}
                  </button>
                  {confirming === p.name ? (
                    <button
                      type="button"
                      className="patch-delete patch-delete-confirm"
                      aria-label={`Confirm delete ${p.name}`}
                      onClick={() => {
                        library.remove(p.name);
                        setConfirming(null);
                        setStatus(`Deleted “${p.name}”.`);
                        refresh((n) => n + 1);
                      }}
                    >
                      Delete?
                    </button>
                  ) : (
                    <button type="button" className="patch-delete" aria-label={`Delete ${p.name}`} onClick={() => setConfirming(p.name)}>
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            <form
              className="patch-save"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <input aria-label="Patch name" placeholder="Name this sound" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
              <button type="submit" className="tool">
                Save
              </button>
            </form>
          </section>
          <section className="patch-actions">
            <button type="button" className="tool" onClick={exportFile}>
              Export file
            </button>
            {/* A real button, so the keyboard reaches it (issue 51); it opens the hidden file picker. */}
            <button type="button" className="tool" onClick={() => fileInput.current?.click()}>
              Import file
            </button>
            <input ref={fileInput} type="file" accept=".json,application/json" aria-label="Import file" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
            <button type="button" className="tool" onClick={() => void share()}>
              Copy share link
            </button>
          </section>
          {link && <input className="patch-link" aria-label="Share link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />}
          <p className="patch-status" role="status">
            {status}
          </p>
        </div>
      )}
    </div>
  );
}
