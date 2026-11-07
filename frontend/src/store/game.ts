/**
 * The single game store (AGENTS.md rule 15). Everything that changes lives
 * here, and `tick` is the only place time passes -- it is driven by the one
 * requestAnimationFrame loop in src/game/loop.ts and nothing else.
 *
 * Every number this file uses comes from src/balance.ts (rule 5).
 */

import { create } from "zustand";

import {
  ALERT_DURATION_GAME_MINUTES,
  ARRIVAL_SCHEDULE_GAME_MINUTES,
  BALANCE,
  CAMERA_POWER_DRAIN_PER_GAME_MINUTE,
  DOOR_CLOSED_POWER_DRAIN_PER_GAME_MINUTE,
  ENEMY_ADVANCE_PER_GAME_MINUTE,
  ENEMY_ARRIVAL_INTEGRITY_LOSS,
  ENEMY_BLACKOUT_SPEEDUP,
  ENEMY_FIRST_SPAWN_GAME_MINUTES,
  ENEMY_RETREAT_PER_GAME_MINUTE,
  ENEMY_SPAWN_COOLDOWN_GAME_MINUTES,
  ENEMY_WATCHED_SLOWDOWN,
  INTEGRITY_MAX,
  INTEGRITY_MIN,
  NIGHT_LENGTH_GAME_MINUTES,
  PASSIVE_POWER_DRAIN_PER_GAME_MINUTE,
  POWER_MAX,
  POWER_MIN,
  THREAT_INTEGRITY_PER_GAME_MINUTE,
  gameMinutesPerRealSecond,
  outcomeEffect,
} from "../balance";
import type {
  Action,
  AIReply,
  AnswerResult,
  HandledEmail,
  HintReply,
  Mode,
  NightEnding,
  Objective,
  PublicChallenge,
} from "../types";

export type Screen = "title" | "office" | "results";

/** An email that has not arrived yet, with the game minute it lands on. */
type QueuedEmail = {
  challenge: PublicChallenge;
  arrivesAt: number;
};

export type ActiveThreat = {
  challengeId: string;
  /** Game minute the threat was left active. */
  since: number;
};

/**
 * The Faceless Figure (docs/game-design.md sections 3 and 7). It sits
 * offscreen ("waiting"), walks the corridor toward the cubicle
 * ("approaching", progress 0 -> 1), then withdraws ("retreating",
 * progress 1 -> 0) whether the door held or not.
 */
export type EnemyPhase = "waiting" | "approaching" | "retreating";

export type Enemy = {
  phase: EnemyPhase;
  /** 0 = out of sight, 1 = at the cubicle. Only moves outside "waiting". */
  progress: number;
  /** Game minute of the next spawn. Only meaningful while "waiting". */
  nextSpawnAt: number;
};

/** A short banner for an encounter outcome -- cleared once `clock` passes `until`. */
export type Alert = { message: string; tone: "danger" | "safe"; until: number };

type GameState = {
  screen: Screen;
  modal: null | { challengeId: string };
  mode: Mode;
  /** Fresh per night, so the server can tell whether a challenge was answered. */
  runId: string;

  /** Everything drawn for tonight, in arrival order. */
  pack: PublicChallenge[];
  /** Still to arrive. */
  queue: QueuedEmail[];
  /** In the inbox now. */
  current: PublicChallenge[];
  /** Ids not yet opened. */
  unread: string[];

  /** Answered emails, in the order they were answered. */
  results: HandledEmail[];
  /** The same, keyed by challenge id, for quick lookup while rendering. */
  handled: Record<string, HandledEmail>;
  /** Purchased A.E.G.I.S. hints, kept so reopening an email does not re-charge. */
  hints: Record<string, HintReply>;
  /**
   * AI explanations already received, keyed by challenge id, so reopening a
   * handled email for review shows the same message without asking again.
   * The server caches by (challenge_id, action) too.
   */
  explanations: Record<string, AIReply>;

  integrity: number;
  power: number;
  /** Game minutes since midnight, 0..360. */
  clock: number;
  activeThreats: ActiveThreat[];

  /** Held closed, it blocks the Faceless Figure's arrival but drains power. */
  doorClosed: boolean;
  /** Watching the corridor camera slows the figure but also drains power. */
  cameraActive: boolean;
  enemy: Enemy;
  alert: Alert | null;

  ending: NightEnding | null;

  // --- actions ---
  startNight: (mode: Mode, challenges: PublicChallenge[]) => void;
  openEmail: (challengeId: string) => void;
  closeModal: () => void;
  /** Charges the hint cost once. Returns false when there is not enough power. */
  chargeHint: (challengeId: string, hint: HintReply) => boolean;
  canAffordHint: () => boolean;
  applyAnswer: (challenge: PublicChallenge, action: Action, result: AnswerResult) => void;
  setExplanation: (challengeId: string, reply: AIReply) => void;
  /** No-ops during a blackout: a powered defense that has failed can't be toggled back on. */
  toggleDoor: () => void;
  toggleCamera: () => void;
  endNight: (ending: NightEnding) => void;
  backToTitle: () => void;
  tick: (dt: number) => void;
};

function freshEnemy(): Enemy {
  return { phase: "waiting", progress: 0, nextSpawnAt: ENEMY_FIRST_SPAWN_GAME_MINUTES };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Fresh run id per night. The server keys attempts on it. */
function newRunId(): string {
  // crypto.randomUUID needs a secure context; dev over plain http on a LAN
  // address is not one, so keep a readable fallback.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useGame = create<GameState>((set, get) => ({
  screen: "title",
  modal: null,
  mode: "standard",
  runId: "",

  pack: [],
  queue: [],
  current: [],
  unread: [],

  results: [],
  handled: {},
  hints: {},
  explanations: {},

  integrity: BALANCE.standard.startingIntegrity,
  power: BALANCE.standard.startingPower,
  clock: 0,
  activeThreats: [],

  doorClosed: false,
  cameraActive: false,
  enemy: freshEnemy(),
  alert: null,

  ending: null,

  startNight: (mode, challenges) => {
    const balance = BALANCE[mode];
    const scheduled: QueuedEmail[] = challenges.map((challenge, index) => ({
      challenge,
      // Emails past the end of the schedule reuse the last slot rather than
      // never arriving, in case a pack is longer than the schedule.
      arrivesAt:
        ARRIVAL_SCHEDULE_GAME_MINUTES[index] ??
        ARRIVAL_SCHEDULE_GAME_MINUTES[ARRIVAL_SCHEDULE_GAME_MINUTES.length - 1],
    }));

    set({
      screen: "office",
      modal: null,
      mode,
      runId: newRunId(),
      pack: challenges,
      // The opening batch is whatever arrives at minute 0.
      current: scheduled.filter((q) => q.arrivesAt <= 0).map((q) => q.challenge),
      queue: scheduled.filter((q) => q.arrivesAt > 0),
      unread: challenges.map((c) => c.id),
      results: [],
      handled: {},
      hints: {},
      explanations: {},
      integrity: balance.startingIntegrity,
      power: balance.startingPower,
      clock: 0,
      activeThreats: [],
      doorClosed: false,
      cameraActive: false,
      enemy: freshEnemy(),
      alert: null,
      ending: null,
    });
  },

  openEmail: (challengeId) =>
    set((state) => ({
      modal: { challengeId },
      unread: state.unread.filter((id) => id !== challengeId),
    })),

  closeModal: () => set({ modal: null }),

  canAffordHint: () => {
    const { power, mode } = get();
    return power >= BALANCE[mode].aiHintPowerCost;
  },

  chargeHint: (challengeId, hint) => {
    const state = get();
    // Already bought: keep it, charge nothing.
    if (state.hints[challengeId]) return true;
    const cost = BALANCE[state.mode].aiHintPowerCost;
    if (state.power < cost) return false;
    set({
      power: clamp(state.power - cost, POWER_MIN, POWER_MAX),
      hints: { ...state.hints, [challengeId]: hint },
    });
    return true;
  },

  applyAnswer: (challenge, action, result) => {
    const state = get();
    // Exactly one final action per email (docs/game-design.md section 14).
    if (state.handled[challenge.id]) return;

    const effect = outcomeEffect(result.outcome, result.is_malicious);
    const entry: HandledEmail = {
      challenge,
      action,
      hintUsed: Boolean(state.hints[challenge.id]),
      result,
    };

    set({
      integrity: clamp(state.integrity + effect.integrityDelta, INTEGRITY_MIN, INTEGRITY_MAX),
      power: clamp(state.power + effect.powerDelta, POWER_MIN, POWER_MAX),
      results: [...state.results, entry],
      handled: { ...state.handled, [challenge.id]: entry },
      // The email stays visible in the inbox as a read, handled row; it is the
      // threat, not the message, that lingers.
      activeThreats: effect.leavesThreatActive
        ? [...state.activeThreats, { challengeId: challenge.id, since: state.clock }]
        : state.activeThreats,
    });
  },

  setExplanation: (challengeId, reply) =>
    set((state) => ({ explanations: { ...state.explanations, [challengeId]: reply } })),

  toggleDoor: () => {
    const state = get();
    if (state.power <= POWER_MIN) return;
    set({ doorClosed: !state.doorClosed });
  },

  toggleCamera: () => {
    const state = get();
    if (state.power <= POWER_MIN) return;
    set({ cameraActive: !state.cameraActive });
  },

  endNight: (ending) => set({ ending, screen: "results", modal: null }),

  backToTitle: () =>
    set({
      screen: "title",
      modal: null,
      ending: null,
      pack: [],
      queue: [],
      current: [],
      unread: [],
      results: [],
      handled: {},
      hints: {},
      explanations: {},
      activeThreats: [],
      doorClosed: false,
      cameraActive: false,
      enemy: freshEnemy(),
      alert: null,
      clock: 0,
    }),

  tick: (dt) => {
    const state = get();
    if (state.screen !== "office" || state.ending !== null) return;

    const balance = BALANCE[state.mode];
    // A decision should test reasoning, not reading speed, so time slows (or
    // stops) while the email modal is open.
    const timeScale = state.modal ? balance.modalTimeScale : 1;
    const elapsedGameMinutes = dt * gameMinutesPerRealSecond(state.mode) * timeScale;

    const clock = Math.min(state.clock + elapsedGameMinutes, NIGHT_LENGTH_GAME_MINUTES);

    // Deliver anything whose arrival time has passed.
    const arrived = state.queue.filter((q) => q.arrivesAt <= clock);
    const stillQueued = arrived.length > 0 ? state.queue.filter((q) => q.arrivesAt > clock) : state.queue;
    const current =
      arrived.length > 0 ? [...state.current, ...arrived.map((q) => q.challenge)] : state.current;

    // Each unresolved threat bleeds integrity until the night ends. Applied as
    // a fraction per frame so it is smooth rather than stepping once a minute.
    const drain =
      state.activeThreats.length * THREAT_INTEGRITY_PER_GAME_MINUTE * elapsedGameMinutes;
    let integrity = clamp(state.integrity - drain, INTEGRITY_MIN, INTEGRITY_MAX);

    // Power fails before it can go negative. At 0 it's a blackout: cameras,
    // AI help and the door all fail (docs/game-design.md section 3).
    const blackout = state.power <= POWER_MIN;
    let powerDrainPerMinute = PASSIVE_POWER_DRAIN_PER_GAME_MINUTE;
    if (state.doorClosed && !blackout) powerDrainPerMinute += DOOR_CLOSED_POWER_DRAIN_PER_GAME_MINUTE;
    if (state.cameraActive && !blackout) powerDrainPerMinute += CAMERA_POWER_DRAIN_PER_GAME_MINUTE;
    const power = clamp(state.power - powerDrainPerMinute * elapsedGameMinutes, POWER_MIN, POWER_MAX);

    // The Faceless Figure: waits off camera, walks the corridor, then either
    // breaches (door open or blackout) or is countered (door closed), and
    // withdraws either way to try again later.
    let enemy = state.enemy;
    let alert = state.alert;

    if (enemy.phase === "waiting" && clock >= enemy.nextSpawnAt) {
      enemy = { ...enemy, phase: "approaching", progress: 0 };
    }

    if (enemy.phase === "approaching") {
      const watched = state.cameraActive && !blackout;
      const speedMultiplier = blackout ? ENEMY_BLACKOUT_SPEEDUP : watched ? ENEMY_WATCHED_SLOWDOWN : 1;
      const progress = enemy.progress + ENEMY_ADVANCE_PER_GAME_MINUTE * speedMultiplier * elapsedGameMinutes;

      if (progress >= 1) {
        const countered = state.doorClosed && !blackout;
        if (countered) {
          alert = {
            message: "The closed door held. The figure withdrew.",
            tone: "safe",
            until: clock + ALERT_DURATION_GAME_MINUTES,
          };
        } else {
          integrity = clamp(integrity - ENEMY_ARRIVAL_INTEGRITY_LOSS, INTEGRITY_MIN, INTEGRITY_MAX);
          alert = {
            message: "A faceless figure reached the workstation.",
            tone: "danger",
            until: clock + ALERT_DURATION_GAME_MINUTES,
          };
        }
        enemy = { ...enemy, phase: "retreating", progress: 1 };
      } else {
        enemy = { ...enemy, progress };
      }
    } else if (enemy.phase === "retreating") {
      const progress = enemy.progress - ENEMY_RETREAT_PER_GAME_MINUTE * elapsedGameMinutes;
      enemy =
        progress <= 0
          ? { phase: "waiting", progress: 0, nextSpawnAt: clock + ENEMY_SPAWN_COOLDOWN_GAME_MINUTES }
          : { ...enemy, progress };
    }

    if (alert && clock >= alert.until) alert = null;

    const everyEmailHandled =
      state.pack.length > 0 && state.results.length >= state.pack.length;
    // Integrity is checked first: at zero the shift ends regardless of power
    // or the clock (docs/game-design.md section 14).
    const ending: NightEnding | null =
      integrity <= INTEGRITY_MIN
        ? "terminated"
        : clock >= NIGHT_LENGTH_GAME_MINUTES || everyEmailHandled
          ? "complete"
          : null;

    set({
      clock,
      current,
      queue: stillQueued,
      integrity,
      power,
      enemy,
      alert,
      ...(ending ? { ending, screen: "results" as Screen, modal: null } : {}),
    });
  },
}));

// ---- Selectors -------------------------------------------------------------

/** Whole minutes only, so the HUD re-renders about once a second, not 60 times. */
export const selectClockMinute = (state: GameState) => Math.floor(state.clock);
export const selectIntegrity = (state: GameState) => Math.round(state.integrity);
export const selectPower = (state: GameState) => Math.round(state.power);
/** True at 0 power: cameras, A.E.G.I.S. and the door all fail. */
export const selectBlackout = (state: GameState) => state.power <= POWER_MIN;

/** Every objective touched tonight, de-duplicated, for the results screen. */
export function collectObjectives(results: HandledEmail[]): Objective[] {
  const seen = new Map<string, Objective>();
  for (const entry of results) {
    for (const objective of entry.result.objectives) {
      if (!seen.has(objective.id)) seen.set(objective.id, objective);
    }
  }
  return [...seen.values()];
}
