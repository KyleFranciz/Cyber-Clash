import type { Clue } from "../types";

/**
 * The field names a clue's `start`/`end` offsets may index into.
 *
 * docs/api-contract.md types `clues[].field` as a bare `string` and never
 * lists the vocabulary, so this is the frontend's best guess at the content
 * pack's spelling. An unrecognised field renders as plain text (see
 * cluesForField) rather than throwing, so a mismatch costs a highlight, not
 * the screen. Confirm against backend/content/night1_challenges.json when the
 * pack lands and add any missing spellings here.
 */
export const CLUE_FIELDS = [
  "from_name",
  "from_address",
  "reply_to",
  "subject",
  "body",
  "link",
  "attachment",
] as const;

export type ClueField = (typeof CLUE_FIELDS)[number];

const warnedFields = new Set<string>();

export function isKnownClueField(field: string): field is ClueField {
  return (CLUE_FIELDS as readonly string[]).includes(field);
}

/**
 * Clues belonging to one field. Anything with an unknown field name is
 * dropped (and reported once) so it cannot produce a bogus highlight.
 */
export function cluesForField(clues: Clue[], field: ClueField): Clue[] {
  const out: Clue[] = [];
  for (const clue of clues) {
    if (isKnownClueField(clue.field)) {
      if (clue.field === field) out.push(clue);
    } else if (!warnedFields.has(clue.field)) {
      warnedFields.add(clue.field);
      console.warn(
        `[clues] unknown clue field "${clue.field}" -- rendering that text without a highlight. ` +
          `Add it to CLUE_FIELDS in src/lib/clues.ts.`,
      );
    }
  }
  return out;
}

/**
 * Split `text` into an ordered run of pieces, each either plain or carrying
 * the clue that covers it. Taken verbatim from docs/frontend-spec.md so the
 * frontend and the spec cannot drift.
 */
export function splitByClues(text: string, clues: Clue[]) {
  const sorted = [...clues].sort((a, b) => a.start - b.start);
  const out: { text: string; clue?: Clue }[] = [];
  let pos = 0;
  for (const c of sorted) {
    if (c.start < pos) continue; // skip overlaps
    if (c.start > pos) out.push({ text: text.slice(pos, c.start) });
    out.push({ text: text.slice(c.start, c.end), clue: c });
    pos = c.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}

/**
 * Stable 1-based numbers for the clues of one challenge, so the marker on a
 * highlight matches the entry in the clue list below the email. Sorted by
 * field order then offset, which is the reading order on screen.
 */
export function numberClues(clues: Clue[]): Map<string, number> {
  const ordered = [...clues].sort((a, b) => {
    const fieldDelta =
      (CLUE_FIELDS as readonly string[]).indexOf(a.field) -
      (CLUE_FIELDS as readonly string[]).indexOf(b.field);
    if (fieldDelta !== 0) return fieldDelta;
    return a.start - b.start;
  });
  return new Map(ordered.map((clue, index) => [clue.id, index + 1]));
}
