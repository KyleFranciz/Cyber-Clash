import { ENEMY_ARRIVAL_INTEGRITY_LOSS } from "../balance";
import { selectBlackout, useGame } from "../store/game";

/**
 * The corridor camera (docs/assets-guide.md: "Camera feed (174,104)
 * 1080x540", "Enemy on camera screen (672,350)"). No camera-feed.png or
 * enemy-walk.png exists yet, so a CSS corridor and a plain sprite carry
 * the layout, same as office.css's placeholder backgrounds elsewhere.
 *
 * `enemy.progress` (0 = out of sight, 1 = at the door) drives the sprite's
 * horizontal position directly, so the feed always matches the store the
 * game loop is ticking -- there is no separate animation clock.
 */
export function CameraPanel() {
  const enemy = useGame((s) => s.enemy);
  const doorClosed = useGame((s) => s.doorClosed);
  const blackout = useGame(selectBlackout);

  const visible = enemy.phase !== "waiting";
  const clampedProgress = Math.min(Math.max(enemy.progress, 0), 1);
  // Subtract the sprite's own width so progress 1 lands it at the door
  // frame, not past it.
  const spriteLeft = `calc(${clampedProgress * 100}% - ${clampedProgress * 60}px)`;

  return (
    <div className="camera-feed">
      <div className="camera-titlebar">
        <span>CAM 1 — EAST CORRIDOR</span>
        <span className={`door-chip ${doorClosed ? "door-closed" : "door-open"}`}>
          DOOR {doorClosed ? "CLOSED" : "OPEN"}
        </span>
      </div>

      <div className="camera-corridor">
        {blackout ? (
          <p className="camera-no-signal">NO SIGNAL — power failure</p>
        ) : (
          <>
            <div className="corridor-track" aria-hidden="true" />
            <div className="corridor-door" aria-hidden="true" />
            {visible && (
              <div className={`enemy-sprite enemy-${enemy.phase}`} style={{ left: spriteLeft }} aria-hidden="true" />
            )}
            <p className="camera-caption">
              {!visible
                ? "Corridor quiet."
                : enemy.phase === "retreating"
                  ? "It is withdrawing."
                  : clampedProgress > 0.75
                    ? "It is close to the door."
                    : "Movement detected in the corridor."}
            </p>
          </>
        )}
      </div>

      <p className="camera-note">
        A closed door stops it before it arrives. Reaching the workstation costs{" "}
        {ENEMY_ARRIVAL_INTEGRITY_LOSS} Security Integrity.
      </p>
    </div>
  );
}
