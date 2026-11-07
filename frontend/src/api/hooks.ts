import { useMutation, useQuery } from "@tanstack/react-query";

import { EMAILS_PER_NIGHT } from "../balance";
import { getChallenges, getHealth, postAnswer, postExplain, postHint } from "./client";
import type { Action, AIReply, Mode } from "../types";

/**
 * Tonight's emails. A night's draw must never refetch mid-play, or the inbox
 * would change underfoot, so it is cached forever and never revalidated.
 * `enabled` keeps it from firing until a mode is actually chosen.
 */
export function useChallenges(
  night: number,
  mode: Mode,
  seed?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["challenges", night, mode, seed ?? ""],
    queryFn: () => getChallenges(night, mode, EMAILS_PER_NIGHT, seed),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    staleTime: 60_000,
    retry: false,
  });
}

export function useHint() {
  return useMutation({
    mutationFn: (vars: { runId: string; challengeId: string }) =>
      postHint(vars.runId, vars.challengeId),
    retry: false,
  });
}

export function useAnswer() {
  return useMutation({
    mutationFn: (vars: {
      runId: string;
      challengeId: string;
      action: Action;
      hintUsed: boolean;
    }) => postAnswer(vars.runId, vars.challengeId, vars.action, vars.hintUsed),
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
