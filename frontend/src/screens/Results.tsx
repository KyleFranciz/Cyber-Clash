import { NIGHT_LENGTH_GAME_MINUTES } from "../balance";
import { formatClock } from "../lib/clock";
import { ACTION_LABELS } from "../lib/labels";
import { collectObjectives, selectIntegrity, selectPower, useGame } from "../store/game";

/**
 * Night review. Tracks the two results from docs/game-design.md section 8:
 * *survived* (reached 6:00 AM) and *learning complete* (every email handled).
 * Both are reported, because learning never depends on surviving.
 */
export function Results() {
  const ending = useGame((s) => s.ending);
  const results = useGame((s) => s.results);
  const pack = useGame((s) => s.pack);
  const clock = useGame((s) => s.clock);
  const integrity = useGame(selectIntegrity);
  const power = useGame(selectPower);
  const backToTitle = useGame((s) => s.backToTitle);

  const terminated = ending === "terminated";
  const survived = !terminated;
  const learningComplete = pack.length > 0 && results.length >= pack.length;
  const objectives = collectObjectives(results);
  const bestResponses = results.filter((entry) => entry.result.is_best).length;

  return (
    <div className={`results ${terminated ? "results-terminated" : "results-complete"}`}>
      <h1>{terminated ? "SHIFT TERMINATED" : "NIGHT COMPLETE"}</h1>
      <p className="verdict">
        {terminated ? "EMPLOYEE STATUS: UNKNOWN" : `REACHED ${formatClock(clock)}`}
      </p>

      <div className="results-summary">
        <Tile k="Survived" v={survived ? "Yes" : "No"} />
        <Tile k="Learning" v={learningComplete ? "Complete" : `${results.length}/${pack.length}`} />
        <Tile k="Best responses" v={`${bestResponses}/${results.length || 0}`} />
        <Tile k="Integrity" v={String(integrity)} />
        <Tile k="Power" v={`${power}%`} />
        <Tile
          k="Clock"
          v={clock >= NIGHT_LENGTH_GAME_MINUTES ? "6:00 AM" : formatClock(clock)}
        />
      </div>

      <table className="review-table">
        <caption>Message review</caption>
        <thead>
          <tr>
            <th scope="col">Message</th>
            <th scope="col">You chose</th>
            <th scope="col">Best response</th>
            <th scope="col">Outcome</th>
            <th scope="col">Hint</th>
            <th scope="col">What it taught</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && (
            <tr>
              <td colSpan={6}>No messages were handled tonight.</td>
            </tr>
          )}
          {results.map((entry) => (
            <tr key={entry.challenge.id} className={entry.result.is_best ? undefined : "miss"}>
              <td>
                <strong>{entry.challenge.email.subject}</strong>
                <br />
                <span style={{ color: "#6e7570" }}>{entry.challenge.email.from_name}</span>
              </td>
              <td>{ACTION_LABELS[entry.action]}</td>
              <td>{ACTION_LABELS[entry.result.best_action]}</td>
              <td>
                <span className={`outcome-chip outcome-${entry.result.outcome}`}>
                  {entry.result.outcome}
                </span>
              </td>
              <td>{entry.hintUsed ? "Used" : "—"}</td>
              <td>{entry.result.feedback}</td>
            </tr>
          ))}

          {/* Emails the night never got to still belong in the review. */}
          {pack
            .filter((challenge) => !results.some((r) => r.challenge.id === challenge.id))
            .map((challenge) => (
              <tr key={challenge.id} className="miss">
                <td>
                  <strong>{challenge.email.subject}</strong>
                  <br />
                  <span style={{ color: "#6e7570" }}>{challenge.email.from_name}</span>
                </td>
                <td colSpan={5}>Not handled before the shift ended.</td>
              </tr>
            ))}
        </tbody>
      </table>

      {objectives.length > 0 && (
        <ul className="objectives">
          {objectives.map((objective) => (
            <li key={objective.id}>
              <span className="tick" aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>{objective.id}</strong> — {objective.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="results-foot">
        <button type="button" className="close-button" onClick={backToTitle}>
          Back to the title screen
        </button>
      </div>
    </div>
  );
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="summary-tile">
      <p className="k">{k}</p>
      <p className="v">{v}</p>
    </div>
  );
}
