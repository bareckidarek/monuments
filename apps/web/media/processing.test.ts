import { describe, expect, it } from "vitest";
import { canTransition, processStoredImage, transitionProcessingStatus } from "./processing";

describe("image processing status", () => {
  it("allows retryable status transitions and rejects terminal regressions", () => {
    expect(canTransition("pending", "processing")).toBe(true);
    expect(transitionProcessingStatus("failed", "pending")).toBe("pending");
    expect(() => transitionProcessingStatus("ready", "processing")).toThrow();
  });

  it("marks successful processing ready and failures failed", async () => {
    const statuses: string[] = [];
    const storage = { get: async () => Buffer.from("image") };
    await expect(processStoredImage(storage, "photo", async (status) => { statuses.push(status); }, async () => undefined)).resolves.toBe("ready");
    await expect(processStoredImage(storage, "photo", async (status) => { statuses.push(status); }, async () => { throw new Error("bad thumbnail"); })).resolves.toBe("failed");
    expect(statuses).toEqual(["processing", "ready", "processing", "failed"]);
  });
});
