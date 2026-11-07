/**
 * An in-browser stand-in for the five endpoints in docs/api-contract.md, used
 * only while the backend routes do not exist. It mirrors the contract exactly,
 * including the spoiler rule (challenges hand back a PublicChallenge and
 * nothing more) and the 409 on /explain before an answer -- so code written
 * against the mock is code written against the real server.
 */

import { ApiError } from "../errors";
import {
  MOCK_BY_ID,
  MOCK_CHALLENGES,
  OBJECTIVES,
  type MockChallenge,
} from "./night1";
import type {
  Action,
  AIReply,
  AnswerRequest,
  AnswerResult,
  ChallengesReply,
  ExplainRequest,
  HealthReply,
  HintReply,
  HintRequest,
  Mode,
  Outcome,
  PublicChallenge,
} from "../../types";

/** Latency so the spinner and loading states are actually exercised. */
const FAST_MS = 120;
const EXPLAIN_MS = 900;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Deterministic PRNG, so the same `seed` gives the same draw order. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The outcome table from docs/game-design.md section 6.2. There is never a
 * "none" outcome, so no choice is a dead end (AGENTS.md / rule 7 of the
 * architecture doc).
 */
function outcomeFor(challenge: MockChallenge, action: Action): Outcome {
  return challenge.acceptable_actions.includes(action) ? "full" : "reduced";
}

/**
 * Attempts recorded by this mock session, keyed `run_id|challenge_id`. The
 * real server stores these in SQLite; /explain needs them to decide 409.
 */
const attempts = new Map<string, Action>();

function attemptKey(runId: string, challengeId: string) {
  return `${runId}|${challengeId}`;
}

// ---------------------------------------------------------------------------

function health(): HealthReply {
  // The mock has no OpenAI key, but it does serve authored explanation text,
  // so from the frontend's point of view the AI is "available".
  return { status: "ok", ai_available: true };
}

function drawChallenges(params: URLSearchParams): ChallengesReply {
  const night = Number(params.get("night") ?? 1);
  const mode = (params.get("mode") ?? "standard") as Mode;
  const count = Number(params.get("count") ?? 6);
  const seed = params.get("seed") ?? "";

  // Night 1 allows tiers 1-2. Guided caps the top tier at 2, Challenge floors
  // the bottom tier at 2 (docs/api-contract.md, "Draw rule").
  const minTier = mode === "challenge" ? 2 : 1;
  const maxTier = 2;
  let pool = MOCK_CHALLENGES.filter((c) => c.public.tier >= minTier && c.public.tier <= maxTier);

  // With only six authored emails, a Challenge draw can run short. Fall back
  // to the full pool rather than hand back a half-empty night.
  if (pool.length < count) pool = MOCK_CHALLENGES;

  const ordered = [...pool];
  if (seed) {
    const rand = mulberry32(hashSeed(seed));
    for (let i = ordered.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }
  }

  return {
    night,
    mode,
    // No repeats: slice off a shuffled pool.
    challenges: ordered.slice(0, count).map((c) => c.public),
  };
}

function oneChallenge(id: string): PublicChallenge {
  const found = MOCK_BY_ID.get(id);
  if (!found) throw new ApiError(404, `/api/challenges/${id}`, "Unknown challenge");
  return found.public;
}

function hint(body: HintRequest): HintReply {
  const found = MOCK_BY_ID.get(body.challenge_id);
  if (!found) throw new ApiError(404, "/api/hint", "Unknown challenge");
  return {
    text: found.ai_hint.text,
    stated_confidence: found.ai_hint.stated_confidence,
  };
}

function answer(body: AnswerRequest): AnswerResult {
  const found = MOCK_BY_ID.get(body.challenge_id);
  if (!found) throw new ApiError(404, "/api/answer", "Unknown challenge");

  const outcome = outcomeFor(found, body.action);
  attempts.set(attemptKey(body.run_id, body.challenge_id), body.action);

  return {
    challenge_id: found.public.id,
    outcome,
    is_best: body.action === found.best_action,
    acceptable: found.acceptable_actions.includes(body.action),
    is_malicious: found.is_malicious,
    best_action: found.best_action,
    feedback: found.feedback[body.action],
    clues: found.clues,
    objectives: found.objective_ids.map((id) => OBJECTIVES[id]).filter(Boolean),
    explain_recommended: outcome === "reduced",
  };
}

function explain(body: ExplainRequest): AIReply {
  const found = MOCK_BY_ID.get(body.challenge_id);
  if (!found) throw new ApiError(404, "/api/explain", "Unknown challenge");
  if (!attempts.has(attemptKey(body.run_id, body.challenge_id))) {
    throw new ApiError(409, "/api/explain", "No attempt recorded for this run and challenge");
  }

  const text = found.explain[body.action];
  if (!text) return { text: null, sources: [], fallback: true };

  // The real server strips any citation id the model was not given. Here the
  // text is authored, so every id is valid by construction -- but only the
  // sources actually cited are returned, as the server does.
  const cited = new Set(Array.from(text.matchAll(/\[(P\d+)\]/g), (m) => m[1]));
  const sources = found.sources.filter((s) => s.passage_ids.some((p) => cited.has(p)));

  return { text, sources, fallback: false };
}

// ---------------------------------------------------------------------------

/** Does this mock know the path? Anything else is left to the real backend. */
export function mockHandles(path: string): boolean {
  const { pathname } = new URL(path, "http://mock.local");
  return (
    pathname === "/api/health" ||
    pathname === "/api/challenges" ||
    pathname.startsWith("/api/challenges/") ||
    pathname === "/api/hint" ||
    pathname === "/api/answer" ||
    pathname === "/api/explain"
  );
}

export async function handleMock<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(path, "http://mock.local");
  const method = (init?.method ?? "GET").toUpperCase();
  const body = init?.body ? JSON.parse(String(init.body)) : {};

  if (url.pathname === "/api/health") return delay(health() as T, FAST_MS);

  if (url.pathname === "/api/challenges" && method === "GET") {
    return delay(drawChallenges(url.searchParams) as T, FAST_MS);
  }

  if (url.pathname.startsWith("/api/challenges/") && method === "GET") {
    const id = decodeURIComponent(url.pathname.slice("/api/challenges/".length));
    return delay(oneChallenge(id) as T, FAST_MS);
  }

  if (url.pathname === "/api/hint" && method === "POST") {
    return delay(hint(body) as T, FAST_MS);
  }

  if (url.pathname === "/api/answer" && method === "POST") {
    return delay(answer(body) as T, FAST_MS);
  }

  if (url.pathname === "/api/explain" && method === "POST") {
    return delay(explain(body) as T, EXPLAIN_MS);
  }

  throw new ApiError(404, url.pathname, "No mock handler for this path");
}
