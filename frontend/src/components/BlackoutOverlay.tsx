import { selectBlackout, useGame } from "../store/game";

/**
 * "Blackout. Cameras, AI and powered defenses fail and breaches become
 * much likelier. It is not instant death." (docs/game-design.md section
 * 3). A dim overlay over the office, not a blocker: power and integrity
 * are deliberately separate, so manual play keeps working underneath it
 * (`pointer-events: none`).
 */
export function BlackoutOverlay() {
  const blackout = useGame(selectBlackout);
  if (!blackout) return null;

  return (
    <div className="blackout-overlay" aria-hidden="true">
      <p className="blackout-label">POWER FAILURE</p>
    </div>
  );
}
