import type { Source } from "../types";

/**
 * The model writes citation ids like [P1] in its text. The server has already
 * stripped any id it was not given and attached the real sources, so all this
 * does is turn each surviving id into a numbered chip (docs/api-contract.md,
 * "Citation format"). The frontend never builds a URL from model text.
 */

export type CitationPiece =
  | { kind: "text"; text: string }
  | { kind: "citation"; passageId: string; number: number; source?: Source };

const CITATION_PATTERN = /\[(P\d+)\]/g;

/** Maps a passage id to the source that carries it. */
function indexSourcesByPassage(sources: Source[]): Map<string, Source> {
  const index = new Map<string, Source>();
  for (const source of sources) {
    for (const passageId of source.passage_ids) {
      if (!index.has(passageId)) index.set(passageId, source);
    }
  }
  return index;
}

export function parseCitations(text: string, sources: Source[]): CitationPiece[] {
  const byPassage = indexSourcesByPassage(sources);
  // Chip numbers are assigned in order of first appearance, so the same
  // passage cited twice shows the same number both times.
  const numbers = new Map<string, number>();
  const pieces: CitationPiece[] = [];
  let pos = 0;

  CITATION_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CITATION_PATTERN.exec(text)) !== null) {
    if (match.index > pos) {
      pieces.push({ kind: "text", text: text.slice(pos, match.index) });
    }
    const passageId = match[1];
    if (!numbers.has(passageId)) numbers.set(passageId, numbers.size + 1);
    pieces.push({
      kind: "citation",
      passageId,
      number: numbers.get(passageId)!,
      source: byPassage.get(passageId),
    });
    pos = match.index + match[0].length;
  }
  if (pos < text.length) pieces.push({ kind: "text", text: text.slice(pos) });
  return pieces;
}
