/**
 * The one place the frontend talks to the server. Paths, bodies and response
 * shapes follow docs/api-contract.md exactly, so when the backend routes land
 * nothing here changes.
 *
 * While they do not exist, an unbuilt endpoint falls through to the in-browser
 * mock (src/api/mock/handlers.ts). "Unbuilt" means a network failure, or a
 * status that says the route is not there -- see isEndpointUnavailable. A
 * meaningful refusal (409 before an answer, 422 on a bad body) is re-thrown.
 * Set VITE_USE_MOCK=1 to skip the real request entirely.
 */

import { ApiError, isEndpointUnavailable } from "./errors";
import { handleMock, mockHandles } from "./mock/handlers";
import type {
  Action,
  AIReply,
  AnswerResult,
  ChallengesReply,
  HealthReply,
  HintReply,
  Mode,
  PublicChallenge,
} from "../types";

const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === "1";

/** Paths already reported as mocked, so the console gets one line, not one per render. */
const announced = new Set<string>();

function announceMock(pathname: string, reason: string) {
  if (announced.has(pathname)) return;
  announced.add(pathname);
  console.info(
    `[api] ${pathname} is being served by the in-browser mock (${reason}). ` +
      `It will use the real backend as soon as that route exists.`,
  );
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const pathname = new URL(path, window.location.origin).pathname;

  if (FORCE_MOCK && mockHandles(path)) {
    announceMock(pathname, "VITE_USE_MOCK=1");
    return handleMock<T>(path, init);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (networkError) {
    // Nothing listening at all -- backend down, or running outside Compose.
    if (mockHandles(path)) {
      announceMock(pathname, "no server responded");
      return handleMock<T>(path, init);
    }
    throw networkError;
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (isEndpointUnavailable(response.status, contentType) && mockHandles(path)) {
      announceMock(pathname, `server returned ${response.status}`);
      return handleMock<T>(path, init);
    }
    // A real, meaningful refusal: 409 before an answer, 422 on a bad body.
    const detail = await response.text().catch(() => "");
    throw new ApiError(response.status, pathname, detail || undefined);
  }

  return (await response.json()) as T;
}

// ---- The contract, one function per endpoint -------------------------------

export function getHealth(): Promise<HealthReply> {
  return apiFetch<HealthReply>("/api/health");
}

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

export function getChallenge(id: string): Promise<PublicChallenge> {
  return apiFetch<PublicChallenge>(`/api/challenges/${encodeURIComponent(id)}`);
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
