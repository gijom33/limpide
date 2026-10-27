import { useEffect, useRef, useState } from 'react';
import type { Library } from '../patch/library';
import type { Patch } from '../patch/patch';
import { PRESET_GROUPS, PRESETS, presetAfter, SHARED_NAME } from '../patch/presets';
import { patchFromJSON, patchToJSON, shareHash } from '../patch/serialize';
import { TutorialIcon } from './icons';
import { useLearnable } from './learn';
import { Tooltip } from './Tooltip';

interface Props {
  name: string;
  changed: boolean;
  patch: Patch;
  library: Library;
  /** Load a Patch and make it the new baseline for "changed". */
  onLoad(name: string, patch: Patch): void;
  /** The Presets that have a Tutorial, and whether it has been played to the end. */
  tutorials: readonly { preset: string; finished: boolean }[];
  onTutorial(preset: string): void;
}

const TUTORIAL_TIP = { title: 'Tutorial', body: 'Build this sound step by step, from Init: turn each control yourself, and hear and see what it does.' };

/** The current Patch's name with Preset arrows, and a panel to save, load, delete, export, import and share. */
export function PatchBar({ name, changed, patch, library, onLoad, tutorials, onTutorial }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [link, setLink] = useState('');
  const [saveName, setSaveName] = useState(name);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [, refresh] = useState(0);
  const learnPrevious = useLearnable({ kind: 'action', id: 'previousPreset' });
  const learnNext = useLearnable({ kind: 'action', id: 'nextPreset' });
  const wrapper = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
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
    // Escape closes it back to its button; a press elsewhere closes it and leaves the focus where the press went.
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') closeToOpener();
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
      {/* The sound loaded, said to a screen reader, after the arrows, a Preset picked or a Controller's pad (issue 51). */}
      <span className="visually-hidden" role="status">
        {name}
      </span>

      {open && (
        <div className="patch-panel" role="dialog" aria-label="Patches">
          <section className="patch-presets">
            <h3>Presets</h3>
            {/* The Tutorials first, a row like a group's, so the panel grows by one row only. */}
            <div className="patch-group" role="group" aria-label="Tutorials">
              <span className="patch-group-name" aria-hidden="true">Tutorials</span>
              <div className="patch-list">
                {tutorials.map((t) => (
                  <Tooltip key={t.preset} content={TUTORIAL_TIP}>
                    <button type="button" className="patch-item patch-tutorial-item" aria-label={`Tutorial: ${t.preset}${t.finished ? ', finished' : ''}`} onClick={() => tutorial(t.preset)}>
                      <TutorialIcon />
                      {t.preset}
                      {t.finished && <span className="patch-finished" aria-hidden="true">✓</span>}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
            {PRESET_GROUPS.map((group) => (
              <div key={group} className="patch-group" role="group" aria-label={group}>
                <span className="patch-group-name" aria-hidden="true">{group}</span>
                <div className="patch-list">
                  {PRESETS.filter((p) => p.group === group).map((p) => {
                    const item = (
                      <Tooltip key={p.name} content={{ title: p.name, body: p.about }}>
                        <button type="button" className="patch-item" aria-current={p.name === name || undefined} onClick={() => load(p.name, p.patch)}>
                          {p.name}
                        </button>
                      </Tooltip>
                    );
                    if (!tutorials.some((t) => t.preset === p.name)) return item;
                    // One pill, as in the Tutorials row: the cap opens its Tutorial, the name loads the Preset.
                    return (
                      <span key={p.name} className="patch-split">
                        <Tooltip content={TUTORIAL_TIP}>
                          <button type="button" className="patch-item patch-tutorial" aria-label={`Tutorial: ${p.name}`} onClick={() => tutorial(p.name)}>
                            <TutorialIcon />
                          </button>
                        </Tooltip>
                        {item}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
          <section>
            <h3>My Patches</h3>
            <div className="patch-list">
              {library.list().length === 0 && <p className="patch-empty">None saved yet.</p>}
              {library.list().map((p) => (
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
