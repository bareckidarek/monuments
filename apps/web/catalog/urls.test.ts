import { describe, expect, it } from "vitest";
import { assertPublishedSlugChangeRequiresAlias, canonicalCatalogPath, canonicalMonumentPath, createUniqueSlug } from "./urls";

describe("catalog URLs", () => {
  it("creates stable, unique slugs from localized names", () => {
    expect(createUniqueSlug("Łódź — pałac", [])).toBe("lodz-palac");
    expect(createUniqueSlug("Łódź — pałac", ["lodz-palac", "lodz-palac-2"])).toBe("lodz-palac-3");
  });

  it("builds the canonical detail path without changing the stored slug", () => {
    expect(canonicalCatalogPath()).toBe("/catalog");
    expect(canonicalMonumentPath({ slug: "zamek-na-wawelu" })).toBe("/catalog/zamek-na-wawelu");
    expect(canonicalMonumentPath({ slug: "a monument" })).toBe("/catalog/a%20monument");
  });

  it("requires an alias when a published slug changes", () => {
    expect(() =>
      assertPublishedSlugChangeRequiresAlias({
        isPublished: true,
        currentSlug: "old-name",
        nextSlug: "new-name",
        hasAlias: false
      })
    ).toThrow("alias or redirect");

    expect(() =>
      assertPublishedSlugChangeRequiresAlias({
        isPublished: true,
        currentSlug: "old-name",
        nextSlug: "new-name",
        hasAlias: true
      })
    ).not.toThrow();
  });
});
