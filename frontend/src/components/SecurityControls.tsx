import { selectBlackout, useGame } from "../store/game";

/**
 * Door and camera controls for the Faceless Figure (docs/game-design.md
 * sections 3 and 7). Both cost power while active (balance.ts), and both
 * are disabled during a blackout -- a powered defense that has failed
 * can't be switched back on from here. Disabled while the email modal is
 * open too: "only one modal state receives input at a time"
 * (docs/frontend-spec.md, "Screens").
 *
 * The ambient line below the buttons is the non-camera "audio cue" from
 * the core loop (docs/game-design.md section 4): the player should sense
 * the figure is out there even before picking up the camera.
 */
export function SecurityControls() {
  const doorClosed = useGame((s) => s.doorClosed);
  const cameraActive = useGame((s) => s.cameraActive);
  const enemy = useGame((s) => s.enemy);
  const toggleDoor = useGame((s) => s.toggleDoor);
  const toggleCamera = useGame((s) => s.toggleCamera);
  const blackout = useGame(selectBlackout);
  const modalOpen = useGame((s) => s.modal !== null);

  const disabled = blackout || modalOpen;

  return (
    <>
      <button
        type="button"
        className={`control-button ${doorClosed ? "control-button-active" : ""}`}
        onClick={toggleDoor}
        disabled={disabled}
      >
        {doorClosed ? "Open the door" : "Close the door"}
        <br />
        <span style={{ fontSize: 12, color: "var(--cream-dim)" }}>
          {doorClosed ? "No longer blocking the corridor" : "Blocks the corridor — costs power"}
        </span>
      </button>

      <button
        type="button"
        className={`control-button ${cameraActive ? "control-button-active" : ""}`}
        onClick={toggleCamera}
        disabled={disabled}
      >
        {cameraActive ? "Put the camera down" : "Watch the corridor camera"}
        <br />
        <span style={{ fontSize: 12, color: "var(--cream-dim)" }}>
          {cameraActive ? "Back to the inbox" : "Slows it down — costs power"}
        </span>
      </button>

      {!cameraActive && !blackout && enemy.phase !== "waiting" && (
        <p className="threat-status" role="status">
          {enemy.phase === "retreating"
            ? "Something is withdrawing down the corridor."
            : enemy.progress > 0.6
              ? "Footsteps are close."
              : "You hear something in the corridor."}
        </p>
      )}

      {blackout && <p className="threat-status threat-status-danger">No power for the door or cameras.</p>}
    </>
  );
}
