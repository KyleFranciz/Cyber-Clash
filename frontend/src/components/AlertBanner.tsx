import { useGame } from "../store/game";

/**
 * A short banner for an encounter outcome: the figure arrived (danger) or
 * was stopped at a closed door (safe). Cleared by the store's tick once
 * `clock` passes `alert.until` (store/game.ts) -- no separate timer, per
 * AGENTS.md rule 6.
 */
export function AlertBanner() {
  const alert = useGame((s) => s.alert);
  if (!alert) return null;

  return (
    <div className={`alert-banner alert-banner-${alert.tone}`} role="alert">
      {alert.message}
    </div>
  );
}
