import type { ReactNode } from "react";

import { numberClues } from "../lib/clues";
import { ACTION_LABELS, CLUE_KIND_LABELS } from "../lib/labels";
import type { AnswerResult } from "../types";

/**
 * Authored feedback plus the clue list. Appears instantly after /api/answer
 * with no AI call -- the A.E.G.I.S. message, passed in as `children`, arrives
 * later and goes deeper. If the AI never answers, this card is still the whole
 * lesson (AGENTS.md rule 4).
 */
export function FeedbackCard({
  result,
  children,
}: {
  result: AnswerResult;
  children?: ReactNode;
}) {
  const numbers = numberClues(result.clues);
  const ordered = [...result.clues].sort(
    (a, b) => (numbers.get(a.id) ?? 0) - (numbers.get(b.id) ?? 0),
  );

  return (
    <section
      className="feedback-card"
      aria-label="Outcome and clues"
      // Announced on arrival, since it replaces the decision buttons.
      role="region"
      aria-live="polite"
    >
      <header
        className={`feedback-head ${result.outcome === "full" ? "feedback-full" : "feedback-reduced"}`}
      >
        <h3>{result.outcome === "full" ? "Full outcome" : "Reduced outcome"}</h3>
        <span className="best">
          {result.is_best
            ? "Best response"
            : `Best response: ${ACTION_LABELS[result.best_action]}`}
        </span>
      </header>

      <p className="feedback-text">{result.feedback}</p>

      {ordered.length > 0 && (
        <ul className="clue-list">
          {ordered.map((clue) => (
            <li key={clue.id}>
              <span className={`num clue-${clue.kind}`}>{numbers.get(clue.id)}</span>
              <span>
                <span className="kind">{CLUE_KIND_LABELS[clue.kind]}</span>
                <span className="quote">&ldquo;{clue.text}&rdquo;</span> — {clue.why}
              </span>
            </li>
          ))}
        </ul>
      )}

      {children}
    </section>
  );
}
