/**
 * Transcribed from docs/api-contract.md. This file IS the contract boundary:
 * if the backend changes shape, the doc changes first, then this file.
 *
 * Note what `PublicChallenge` does NOT have: is_malicious, best_action,
 * outcomes, feedback, clues, ai_hint. That is AGENTS.md rule 1 expressed as
 * types -- reading a secret field before /api/answer is a compile error.
 */

export type Action = "report" | "verify_separately" | "no_action";
export type Outcome = "full" | "reduced"; // never "none"
export type Mode = "guided" | "standard" | "challenge";

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** false => show a "draft" label; nobody has checked the passage yet. */
  checked: boolean;
  passage_ids: string[];
};

export type EmailLink = {
  display_text: string;
  actual_url: string;
};

export type PublicEmail = {
  from_name: string;
  from_address: string;
  reply_to: string | null;
  subject: string;
  body: string;
  links: EmailLink[];
  attachments: string[];
};

/** The only challenge shape that exists before the player answers. */
export type PublicChallenge = {
  id: string;
  tier: 1 | 2 | 3;
  email: PublicEmail;
  /** The free hint. Nudges toward evidence, never gives the answer. */
  hint_basic: string;
};

export type ClueKind = "red_flag" | "legit_signal" | "benign_oddity";

/**
 * `field` names the email field the span indexes into. The contract types it
 * as a bare string and never enumerates the vocabulary, so components resolve
 * it through CLUE_FIELDS in lib/clues.ts and degrade to plain text on an
 * unknown value. See the note there before changing this.
 */
export type Clue = {
  id: string;
  kind: ClueKind;
  field: string;
  start: number;
  end: number;
  text: string;
  why: string;
};

export type Objective = {
  id: string;
  title: string;
};

/** Response of POST /api/answer. The first time secret fields leave the server. */
export type AnswerResult = {
  challenge_id: string;
  outcome: Outcome;
  is_best: boolean;
  acceptable: boolean;
  is_malicious: boolean;
  best_action: Action;
  feedback: string;
  clues: Clue[];
  objectives: Objective[];
  /** true when outcome is "reduced" */
  explain_recommended: boolean;
};

export type AIReply = {
  text: string | null;
  sources: Source[];
  fallback: boolean;
};

export type HealthReply = {
  status: string;
  ai_available: boolean;
};

export type ChallengesReply = {
  night: number;
  mode: Mode;
  challenges: PublicChallenge[];
};

export type HintReply = {
  text: string;
  stated_confidence: number;
};

// ---- Request bodies -------------------------------------------------------

export type HintRequest = {
  run_id?: string;
  challenge_id: string;
};

export type AnswerRequest = {
  run_id: string;
  challenge_id: string;
  action: Action;
  hint_used: boolean;
};

export type ExplainRequest = {
  run_id: string;
  challenge_id: string;
  action: Action;
};

// ---- Frontend-only view models -------------------------------------------

/** What the store remembers about one handled email, for the results screen. */
export type HandledEmail = {
  challenge: PublicChallenge;
  action: Action;
  hintUsed: boolean;
  result: AnswerResult;
};

export type NightEnding = "complete" | "terminated";
