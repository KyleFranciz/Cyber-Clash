/**
 * EVERY game number lives here (AGENTS.md rule 5). Content files store no
 * numbers -- they say "full" or "reduced" and this file decides what that
 * costs. Values come from docs/frontend-spec.md (Balance) and
 * docs/game-design.md sections 6.7 and 8. All of it is tunable: change this
 * file, nothing else.
 */

import type { Mode, Outcome } from "./types";

/** Midnight to 6:00 AM. The clock counts game minutes 0..360. */
export const NIGHT_LENGTH_GAME_MINUTES = 360;

export const EMAILS_PER_NIGHT = 6;

/**
 * When each email lands, in game minutes. First three at the start of the
 * shift, then one at 1:00, 2:00 and 3:00 AM.
 */
export const ARRIVAL_SCHEDULE_GAME_MINUTES = [0, 0, 0, 60, 120, 180];

export const INTEGRITY_MIN = 0;
export const INTEGRITY_MAX = 100;
export const POWER_MIN = 0;
export const POWER_MAX = 100;

/** Full outcome on a phishing email: threat neutralised, small recovery. */
export const FULL_PHISHING_INTEGRITY_GAIN = 5;

/** Reduced outcome on a legitimate email: false alarm, wasted time. */
export const REDUCED_LEGIT_POWER_COST = 3;

/**
 * Reduced outcome on a phishing email: the threat stays active and bleeds
 * integrity until the night ends. 1 integrity per 15 game minutes.
 */
export const THREAT_INTEGRITY_PER_GAME_MINUTE = 1 / 15;

/**
 * Longest frame the game loop will act on, in real seconds. A backgrounded
 * tab can hand us a multi-second delta; without this clamp the clock would
 * jump and drains would land all at once.
 */
export const MAX_FRAME_SECONDS = 0.1;

export type ModeBalance = {
  /** How long the whole night takes in real minutes. */
  nightLengthRealMinutes: number;
  /** Power charged for the A.E.G.I.S. hint, once per email. */
  aiHintPowerCost: number;
  startingPower: number;
  startingIntegrity: number;
  /**
   * How fast time runs while a modal is open. docs/frontend-spec.md proposes
   * pausing outright; docs/game-design.md section 8 says Standard slows to
   * 0.25x. Expressed as a dial so either reading is one edit away.
   */
  modalTimeScale: number;
};

export const BALANCE: Record<Mode, ModeBalance> = {
  guided: {
    nightLengthRealMinutes: 7,
    aiHintPowerCost: 3,
    startingPower: 100,
    startingIntegrity: 100,
    modalTimeScale: 0,
  },
  standard: {
    nightLengthRealMinutes: 10,
    aiHintPowerCost: 6,
    startingPower: 85,
    startingIntegrity: 100,
    modalTimeScale: 0.25,
  },
  challenge: {
    nightLengthRealMinutes: 10,
    aiHintPowerCost: 10,
    startingPower: 70,
    startingIntegrity: 100,
    modalTimeScale: 0.25,
  },
};

/** Game minutes that pass per real second of play, before any modal slowdown. */
export function gameMinutesPerRealSecond(mode: Mode): number {
  return NIGHT_LENGTH_GAME_MINUTES / (BALANCE[mode].nightLengthRealMinutes * 60);
}

/** Security Integrity bands from docs/game-design.md section 3. */
export const INTEGRITY_BANDS = [
  { min: 71, label: "SECURE", tone: "secure" },
  { min: 41, label: "EXPOSED", tone: "exposed" },
  { min: 1, label: "BREACHED", tone: "breached" },
  { min: 0, label: "COMPROMISED", tone: "compromised" },
] as const;

export type IntegrityTone = (typeof INTEGRITY_BANDS)[number]["tone"];

export function integrityBand(integrity: number): (typeof INTEGRITY_BANDS)[number] {
  // Bands are ordered high to low, so the first match is the right one.
  return INTEGRITY_BANDS.find((band) => integrity >= band.min) ?? INTEGRITY_BANDS[3];
}

/**
 * The one place an outcome becomes game numbers. Returns the immediate
 * deltas; a lingering threat is handled by the store's tick, not here.
 */
export type OutcomeEffect = {
  integrityDelta: number;
  powerDelta: number;
  /** true => register an active threat that drains integrity over time. */
  leavesThreatActive: boolean;
};

export function outcomeEffect(outcome: Outcome, isMalicious: boolean): OutcomeEffect {
  if (isMalicious) {
    return outcome === "full"
      ? { integrityDelta: FULL_PHISHING_INTEGRITY_GAIN, powerDelta: 0, leavesThreatActive: false }
      : { integrityDelta: 0, powerDelta: 0, leavesThreatActive: true };
  }
  return outcome === "full"
    ? { integrityDelta: 0, powerDelta: 0, leavesThreatActive: false }
    : { integrityDelta: 0, powerDelta: -REDUCED_LEGIT_POWER_COST, leavesThreatActive: false };
}
