/** The one place the frontend talks to the server. */

import { ApiError } from "./errors";
import type {
  Action,
  AIReply,
  AnswerResult,
  ChallengesReply,
  HintReply,
  Mode,
} from "../types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const pathname = new URL(path, window.location.origin).pathname;

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ApiError(response.status, pathname, detail || undefined);
  }

  return (await response.json()) as T;
}

// ---- The contract, one function per endpoint -------------------------------

export function getChallenges(
  night: number,
  mode: Mode,
  count: number,
  seed?: string,
): Promise<ChallengesReply> {
  const params = new URLSearchParams({
    night: String(night),
    mode,
    count: String(count),
  });
  // The contract shows an always-present `seed` key; empty means "not seeded".
  params.set("seed", seed ?? "");
  return apiFetch<ChallengesReply>(`/api/challenges?${params.toString()}`);
}

export function postHint(runId: string, challengeId: string): Promise<HintReply> {
  return apiFetch<HintReply>("/api/hint", {
    method: "POST",
    body: JSON.stringify({ run_id: runId, challenge_id: challengeId }),
  });
}

export function postAnswer(
  runId: string,
  challengeId: string,
  action: Action,
  hintUsed: boolean,
): Promise<AnswerResult> {
  return apiFetch<AnswerResult>("/api/answer", {
    method: "POST",
    body: JSON.stringify({
      run_id: runId,
      challenge_id: challengeId,
      action,
      hint_used: hintUsed,
    }),
  });
}

export function postExplain(
  runId: string,
  challengeId: string,
  action: Action,
): Promise<AIReply> {
  return apiFetch<AIReply>("/api/explain", {
    method: "POST",
    body: JSON.stringify({ run_id: runId, challenge_id: challengeId, action }),
  });
}
