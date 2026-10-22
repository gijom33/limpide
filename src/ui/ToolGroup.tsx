import { useId, type ReactNode } from 'react';

/** A captioned cluster of related controls in the toolbar. */
export function ToolGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="tool-group" role="group" aria-labelledby={id}>
      <span className="tool-group-title" id={id}>
        {title}
      </span>
      <div className="tool-group-controls">{children}</div>
    </div>
  );
}
