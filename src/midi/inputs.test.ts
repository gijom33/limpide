import { describe, expect, it, vi } from 'vitest';
import { connectMidi, midiSupport, type MidiAccessLike, type MidiInputLike } from './inputs';

class FakeInput extends EventTarget implements MidiInputLike {
  constructor(public id: string, public name: string, public state: 'connected' | 'disconnected' = 'connected') {
    super();
  }
  send(...bytes: number[]) {
    this.dispatchEvent(Object.assign(new Event('midimessage'), { data: Uint8Array.from(bytes) }));
  }
}

class FakeAccess extends EventTarget implements MidiAccessLike {
  map = new Map<string, FakeInput>();
  inputs = { values: () => this.map.values() };
  plug(input: FakeInput) {
    this.map.set(input.id, input);
    this.dispatchEvent(Object.assign(new Event('statechange'), { port: input }));
  }
  unplug(id: string) {
    const input = this.map.get(id)!;
    input.state = 'disconnected';
    this.map.delete(id);
    this.dispatchEvent(Object.assign(new Event('statechange'), { port: input }));
  }
}

function setup(...initial: FakeInput[]) {
  const access = new FakeAccess();
  for (const i of initial) access.map.set(i.id, i);
  const onMessage = vi.fn();
  const onDevices = vi.fn();
  const dispose = connectMidi(access, { onMessage, onDevices });
  return { access, onMessage, onDevices, dispose };
}

describe('connectMidi', () => {
  it('reports the Controllers already connected', () => {
    const { onDevices } = setup(new FakeInput('a', 'Synido TempoPAD C16'));
    expect(onDevices).toHaveBeenLastCalledWith(['Synido TempoPAD C16']);
  });

  it('delivers parsed messages from each Controller', () => {
    const pad = new FakeInput('a', 'Synido TempoPAD C16');
    const { onMessage } = setup(pad);
    pad.send(0x90, 60, 127);
    expect(onMessage).toHaveBeenCalledWith({ type: 'noteOn', channel: 1, note: 60, velocity: 1 });
  });

  it('starts listening to a Controller plugged in later', () => {
    const { access, onMessage, onDevices } = setup();
    expect(onDevices).toHaveBeenLastCalledWith([]);
    const pad = new FakeInput('a', 'Synido TempoPAD C16');
    access.plug(pad);
    expect(onDevices).toHaveBeenLastCalledWith(['Synido TempoPAD C16']);
    pad.send(0xb0, 74, 64);
    expect(onMessage).toHaveBeenCalledWith({ type: 'cc', channel: 1, controller: 74, value: 64 });
  });

  it('releases every Note still held on a Controller when it is unplugged, so nothing sticks', () => {
    const pad = new FakeInput('a', 'Synido TempoPAD C16');
    const { access, onMessage, onDevices } = setup(pad);
    pad.send(0x90, 60, 100, 0x90, 64, 100, 0x80, 60, 0);
    onMessage.mockClear();
    access.unplug('a');
    expect(onMessage.mock.calls.map(([m]) => m)).toEqual([{ type: 'noteOff', channel: 1, note: 64 }]);
    expect(onDevices).toHaveBeenLastCalledWith([]);
  });

  it('stops listening when disposed', () => {
    const pad = new FakeInput('a', 'Synido TempoPAD C16');
    const { onMessage, dispose } = setup(pad);
    dispose();
    pad.send(0x90, 60, 127);
    expect(onMessage).not.toHaveBeenCalled();
  });
});

describe('midiSupport', () => {
  it('knows when the browser has no Web MIDI (Safari)', () => {
    expect(midiSupport({})).toBe('unsupported');
    expect(midiSupport({ requestMIDIAccess: () => Promise.resolve() })).toBe('supported');
  });

  it('knows an iPhone or iPad has no Web MIDI in any browser, Chrome included', () => {
    const chromeOnIPhone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1';
    const macSafari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    expect(midiSupport({ userAgent: chromeOnIPhone })).toBe('ios');
    expect(midiSupport({ userAgent: macSafari, platform: 'MacIntel', maxTouchPoints: 5 })).toBe('ios'); // an iPad asking for the desktop site
    expect(midiSupport({ userAgent: macSafari, platform: 'MacIntel', maxTouchPoints: 0 })).toBe('unsupported');
  });
});
