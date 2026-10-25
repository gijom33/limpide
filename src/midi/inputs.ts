import { createMidiParser, type MidiMessage } from './parser';

/** The parts of a Web MIDI input this needs, so tests can stand in for real hardware. */
export interface MidiInputLike extends EventTarget {
  readonly id: string;
  readonly name: string | null;
  readonly state: 'connected' | 'disconnected';
}

/** The parts of MIDIAccess this needs. */
export interface MidiAccessLike extends EventTarget {
  readonly inputs: { values(): IterableIterator<MidiInputLike> };
}

interface Handlers {
  onMessage(message: MidiMessage): void;
  /** The connected Controllers' names, whenever they change. */
  onDevices(names: string[]): void;
}

/**
 * Listens to every connected Controller, now and as they come and go. Each has its own parser (running status
 * is per device). When one is unplugged, every Note still held on it is released, so nothing is left stuck.
 */
export function connectMidi(access: MidiAccessLike, { onMessage, onDevices }: Handlers): () => void {
  const attached = new Map<string, { input: MidiInputLike; listener: EventListener; held: Map<number, number> }>();

  const attach = (input: MidiInputLike) => {
    if (attached.has(input.id) || input.state !== 'connected') return;
    const parser = createMidiParser();
    const held = new Map<number, number>(); // note → channel
    const listener: EventListener = (event) => {
      for (const message of parser.feed((event as Event & { data: Uint8Array }).data)) {
        if (message.type === 'noteOn') held.set(message.note, message.channel);
        if (message.type === 'noteOff') held.delete(message.note);
        onMessage(message);
      }
    };
    input.addEventListener('midimessage', listener);
    attached.set(input.id, { input, listener, held });
  };

  const detach = (id: string) => {
    const entry = attached.get(id);
    if (!entry) return;
    entry.input.removeEventListener('midimessage', entry.listener);
    attached.delete(id);
    for (const [note, channel] of entry.held) onMessage({ type: 'noteOff', channel, note });
  };

  const report = () => onDevices([...attached.values()].map(({ input }) => input.name ?? 'MIDI device'));

  const onState = (event: Event) => {
    const port = (event as Event & { port?: MidiInputLike }).port;
    if (port && port.state === 'disconnected') detach(port.id);
    for (const input of access.inputs.values()) attach(input);
    report();
  };

  for (const input of access.inputs.values()) attach(input);
  access.addEventListener('statechange', onState);
  report();

  return () => {
    access.removeEventListener('statechange', onState);
    for (const { input, listener } of attached.values()) input.removeEventListener('midimessage', listener);
    attached.clear();
  };
}

/**
 * Whether this browser offers Web MIDI at all (Safari does not). On an iPhone or iPad no browser does, Chrome
 * included, as Apple makes them all run on Safari's engine: an iPad asking for the desktop site passes for a Mac,
 * and only its touch points give it away.
 */
export function midiSupport(nav: {
  requestMIDIAccess?: unknown;
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
}): 'supported' | 'unsupported' | 'ios' {
  if (typeof nav.requestMIDIAccess === 'function') return 'supported';
  const ios = /iPhone|iPad|iPod/.test(nav.userAgent ?? '') || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1);
  return ios ? 'ios' : 'unsupported';
}
