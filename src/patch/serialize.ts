import { FORMER_NAME } from '../app/legacy';
import { CHOICES, defaultPatch, PARAMS, type ParamId, type Patch, setParam } from './patch';

const FORMAT = { app: 'limpide', version: 1 } as const;

/**
 * Turns anything (storage, an imported file, a share link, a Patch from another version) into a valid Patch:
 * unknown fields are dropped, missing or malformed ones get their defaults, numbers are clamped (and snapped).
 */
export function sanitizePatch(input: unknown): Patch {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  let patch = defaultPatch();
  for (const id of Object.keys(PARAMS) as ParamId[]) {
    const value = source[id];
    if (typeof value === 'number' && Number.isFinite(value)) patch = setParam(patch, id, value);
  }
  for (const [key, allowed] of Object.entries(CHOICES) as [keyof typeof CHOICES, readonly unknown[]][]) {
    if (allowed.includes(source[key])) patch = { ...patch, [key]: source[key] };
  }
  return patch;
}

export function patchToJSON(patch: Patch): string {
  return JSON.stringify({ ...FORMAT, patch }, null, 2);
}

/** Reads a Patch file. Throws with a reason a person can understand when it is not one. */
export function patchFromJSON(text: string): Patch {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This is not a valid file (it is not JSON).');
  }
  const file = data as { app?: unknown; patch?: unknown };
  // Files exported under the app's former name still load.
  if (!file || typeof file !== 'object' || (file.app !== FORMAT.app && file.app !== FORMER_NAME)) throw new Error('This file is not a Limpide Patch.');
  return sanitizePatch(file.patch);
}

/** A compact, URL-safe text for share links: only what differs from the defaults. */
export function patchToShare(patch: Patch): string {
  const defaults = defaultPatch();
  const changed = Object.fromEntries(Object.entries(patch).filter(([k, v]) => defaults[k as keyof Patch] !== v));
  const bytes = new TextEncoder().encode(JSON.stringify(changed));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The part of a share link after its #: the Patch, and its name when it has one worth keeping (issue 53). */
export function shareHash(patch: Patch, name?: string): string {
  return `p=${patchToShare(patch)}${name ? `&n=${encodeURIComponent(name)}` : ''}`;
}

/** A share link's Patch and name (a link from before 1.11 has no name), or undefined when the link is damaged. */
export function readShareHash(hash: string): { patch: Patch; name?: string } | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const encoded = params.get('p');
  const patch = encoded === null ? undefined : patchFromShare(encoded);
  if (!patch) return undefined;
  const name = params.get('n')?.trim().slice(0, 60);
  return { patch, name: name || undefined };
}

/** Reads a share link's Patch, or undefined when the link is damaged. */
export function patchFromShare(text: string): Patch | undefined {
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    return sanitizePatch(JSON.parse(json));
  } catch {
    return undefined;
  }
}
