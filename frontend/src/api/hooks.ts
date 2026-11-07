import { useMutation, useQuery } from "@tanstack/react-query";

import { EMAILS_PER_NIGHT } from "../balance";
import { getChallenges, postAnswer, postExplain, postHint } from "./client";
import { mockAnswer, mockChallenges, mockHint } from "./mock";
import type { Action, AIReply, Mode } from "../types";

/**
 * Tonight's emails. The store owns the selected draw once play starts, so the
 * query can be discarded when this screen unmounts and a replay gets a new draw.
 * `enabled` keeps it from firing until a mode is actually chosen.
 *
 * Falls back to local mock data (api/mock.ts) when the real backend call
 * fails, so the frontend stays playable while the backend -- a teammate's
 * separate, still-in-progress work -- isn't up yet. This lives here rather
 * than in api/client.ts on purpose: client.ts's job is to report the real
 * server's response (including its errors) faithfully, which
 * api/client.test.ts depends on; the fallback belongs at this UI-facing
 * layer, the same place useExplain already falls back for AI failures.
 */
export function useChallenges(
  night: number,
  mode: Mode,
  seed?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["challenges", night, mode, seed ?? ""],
    queryFn: async () => {
      try {
        return await getChallenges(night, mode, EMAILS_PER_NIGHT, seed);
      } catch (error) {
        console.warn("[api] /api/challenges unavailable; using local mock data.", error);
        return mockChallenges(night, mode);
      }
    },
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useHint() {
  return useMutation({
    mutationFn: async (vars: { runId: string; challengeId: string }) => {
      try {
        return await postHint(vars.runId, vars.challengeId);
      } catch (error) {
        console.warn("[api] /api/hint unavailable; using local mock data.", error);
        return mockHint(vars.challengeId);
      }
    },
    retry: false,
  });
}

export function useAnswer() {
  return useMutation({
    mutationFn: async (vars: {
      runId: string;
      challengeId: string;
      action: Action;
      hintUsed: boolean;
    }) => {
      try {
        return await postAnswer(vars.runId, vars.challengeId, vars.action, vars.hintUsed);
      } catch (error) {
        console.warn("[api] /api/answer unavailable; using local mock data.", error);
        return mockAnswer(vars.challengeId, vars.action);
      }
    },
    retry: false,
  });
}

/**
 * The AI explanation. A failure here is not an error (AGENTS.md rule 4): any
 * throw is turned into the same `fallback: true` reply the server sends when
 * the model times out, so no component can reach an error state and the
 * authored feedback simply stays on screen.
 */
export function useExplain() {
  return useMutation<AIReply, never, { runId: string; challengeId: string; action: Action }>({
    mutationFn: async (vars) => {
      try {
        return await postExplain(vars.runId, vars.challengeId, vars.action);
      } catch (error) {
        console.warn("[api] /api/explain failed; falling back to authored feedback.", error);
        return { text: null, sources: [], fallback: true };
      }
    },
    retry: false,
  });
}
