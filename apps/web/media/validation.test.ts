import { describe, expect, it } from "vitest";
import { validateImageBoundary } from "./validation";

const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

describe("image boundary validation", () => {
  it("accepts a supported image with matching content and localized alt text", () => {
    expect(validateImageBoundary({
      mimeType: "image/png", byteSize: 100, width: 800, height: 600, bytes: png, altTextPl: "Pomnik"
    })).toEqual([]);
  });

  it("rejects unsupported, oversized, malformed, and inaccessible images", () => {
    const errors = validateImageBoundary({
      mimeType: "application/pdf", byteSize: 11, width: 0, height: 12, bytes: Uint8Array.of(1), altTextPl: ""
    }, { maxBytes: 10 });
    expect(errors.map((error) => error.code)).toEqual(["mime", "size", "dimensions", "alt-text"]);
  });

  it("rejects bytes that do not match the declared MIME type", () => {
    expect(validateImageBoundary({
      mimeType: "image/png", byteSize: 20, width: 2, height: 2, bytes: Uint8Array.of(1), altTextEn: "Monument"
    }).some((error) => error.code === "content")).toBe(true);
  });
});
