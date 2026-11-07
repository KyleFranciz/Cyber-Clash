/**
 * The 10-segment LED-style stat bar used by the power and integrity panels
 * in the real HUD design (Paper file 01K4XVGQHJKESN857335275T69, artboard
 * U1-0 "Balatro — Survival HUD"): a dark track holding ten blocks, the
 * leading `filled` of them lit in `onColor`, the rest `--segment-off`.
 */
const SEGMENT_COUNT = 10;

export function SegmentBar({
  value,
  onColor,
  segmentHeight,
  ariaLabel,
}: {
  /** 0-100. Rounded to the nearest of 10 segments, at least one lit above 0. */
  value: number;
  onColor: string;
  segmentHeight: number;
  ariaLabel: string;
}) {
  const filled = value <= 0 ? 0 : Math.max(1, Math.round((value / 100) * SEGMENT_COUNT));

  return (
    <div
      className="segment-bar"
      role="meter"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
        // Segments read top-to-bottom in the design, so the first one drawn
        // is the last one that fills in.
        const litFromTop = SEGMENT_COUNT - i <= filled;
        return (
          <div
            key={i}
            className="segment"
            style={{ height: segmentHeight, background: litFromTop ? onColor : "var(--segment-off)" }}
          />
        );
      })}
    </div>
  );
}
