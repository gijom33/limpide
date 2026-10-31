import { BUTTON_ROWS, buttonCc, buttonMode, C16_BANKS, type C16Place, faderCc, knobCc } from '../midi/c16';

/** One place on the card: its name on the C16 (K1, F3, M2…), what it drives or "free", and its CC. */
function Cell({ name, place, cc, mode }: { name: string; place: C16Place; cc: number; mode?: 'trigger' | 'toggle' }) {
  return (
    <div role="listitem" className={`c16-cell${place ? '' : ' c16-free'}`}>
      <span className="c16-name">
        <span>
          {name} <span className="c16-cc">CC {cc}</span>
        </span>
        {mode && <span className={`c16-mode c16-${mode}`}>{mode === 'trigger' ? 'Momentary' : 'Toggle'}</span>}
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
          button as marked: <span className="c16-mode c16-trigger">Momentary</span> or{' '}
          <span className="c16-mode c16-toggle">Toggle</span>. The pads play the synth.
        </p>
        <button type="button" className="c16-print" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <div className="c16-banks">
        {C16_BANKS.map((bank, b) => (
          <section key={bank.name} className="c16-bank" aria-label={`Bank ${'ABCD'[b]}: ${bank.name}`}>
            <h2>
              <span className="c16-letter">{'ABCD'[b]}</span> {bank.name}
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
                      <Cell key={row} name={`${row}${s + 1}`} place={place} cc={buttonCc(b, row, s)} mode={place ? buttonMode(place.target) : 'toggle'} />
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="c16-card-foot">
        On every bank: M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold, S3 Snapshot. Free places stay Toggle,
        the C16’s own setting. All on MIDI channel 1. gijom33.github.io/limpide
      </p>
    </div>
  );
}
