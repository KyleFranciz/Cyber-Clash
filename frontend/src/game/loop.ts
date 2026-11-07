import { MAX_FRAME_SECONDS } from "../balance";
import { useGame } from "../store/game";

/**
 * The one game loop (AGENTS.md rule 6). It calls
 * `useGame.getState().tick(dt)`, which always reads the latest state, so no
 * timer can close over stale numbers. Nothing else in the app may start a
 * timer for game logic.
 */
export function startGameLoop(): () => void {
  let last = performance.now();
  let frame = requestAnimationFrame(step);

  function step(now: number) {
    const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
    last = now;
    useGame.getState().tick(dt);
    frame = requestAnimationFrame(step);
  }

  return () => cancelAnimationFrame(frame);
}
