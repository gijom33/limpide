import {
  BUTTON_ROWS, bankLetter, buttonCc, buttonMode, C16_BANKS, C16_CHANNEL, type C16Place, FREE_BUTTON_MODE, faderCc, knobCc, sharedButtons,
} from '../midi/c16';
import { describeMode } from '../midi/describe';
import type { ButtonMode } from '../midi/mappings';

/** A button's mode as the MIDI panel names it, in its colour. */
const Mode = ({ mode }: { mode: ButtonMode }) => <span className={`c16-mode c16-${mode}`}>{describeMode(mode)}</span>;

/** One place on the card: its name on the C16 (K1, F3, M2…), what it drives or "free", and its CC. */
function Cell({ name, place, cc, mode }: { name: string; place: C16Place; cc: number; mode?: ButtonMode }) {
  return (
    <div role="listitem" className={`c16-cell${place ? '' : ' c16-free'}`}>
      <span className="c16-name">
        <span>
          {name} <span className="c16-cc">CC {cc}</span>
        </span>
        {mode && <Mode mode={mode} />}
      </span>
      <span className="c16-what">{place ? place.label : 'free'}</span>
    </div>
  );
}

/**
 * The C16 layout as a one-page card to print and keep beside the C16 (issue 145): each bank drawn as its panel, two
 * rows of knobs, the faders, then the M, S and R buttons under each, every place named, each button's mode to set.
 * Built from the layout's own data, so it never disagrees with what Limpide does.
 */
export function C16Card() {
  return (
    <div className="c16-card">
      <div className="c16-card-head">
        <h1>Limpide on the TempoPAD C16</h1>
        <p>
          Choose a bank with <b>CTRL BANK</b>, then <b>A</b> to <b>D</b>. Set every knob to <b>Relative #1</b>, and each
          button as marked: <Mode mode="trigger" /> or <Mode mode="toggle" />. The pads play the synth.
        </p>
        <button type="button" className="c16-print" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <div className="c16-banks">
        {C16_BANKS.map((bank, b) => (
          <section key={bank.name} className="c16-bank" aria-label={`Bank ${bankLetter(b)}: ${bank.name}`}>
            <h2>
              <span className="c16-letter">{bankLetter(b)}</span> {bank.name}
            </h2>
            <div className="c16-strips">
              {[0, 1, 2, 3].map((s) => (
                <div key={s} role="list" aria-label={`Strip ${s + 1}`} className="c16-strip">
                  <Cell name={`K${s + 1}`} place={bank.knobs[s]} cc={knobCc(b, s)} />
                  <Cell name={`K${s + 5}`} place={bank.knobs[s + 4]} cc={knobCc(b, s + 4)} />
                  <Cell name={`F${s + 1}`} place={bank.faders[s]} cc={faderCc(b, s)} />
                  {BUTTON_ROWS.map((row) => {
                    const place = bank.buttons[row][s];
                    return (
                      <Cell key={row} name={`${row}${s + 1}`} place={place} cc={buttonCc(b, row, s)} mode={place ? buttonMode(place.target) : FREE_BUTTON_MODE} />
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="c16-card-foot">
        On every bank: {sharedButtons().map((s) => `${s.name} ${s.place.label}`).join(', ')}. Free places stay{' '}
        {describeMode(FREE_BUTTON_MODE)}, the C16’s own setting. All on MIDI channel {C16_CHANNEL}. gijom33.github.io/limpide
      </p>
    </div>
  );
}
