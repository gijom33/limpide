import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/**
 * If the app fails while it renders, a message says so and offers a reload, rather than a blank page (issue 46).
 * What failed is shown too, so a visitor's report can say.
 */
export class StartFailure extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="start-failure" role="alert">
        <h1>Limpide stopped</h1>
        <p>Something in this browser kept it from running. Reloading often helps; Chrome or Edge on a computer works best.</p>
        <p className="start-failure-detail">{error.message}</p>
        <button type="button" className="tool" onClick={() => location.reload()}>
          Reload
        </button>
      </main>
    );
  }
}
