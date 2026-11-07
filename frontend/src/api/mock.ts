import { MOCK_NIGHT1, type MockChallenge } from "./mockContent";
import type { Action, AIReply, AnswerResult, ChallengesReply, HintReply, Mode, PublicChallenge } from "../types";

/**
 * Local fallback used only when the real backend call fails -- see
 * api/client.ts. Keeps the frontend playable while the backend (a
 * teammate's separate work) is still being built.
 */

function toPublicChallenge(challenge: MockChallenge): PublicChallenge {
  const { id, tier, email, hint_basic } = challenge;
  return { id, tier, email, hint_basic };
}

function findMock(challengeId: string): MockChallenge {
  const challenge = MOCK_NIGHT1.find((c) => c.id === challengeId);
  if (!challenge) throw new Error(`[mock] no such challenge: ${challengeId}`);
  return challenge;
}

export function mockChallenges(night: number, mode: Mode): ChallengesReply {
  return { night, mode, challenges: MOCK_NIGHT1.map(toPublicChallenge) };
}

export function mockHint(challengeId: string): HintReply {
  return findMock(challengeId).ai_hint;
}

export function mockAnswer(challengeId: string, action: Action): AnswerResult {
  const challenge = findMock(challengeId);
  const outcome = challenge.action_outcome[action];
  return {
    challenge_id: challengeId,
    outcome,
    is_best: action === challenge.best_action,
    acceptable: challenge.acceptable_actions.includes(action),
    is_malicious: challenge.is_malicious,
    best_action: challenge.best_action,
    feedback: challenge.action_feedback[action],
    clues: challenge.clues,
    objectives: challenge.objectives,
    explain_recommended: outcome === "reduced",
  };
}

/** No real AI here either -- always the same honest fallback (AGENTS.md rule 4). */
export function mockExplain(): AIReply {
  return { text: null, sources: [], fallback: true };
}
