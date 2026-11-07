import { Fragment } from "react";

import { parseCitations } from "../lib/citations";
import { Spinner } from "./Spinner";
import type { AIReply } from "../types";

/**
 * A.E.G.I.S.'s deeper explanation. Three states, and none of them is an error
 * (AGENTS.md rule 4):
 *   pending  -> spinner
 *   fallback -> render nothing; the authored feedback above already stands
 *   text     -> the message, with [P1] ids as numbered chips and the sources
 *               the server attached listed underneath.
 */
export function AiMessage({
  pending,
  reply,
}: {
  pending: boolean;
  reply?: AIReply;
}) {
  if (pending) {
    return (
      <div className="ai-message">
        <h4>A.E.G.I.S.</h4>
        <Spinner />
      </div>
    );
  }

  // fallback (or no text) means the AI could not answer. Stay silent.
  if (!reply || reply.fallback || !reply.text) return null;

  const pieces = parseCitations(reply.text, reply.sources);
  // Only the sources actually cited in this message, numbered to match chips.
  const cited = new Map<string, number>();
  for (const piece of pieces) {
    if (
      piece.kind === "citation" &&
      piece.source &&
      !cited.has(piece.source.id)
    ) {
      cited.set(piece.source.id, piece.number);
    }
  }

  return (
    <div className="ai-message">
      <h4>A.E.G.I.S.</h4>
      <p className="ai-text">
        {pieces.map((piece, index) =>
          piece.kind === "text" ? (
            <Fragment key={index}>{piece.text}</Fragment>
          ) : (
            <span
              key={index}
              className="citation-chip"
              title={
                piece.source
                  ? `${piece.source.title} — ${piece.source.publisher}`
                  : `Passage ${piece.passageId}`
              }
            >
              {piece.number}
              <span className="sr-only"> (source {piece.number})</span>
            </span>
          ),
        )}
      </p>

      {reply.sources.length > 0 && (
        <ul className="source-list">
          {reply.sources.map((source) => (
            <li key={source.id}>
              <span className="num">[{cited.get(source.id) ?? "-"}]</span>{" "}
              <a href={source.url} target="_blank" rel="noreferrer noopener">
                {source.title}
              </a>{" "}
              — {source.publisher}
              {/* A source nobody has checked against its page yet. */}
              {!source.checked && <span className="draft-label">draft</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
