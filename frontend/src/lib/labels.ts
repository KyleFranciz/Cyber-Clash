import type { Action, ClueKind } from "../types";

/** Button copy from docs/frontend-spec.md and docs/assets-guide.md. */
export const ACTION_LABELS: Record<Action, string> = {
  no_action: "Leave it",
  verify_separately: "Verify separately",
  report: "Report phishing",
};

/**
 * Plain-words explanation shown under each button before the decision.
 * Copy pulled verbatim from the real design (10X-0 "Decision Bar").
 */
export const ACTION_HINTS: Record<Action, string> = {
  no_action: "Looks fine to me",
  verify_separately: "Ask another way",
  report: "Tell the security team",
};

/** The instruction line above the decision buttons (10X-0 "Decision Bar"). */
export const DECISION_PROMPT = "Look closely. One wrong call and the attacker gets in.";

export const CLUE_KIND_LABELS: Record<ClueKind, string> = {
  red_flag: "Red flag",
  legit_signal: "Legitimate signal",
  benign_oddity: "Odd but harmless",
};

/** A non-colour marker for each clue kind, so colour is never the only signal. */
export const CLUE_KIND_MARKS: Record<ClueKind, string> = {
  red_flag: "!",
  legit_signal: "+",
  benign_oddity: "?",
};
