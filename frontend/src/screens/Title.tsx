import { useEffect, useState } from "react";

import { useChallenges } from "../api/hooks";
import { useGame } from "../store/game";
import type { Mode } from "../types";

/**
 * "How do you want to play?", in plain words with no jargon
 * (docs/game-design.md section 8). Only Guided and Standard are offered --
 * Challenge unlocks after a night on Standard, which is not in the first build.
 *
 * Clicking a mode arms the single challenges query; when it resolves, the
 * night starts.
 */
export function Title() {
  const startNight = useGame((s) => s.startNight);
  const [chosen, setChosen] = useState<Mode | null>(null);

  // One query, and only after a choice is made.
  const { data, isFetching, isError, refetch } = useChallenges(
    1,
    chosen ?? "standard",
    undefined,
    chosen !== null,
  );

  useEffect(() => {
    if (chosen && data) startNight(chosen, data.challenges);
  }, [chosen, data, startNight]);

  return (
    <div className="centered-card">
      <div className="title-card">
        <h1>CYBER CLASH</h1>
        <p className="tagline">NIGHT SHIFT · NIGHT 1: SUSPICIOUS ACTIVITY</p>
        <p className="note">
          You are the night-shift security analyst. Emails arrive until 6:00 AM. For each one,
          decide whether to leave it, verify it through a channel you already trust, or report it.
          The figures on the cameras are a metaphor for threats, not for people. This game has
          mild horror themes at low intensity.
        </p>

        {isError ? (
          <div className="mode-grid">
            <button type="button" className="mode-button" onClick={() => refetch()}>
              Try again
              <small>Tonight&rsquo;s mail could not be loaded.</small>
            </button>
          </div>
        ) : (
          <div className="mode-grid">
            <button
              type="button"
              className="mode-button secondary"
              onClick={() => setChosen("guided")}
              disabled={isFetching}
            >
              {chosen === "guided" && isFetching ? "Loading..." : "Guided"}
              <small>Longer night, cheaper hints. Good for a first run.</small>
            </button>
            <button
              type="button"
              className="mode-button"
              onClick={() => setChosen("standard")}
              disabled={isFetching}
            >
              {chosen === "standard" && isFetching ? "Loading..." : "Standard"}
              <small>The default. Ten minutes, real pressure.</small>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
