import { integrityBand } from "../balance";
import { SegmentBar } from "./SegmentBar";

/**
 * Power and Security Integrity. Styling matches the real HUD design
 * (U1-0 "Balatro — Survival HUD"): a colored badge pill, a big value in the
 * badge's color, a 10-segment LED bar, and a caption. The integrity band
 * name is shown as text too, not just a color, per docs/game-design.md
 * section 3.
 */
export function PowerPanel({ power }: { power: number }) {
  const low = power <= 20;
  return (
    <div className="hud-panel" style={{ width: 138 }}>
      <div className="hud-badge" style={{ background: "var(--accent-power)", color: "#1a2426" }}>
        POWER
      </div>
      <p className="hud-value" style={{ color: "var(--accent-power)", fontSize: 34 }}>
        {power}%
      </p>
      <SegmentBar value={power} onColor="var(--accent-power)" segmentHeight={14} ariaLabel="Power" />
      <p className="hud-caption">{low ? "LOW POWER" : "Cams, door, AI"}</p>
    </div>
  );
}

export function IntegrityPanel({
  integrity,
  activeThreats,
}: {
  integrity: number;
  activeThreats: number;
}) {
  const band = integrityBand(integrity);

  return (
    <div className="hud-panel" style={{ width: 132 }}>
      <div className="hud-badge hud-badge-stacked" style={{ background: "var(--accent-integrity-badge)" }}>
        <span>SECURITY</span>
        <span>INTEGRITY</span>
      </div>
      <p className="hud-value" style={{ color: "var(--accent-integrity)", fontSize: 30 }}>
        {integrity}/100
      </p>
      <SegmentBar
        value={integrity}
        onColor="var(--accent-integrity)"
        segmentHeight={25}
        ariaLabel="Security Integrity"
      />
      <p className="hud-caption" style={{ color: "var(--accent-integrity)", fontWeight: 700 }}>
        {band.label}
      </p>
      {activeThreats > 0 && (
        <p className="threat-note">
          {activeThreats} active {activeThreats === 1 ? "threat" : "threats"} draining integrity
        </p>
      )}
    </div>
  );
}
