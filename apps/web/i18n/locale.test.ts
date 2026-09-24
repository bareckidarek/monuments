import { describe, expect, it } from "vitest";
import { resolveLocale } from "./locale";

describe("resolveLocale", () => {
  it("defaults unsupported and missing values to Polish", () => {
    expect(resolveLocale()).toBe("pl");
    expect(resolveLocale("de")).toBe("pl");
  });

  it("accepts English language tags", () => {
    expect(resolveLocale("en-US")).toBe("en");
  });
});
