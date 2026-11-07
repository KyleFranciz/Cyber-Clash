import { ACTION_HINTS, ACTION_LABELS } from "../lib/labels";
import type { Action } from "../types";

/** Colours from docs/assets-guide.md (the three-button decision bar). */
const CLASS_BY_ACTION: Record<Action, string> = {
  no_action: "action-leave",
  verify_separately: "action-verify",
  report: "action-report",
};

export function ActionButton({
  action,
  disabled,
  onChoose,
}: {
  action: Action;
  disabled?: boolean;
  onChoose: (action: Action) => void;
}) {
  return (
    <button
      type="button"
      className={`action-button ${CLASS_BY_ACTION[action]}`}
      disabled={disabled}
      onClick={() => onChoose(action)}
    >
      <strong>{ACTION_LABELS[action]}</strong>
      <small>{ACTION_HINTS[action]}</small>
    </button>
  );
}
