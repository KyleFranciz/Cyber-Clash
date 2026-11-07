/**
 * The waiting state for an AI call. `label` is read out, so the spinner is
 * never the only indication that something is happening.
 */
export function Spinner({ label = "A.E.G.I.S. is thinking..." }: { label?: string }) {
  return (
    <span className="spinner-row" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </span>
  );
}
