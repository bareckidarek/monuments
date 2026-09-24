import { describe, expect, it } from "vitest";

const browserCheckStatus = {
  executed: false,
  reason: "agent-browser executable unavailable in the configured environment"
} as const;

describe("browser integration check status", () => {
  it("records why browser evidence is unavailable without inventing evidence", () => {
    expect(browserCheckStatus.executed).toBe(false);
    expect(browserCheckStatus.reason).toContain("agent-browser executable unavailable");
  });
});

