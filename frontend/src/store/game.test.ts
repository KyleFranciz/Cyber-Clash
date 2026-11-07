import { beforeEach, describe, expect, it } from "vitest";

import {
  BALANCE,
  DOOR_CLOSED_POWER_DRAIN_PER_GAME_MINUTE,
  ENEMY_ARRIVAL_INTEGRITY_LOSS,
  PASSIVE_POWER_DRAIN_PER_GAME_MINUTE,
} from "../balance";
import type { AnswerResult, PublicChallenge } from "../types";
import { useGame } from "./game";

function challenge(id: string): PublicChallenge {
  return {
    id,
    tier: 1,
    email: {
      from_name: "Operations",
      from_address: "ops@brightfield.example",
      reply_to: null,
      subject: `Message ${id}`,
      body: "Review this message.",
      links: [],
      attachments: [],
    },
    hint_basic: "Check the sender.",
  };
}

const reducedPhishing: AnswerResult = {
  challenge_id: "N1-EM-001",
  outcome: "reduced",
  is_best: false,
  acceptable: false,
  is_malicious: true,
  best_action: "report",
  feedback: "This threat was missed.",
  clues: [],
  objectives: [],
  explain_recommended: true,
};

beforeEach(() => {
  useGame.getState().startNight("standard", [
    challenge("N1-EM-001"),
    challenge("N1-EM-002"),
    challenge("N1-EM-003"),
    challenge("N1-EM-004"),
  ]);
});

describe("game store", () => {
  it("delivers scheduled messages while retaining the selected nightly draw", () => {
    const before = useGame.getState();
    expect(before.current.map((item) => item.id)).toEqual([
      "N1-EM-001",
      "N1-EM-002",
      "N1-EM-003",
    ]);
    expect(before.queue).toHaveLength(1);

    useGame.getState().tick(100);

    expect(useGame.getState().current.map((item) => item.id)).toEqual([
      "N1-EM-001",
      "N1-EM-002",
      "N1-EM-003",
      "N1-EM-004",
    ]);
    expect(useGame.getState().queue).toHaveLength(0);
  });

  it("charges a purchased hint only once when the email is reopened", () => {
    const game = useGame.getState();
    const hint = { text: "Inspect the domain.", stated_confidence: 0.8 };

    expect(game.chargeHint("N1-EM-001", hint)).toBe(true);
    expect(useGame.getState().power).toBe(BALANCE.standard.startingPower - BALANCE.standard.aiHintPowerCost);
    expect(useGame.getState().chargeHint("N1-EM-001", hint)).toBe(true);
    expect(useGame.getState().power).toBe(BALANCE.standard.startingPower - BALANCE.standard.aiHintPowerCost);
  });

  it("records one answer and makes a missed phishing threat drain integrity", () => {
    const game = useGame.getState();
    const email = game.current[0];

    game.applyAnswer(email, "no_action", reducedPhishing);
    game.applyAnswer(email, "report", reducedPhishing);
    expect(useGame.getState().results).toHaveLength(1);
    expect(useGame.getState().activeThreats).toHaveLength(1);

    const integrityAfterAnswer = useGame.getState().integrity;
    useGame.getState().tick(1);
    expect(useGame.getState().integrity).toBeLessThan(integrityAfterAnswer);
  });
});

describe("the Faceless Figure", () => {
  it("walks the corridor and breaches an open door, costing integrity", () => {
    // Standard mode runs 0.6 game minutes per real second (dt), so dt=50
    // advances the clock 30 minutes -- past the spawn at minute 25, leaving
    // the figure partway down the corridor.
    useGame.getState().tick(50);
    expect(useGame.getState().enemy.phase).toBe("approaching");
    expect(useGame.getState().enemy.progress).toBeGreaterThan(0);
    expect(useGame.getState().enemy.progress).toBeLessThan(1);

    const integrityBeforeArrival = useGame.getState().integrity;
    // Door is open by default: another 12 minutes (dt=20) finishes the walk.
    useGame.getState().tick(20);

    expect(useGame.getState().enemy.phase).toBe("retreating");
    expect(useGame.getState().integrity).toBe(integrityBeforeArrival - ENEMY_ARRIVAL_INTEGRITY_LOSS);
    expect(useGame.getState().alert?.tone).toBe("danger");
  });

  it("is countered by a closed door, at no integrity cost", () => {
    useGame.getState().toggleDoor();
    expect(useGame.getState().doorClosed).toBe(true);

    useGame.getState().tick(50);
    const integrityBeforeArrival = useGame.getState().integrity;
    useGame.getState().tick(20);

    expect(useGame.getState().enemy.phase).toBe("retreating");
    expect(useGame.getState().integrity).toBe(integrityBeforeArrival);
    expect(useGame.getState().alert?.tone).toBe("safe");
  });

  it("drains extra power while the door is held closed", () => {
    const startingPower = useGame.getState().power;
    useGame.getState().toggleDoor();
    useGame.getState().tick(10); // 6 game minutes

    const expectedDrain = (PASSIVE_POWER_DRAIN_PER_GAME_MINUTE + DOOR_CLOSED_POWER_DRAIN_PER_GAME_MINUTE) * 6;
    expect(useGame.getState().power).toBeCloseTo(startingPower - expectedDrain, 5);
  });

  it("will not toggle the door or camera during a blackout", () => {
    useGame.setState({ power: 0 });

    useGame.getState().toggleDoor();
    useGame.getState().toggleCamera();

    expect(useGame.getState().doorClosed).toBe(false);
    expect(useGame.getState().cameraActive).toBe(false);
  });
});
