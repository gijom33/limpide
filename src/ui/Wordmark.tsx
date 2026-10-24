import { Logo } from './Logo';

/** The logo and name of the app, a button that opens the About splash. */
export function Wordmark({ onOpen }: { onOpen: () => void }) {
  return (
    <h1 className="wordmark">
      <button type="button" className="wordmark-button" aria-haspopup="dialog" onClick={onOpen}>
        <Logo />
        <span className="wordmark-text">Limpide</span>
      </button>
    </h1>
  );
}
