import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { postAnswer, postExplain, getChallenges } from "./client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("window", { location: { origin: "http://test.local" } });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("API client", () => {
  it("requests a repeatable public challenge draw", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ night: 1, mode: "standard", challenges: [] }), { status: 200 }),
    );

    await getChallenges(1, "standard", 6, "night-one");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/challenges?night=1&mode=standard&count=6&seed=night-one",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
  });

  it("sends the answer body the server contract requires", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ outcome: "full" }), { status: 200 }));

    await postAnswer("run-1", "N1-EM-001", "report", true);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/answer",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          run_id: "run-1",
          challenge_id: "N1-EM-001",
          action: "report",
          hint_used: true,
        }),
      }),
    );
  });

  it("preserves a server refusal instead of inventing an explanation", async () => {
    fetchMock.mockResolvedValue(new Response("No attempt recorded", { status: 409 }));

    await expect(postExplain("run-1", "N1-EM-001", "report")).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      path: "/api/explain",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps a network outage as an error instead of substituting a local answer", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(postAnswer("run-1", "N1-EM-001", "report", false)).rejects.toThrow(
      "Failed to fetch",
    );
  });
});
