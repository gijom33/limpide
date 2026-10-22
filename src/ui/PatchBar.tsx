import { useEffect, useRef, useState } from 'react';
import type { Library } from '../patch/library';
import type { Patch } from '../patch/patch';
import { PRESETS, stepPreset } from '../patch/presets';
import { patchFromJSON, patchToJSON, patchToShare } from '../patch/serialize';
import { Tooltip } from './Tooltip';

interface Props {
  name: string;
  changed: boolean;
  patch: Patch;
  library: Library;
  /** Load a Patch and make it the new baseline for "changed". */
  onLoad(name: string, patch: Patch): void;
}

/** The current Patch's name with Preset arrows, and a panel to save, load, delete, export, import and share. */
export function PatchBar({ name, changed, patch, library, onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [link, setLink] = useState('');
  const [saveName, setSaveName] = useState(name);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [, refresh] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const presetIndex = PRESETS.findIndex((p) => p.name === name);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !wrapper.current?.contains(e.target as Node)) setOpen(false);
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
    const preset = PRESETS[presetIndex === -1 ? (delta > 0 ? 0 : PRESETS.length - 1) : stepPreset(presetIndex, delta)];
    onLoad(preset.name, preset.patch);
  };
  const toggle = () => {
    setOpen((o) => !o);
    setSaveName(PRESETS.some((p) => p.name === name) || name === 'Last session' || name === 'Shared Patch' ? '' : name);
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
    const a = Object.assign(document.createElement('a'), { href: url, download: `${name.replace(/[^\w -]+/g, '') || 'patch'}.synthview.json` });
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Exported as a file.');
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = patchFromJSON(await file.text());
      onLoad(file.name.replace(/\.synthview\.json$|\.json$/i, ''), imported);
      setStatus(`Imported “${file.name}”.`);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };
  const share = async () => {
    const url = `${location.origin}${location.pathname}#p=${patchToShare(patch)}`;
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
      <button type="button" className="tool tool-icon" aria-label="Previous Preset" onClick={() => step(-1)}>
        ‹
      </button>
      <Tooltip content={{ title: 'Patch', body: 'The sound you are playing. Open to save, load, export or share it. A dot means it has changed since it was loaded or saved; it is kept automatically either way.' }}>
        <button type="button" className="tool patch-name" aria-label={`Patch: ${name}`} aria-expanded={open} data-changed={changed || undefined} onClick={toggle}>
          <span>{name}</span>
          {changed && <span className="patch-changed" aria-hidden="true" />}
        </button>
      </Tooltip>
      <button type="button" className="tool tool-icon" aria-label="Next Preset" onClick={() => step(1)}>
        ›
      </button>

      {open && (
        <div className="patch-panel" role="dialog" aria-label="Patches">
          <section>
            <h3>Presets</h3>
            <div className="patch-list">
              {PRESETS.map((p) => (
                <Tooltip key={p.name} content={{ title: p.name, body: p.about }}>
                  <button type="button" className="patch-item" aria-current={p.name === name || undefined} onClick={() => onLoad(p.name, p.patch)}>
                    {p.name}
                  </button>
                </Tooltip>
              ))}
            </div>
          </section>
          <section>
            <h3>My Patches</h3>
            <div className="patch-list">
              {library.list().length === 0 && <p className="patch-empty">None saved yet.</p>}
              {library.list().map((p) => (
                <span key={p.name} className="patch-mine">
                  <button type="button" className="patch-item" aria-label={`Load ${p.name}`} aria-current={p.name === name || undefined} onClick={() => onLoad(p.name, p.patch)}>
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
            <label className="tool">
              Import file
              <input type="file" accept=".json,application/json" aria-label="Import file" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
            </label>
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
