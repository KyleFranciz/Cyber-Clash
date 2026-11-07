import { NIGHT_LENGTH_GAME_MINUTES } from "../balance";
import { formatClock } from "../lib/clock";

/**
 * The night clock. Styling matches the real HUD design (U1-0): a red "NIGHT
 * 1" badge, the time in cream, a dark progress track, and a caption.
 */
export function ClockPanel({ clock }: { clock: number }) {
  const progress = Math.min(100, (clock / NIGHT_LENGTH_GAME_MINUTES) * 100);
  return (
    <div className="hud-panel" style={{ width: 138 }}>
      <div className="hud-badge" style={{ background: "var(--accent-clock)", color: "#fff" }}>
        NIGHT 1
      </div>
      <p className="hud-value" style={{ color: "var(--cream)", fontSize: 26 }}>
        {formatClock(clock)}
      </p>
      <div
        className="clock-track"
        role="meter"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress through the night"
      >
        <div className="clock-fill" style={{ width: `${Math.max(progress, 8)}%` }} />
      </div>
      <p className="hud-caption">Survive to 6 AM</p>
    </div>
  );
}
