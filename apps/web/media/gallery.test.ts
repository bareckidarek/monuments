import { describe, expect, it } from "vitest";
import { localizedImageText } from "./gallery";

describe("accessible gallery metadata", () => {
  it("falls back to Polish metadata when English is unavailable", () => {
    expect(localizedImageText({
      id: "1",
      url: "/image.jpg",
      altTextPl: "Widok zabytku",
      captionPl: "Fasada"
    }, "en")).toEqual({ alt: "Widok zabytku", caption: "Fasada" });
  });

  it("provides a safe alt fallback", () => {
    expect(localizedImageText({ id: "1", url: "/image.jpg" }, "pl").alt).toBe("Monument image");
  });
});
