import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

const STAGE_WIDTH = 1440;
const STAGE_HEIGHT = 900;

/**
 * Draws children on a fixed 1440x900 surface and scales it to the window with
 * `scale = min(w/1440, h/900)`, centred (docs/frontend-spec.md, "Stage").
 *
 * The resize listener here is interface plumbing, not game logic -- rule 6 is
 * about the game clock, which only ever advances in the rAF loop.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const measure = () =>
      setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="stage-viewport">
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

/** Positions a child at exact stage pixels, as listed in docs/assets-guide.md. */
export function At({
  x,
  y,
  width,
  height,
  className,
  children,
  style,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className ? `at ${className}` : "at"}
      style={{ left: x, top: y, width, height, ...style }}
    >
      {children}
    </div>
  );
}

/** Small helper so a screen can react to window size without its own listener. */
export function useStageScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const measure = () =>
      setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return scale;
}
