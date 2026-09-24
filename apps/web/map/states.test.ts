import { describe, expect, it } from "vitest";
import { resolveMapViewState } from "./states";

describe("map view states", () => {
  it("prioritizes loading and exposes retryable failures", () => {
    expect(resolveMapViewState({ loading: true, markerCount: 0 })).toEqual({
      status: "loading",
      message: "Loading map markers"
    });
    expect(resolveMapViewState({ loading: false, markerCount: 0, error: new Error("offline") })).toMatchObject({
      status: "error",
      retryable: true
    });
  });

  it("handles empty viewports and compact layouts", () => {
    expect(resolveMapViewState({ loading: false, markerCount: 0 }).status).toBe("empty");
    expect(resolveMapViewState({ loading: false, markerCount: 2, viewportWidth: 375 })).toEqual({
      status: "ready",
      markerCount: 2,
      compact: true
    });
  });
});
