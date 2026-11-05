import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, testSession } from '../../test/renderHook';
import { useMidi } from './useMidi';

/**
 * A Controller plugged in, as Web MIDI shows it, on one port or more (a C16 on USB and Bluetooth at once): its messages
 * are sent with `send`, on every port, as such a Controller sends them.
 */
function controller(names: readonly string[]) {
  const inputs = names.map((name) => Object.assign(new EventTarget(), { id: name, name, state: 'connected' as const }));
  const access = Object.assign(new EventTarget(), { inputs: { values: () => inputs.values() } });
  const send = (...bytes: number[]) =>
    act(async () => {
      for (const input of inputs) input.dispatchEvent(Object.assign(new Event('midimessage'), { data: Uint8Array.from(bytes) }));
    });
  return { access, send };
}

/** useMidi with a session that writes down what it plays, and a host that writes down what it is told. */
async function midi(name: string | readonly string[] = 'Keystation 49', stored: Record<string, string> = {}) {
  const device = controller(typeof name === 'string' ? [name] : name);
  vi.spyOn(navigator, 'requestMIDIAccess').mockResolvedValue(device.access as unknown as MIDIAccess);
  const { session, storage, played } = testSession();
  for (const [key, value] of Object.entries(stored)) storage.setItem(key, value);
  const told: string[] = [];
  const host = {
    storage, session,
    pressHoldRef: { current: () => void told.push('hold') },
    onNote: () => void told.push('note'),
    onBend: (amount: number) => void told.push(`bend ${amount.toFixed(1)}`),
    onPedal: (down: boolean) => void told.push(`pedal ${down ? 'down' : 'up'}`),
    onProgram: (number: number) => void told.push(`program ${number}`),
    onPressure: (amount: number) => void told.push(`pressure ${amount.toFixed(1)}`),
  };
  let renders = 0;
  const hook = await renderHook((h: typeof host) => {
    renders++;
    return useMidi(h);
  }, host);
  await act(async () => hook.result.current.connect());
  await vi.waitFor(() => expect(hook.result.current.midi.kind).toBe('ready'));
  return { ...hook, ...device, session, played, told, host, renders: () => renders };
}

describe('useMidi: a Controller (the 1.16.0 review)', () => {
  let unmount = async () => {};
  afterEach(async () => {
    await unmount();
    vi.restoreAllMocks();
  });

  it('names the Controller connected, and plays its Notes, telling the page a Note came', async () => {
    const m = await midi();
    unmount = m.unmount;
    expect(m.result.current.midi).toEqual({ kind: 'ready', devices: ['Keystation 49'] });
    await m.send(0x90, 60, 100);
    await m.send(0x80, 60, 0);
    expect(m.played).toEqual(['press 60', 'let go 60']);
    expect(m.told).toEqual(['note']);
  });

  it('tells the latest host of a Note, after the page has rendered again', async () => {
    const m = await midi();
    unmount = m.unmount;
    const told: string[] = [];
    await m.rerender({ ...m.host, onNote: () => void told.push('the new host') });
    await m.send(0x90, 60, 100);
    expect(told).toEqual(['the new host']);
    expect(m.told).toEqual([]);
  });

  it('hands an unmapped keyboard’s pedal and Program Change to the host, and its mod wheel to the LFO’s Depth (issue 52)', async () => {
    const m = await midi();
    unmount = m.unmount;
    await m.send(0xb0, 64, 127);
    await m.send(0xc0, 5);
    await m.send(0xb0, 1, 127);
    expect(m.told).toEqual(['pedal down', 'program 5']);
    expect(m.session.patches.get().patch.lfoAmount).toBe(1);
  });

  it('hands channel aftertouch to the host, and says once a keyboard has pressed (issue 132)', async () => {
    const m = await midi();
    unmount = m.unmount;
    await m.send(0xd0, 0);
    expect(m.result.current.pressureHeard).toBe(false); // a keyboard at rest says nothing of what it can send
    await m.send(0xd0, 127);
    expect(m.told).toEqual(['pressure 0.0', 'pressure 1.0']);
    expect(m.result.current.pressureHeard).toBe(true);
    expect(m.result.current.activity.get()).toBe('ch 1 · Aftertouch · 100 %');
  });

  it('shows each message in the Activity line without rendering the page again (issue 217)', async () => {
    const m = await midi();
    unmount = m.unmount;
    await m.send(0xd0, 127); // the first press is heard once: the Timeline starts drawing what it moves
    const before = m.renders();
    for (let value = 0; value < 50; value++) await m.send(0xd0, value);
    await m.send(0xb0, 1, 64);
    expect(m.renders()).toBe(before);
    expect(m.result.current.activity.get()).toBe('ch 1 · CC 1 · 64');
  });

  it('hands per-Note aftertouch to the host too, the Activity Monitor naming its Note (issue 132)', async () => {
    const m = await midi();
    unmount = m.unmount;
    await m.send(0xa9, 36, 0);
    expect(m.result.current.pressureHeard).toBe(false);
    await m.send(0xa9, 36, 127);
    expect(m.told).toEqual(['pressure 0.0', 'pressure 1.0']);
    expect(m.result.current.pressureHeard).toBe(true);
    expect(m.result.current.activity.get()).toBe('ch 10 · Aftertouch C2 · 100 %');
  });

  it('acts on a pad mapped to an Action: Hold through the host, the next Preset in the Patch', async () => {
    const m = await midi();
    unmount = m.unmount;
    await act(async () => {
      m.result.current.mappingStore.set({ control: { kind: 'note', channel: 10, number: 36 }, target: { kind: 'action', id: 'hold' }, mode: 'trigger' });
      m.result.current.mappingStore.set({ control: { kind: 'note', channel: 10, number: 37 }, target: { kind: 'action', id: 'nextPreset' }, mode: 'trigger' });
    });
    const before = m.session.patches.get().name;
    await m.send(0x99, 36, 100);
    await m.send(0x99, 37, 100);
    // Every Note from a Controller tells the page one came, a pad's too: the person has taken over from the Demo.
    expect(m.told).toEqual(['note', 'hold', 'note']);
    expect(m.session.patches.get().name).not.toBe(before);
    expect(m.played).toEqual([]); // a mapped pad plays no Note
  });

  it('lays out a C16 by itself the first time one is plugged in with nothing mapped (ADR-0009)', async () => {
    const m = await midi('TEMPOPAD C16');
    unmount = m.unmount;
    expect(m.result.current.mappings.length).toBeGreaterThan(0);
  });

  it('keeps the C16 layout to a C16: a keyboard’s sustain pedal on the same CC still holds the Notes (issue 145)', async () => {
    const m = await midi('Keystation 49');
    unmount = m.unmount;
    await act(async () => {
      m.result.current.mappingStore.set({ control: { kind: 'cc', channel: 1, number: 64 }, target: { kind: 'action', id: 'nextPreset' }, mode: 'trigger', device: 'c16' });
    });
    await m.send(0xb0, 64, 127);
    expect(m.told).toEqual(['pedal down']);
  });

  it('lets a C16 play its layout: its CC 64 is a Preset arrow, not a pedal (issue 145)', async () => {
    const m = await midi('Synido TempoPAD C16 BT Bluetooth');
    unmount = m.unmount;
    const before = m.session.patches.get().name;
    await m.send(0xb0, 64, 127); // bank B's M2, Next Preset
    await m.send(0xb0, 64, 0);
    expect(m.told).toEqual([]);
    expect(m.session.patches.get().name).not.toBe(before);
  });

  it('brings the first C16 layout over to today’s once, then leaves what is learned on its places (issue 145)', async () => {
    const first = [{ control: { kind: 'cc', channel: 1, number: 8 }, target: { kind: 'param', id: 'glide' }, mode: 'relative-centred' }];
    const m = await midi('Synido TempoPAD C16', { 'limpide.mappings': JSON.stringify(first), 'limpide.c16Layout': '1' });
    unmount = m.unmount;
    const at = (cc: number) => m.result.current.mappings.find((x) => x.control.number === cc);
    expect(at(8)?.target).toEqual({ kind: 'param', id: 'osc2EnvAmount' }); // today's K8 on bank A
    await act(async () => {
      m.result.current.mappingStore.set({ control: { kind: 'cc', channel: 1, number: 8 }, target: { kind: 'param', id: 'glide' }, mode: 'relative-centred' });
    });
    await act(async () => void m.access.dispatchEvent(new Event('statechange'))); // the C16 connects again
    expect(at(8)?.target).toEqual({ kind: 'param', id: 'glide' });
  });

  it('hears a C16 on USB and on Bluetooth at once on the first port alone: a press counts once (issue 185)', async () => {
    const m = await midi(['Synido TempoPAD C16', 'Synido TempoPAD C16 BT Bluetooth']);
    unmount = m.unmount;
    expect(m.result.current.midi).toEqual({ kind: 'ready', devices: ['Synido TempoPAD C16', 'Synido TempoPAD C16 BT Bluetooth'] });
    await m.send(0xc0, 5);
    await m.send(0x90, 60, 100);
    expect(m.told).toEqual(['program 5', 'note']);
  });

  it('leaves a keyboard with nothing mapped as it is', async () => {
    const m = await midi();
    unmount = m.unmount;
    expect(m.result.current.mappings).toEqual([]);
  });
});
