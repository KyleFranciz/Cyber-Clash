import { At } from "../components/Stage";
import { ClockPanel } from "../components/ClockPanel";
import { Desk } from "../components/Desk";
import { EmailModal } from "../components/EmailModal";
import { IntegrityPanel, PowerPanel } from "../components/StatBar";
import { selectClockMinute, selectIntegrity, selectPower, useGame } from "../store/game";

/**
 * The desk. Positions are the exact stage pixels from docs/assets-guide.md:
 * office background (0,0) 1440x640, desk (0,640), monitor bezel (336,56)
 * 768x478, monitor screen (362,82) 716x426, clock (18,92), power (18,272),
 * integrity (1290,92), controls (1100,672).
 */
export function Office() {
  const modal = useGame((s) => s.modal);
  const pack = useGame((s) => s.pack);
  const handledCount = useGame((s) => s.results.length);
  const activeThreats = useGame((s) => s.activeThreats.length);
  const endNight = useGame((s) => s.endNight);

  // Whole units only, so the HUD re-renders about once a second rather than
  // on all sixty frames.
  const clock = useGame(selectClockMinute);
  const integrity = useGame(selectIntegrity);
  const power = useGame(selectPower);

  const openChallenge = modal
    ? pack.find((challenge) => challenge.id === modal.challengeId)
    : undefined;

  return (
    <>
      <div className="office-bg" />
      <div className="office-desk" />
      <div className="office-vignette" />

      <At x={18} y={92}>
        <ClockPanel clock={clock} />
      </At>

      <At x={18} y={272}>
        <PowerPanel power={power} />
      </At>

      <At x={1290} y={92}>
        <IntegrityPanel integrity={integrity} activeThreats={activeThreats} />
      </At>

      <At x={336} y={56} width={768} height={478} className="monitor-bezel" />
      <At x={362} y={82} width={716} height={426} className="monitor-screen">
        <Desk />
      </At>

      <At x={1100} y={672} className="controls">
        <p style={{ margin: 0, fontSize: 13, color: "var(--cream-dim)" }}>
          {handledCount} of {pack.length} messages handled
        </p>
        <button
          type="button"
          className="control-button"
          onClick={() => endNight("complete")}
          disabled={Boolean(modal)}
        >
          End the shift early
          <br />
          <span style={{ fontSize: 12, color: "var(--cream-dim)" }}>
            Go straight to the review
          </span>
        </button>
      </At>

      {openChallenge && <EmailModal challenge={openChallenge} />}
    </>
  );
}
