import { Fragment } from "react";

import { cluesForField, splitByClues, type ClueField } from "../lib/clues";
import { CLUE_KIND_LABELS, CLUE_KIND_MARKS } from "../lib/labels";
import type { Clue } from "../types";

/**
 * Renders one email field, wrapping each clue span in a highlight. Only ever
 * used after /api/answer returns -- before that the frontend has no clues to
 * draw, by design.
 *
 * Each highlight carries a colour AND a number plus a symbol, so colour is
 * never the only signal (docs/frontend-spec.md, "Highlighting clues").
 */
export function HighlightedText({
  text,
  clues,
  field,
  numbers,
}: {
  text: string;
  clues: Clue[];
  field: ClueField;
  /** Clue id -> display number, shared with the list under the feedback card. */
  numbers: Map<string, number>;
}) {
  const relevant = cluesForField(clues, field);
  if (relevant.length === 0) return <>{text}</>;

  const pieces = splitByClues(text, relevant);

  return (
    <>
      {pieces.map((piece, index) => {
        if (!piece.clue) return <Fragment key={index}>{piece.text}</Fragment>;
        const clue = piece.clue;
        const number = numbers.get(clue.id);
        return (
          // The sr-only description is a sibling AFTER the mark, not nested
          // inside it: an absolutely-positioned descendant still makes
          // Chromium fragment the mark's inline box to place it, and that
          // phantom empty fragment inherits .clue's border-bottom and
          // border-radius -- a stray colored sliver below the highlight.
          <Fragment key={index}>
            <mark
              className={`clue clue-${clue.kind}`}
              // The title gives a pointer user the explanation; the full list
              // below the feedback card gives everyone else the same text.
              title={`${CLUE_KIND_LABELS[clue.kind]}: ${clue.why}`}
            >
              {piece.text}
              <span className="clue-mark" aria-hidden="true">
                {CLUE_KIND_MARKS[clue.kind]}
                {number ?? ""}
              </span>
            </mark>
            <span className="sr-only">
              {" "}
              ({CLUE_KIND_LABELS[clue.kind]} {number ?? ""}: {clue.why})
            </span>
          </Fragment>
        );
      })}
    </>
  );
}
