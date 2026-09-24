import { describe, expect, it } from "vitest";
import { monumentIndexSettings, monumentToSearchDocument } from "./mapper";

describe("monument search mapping", () => {
  it("keeps stable IDs and maps every localized field without falling back across locales", () => {
    const document = monumentToSearchDocument({
      id: "db-id",
      externalId: "legacy-42",
      slug: "zamek",
      region: "south",
      latitude: 50,
      longitude: 20,
      isPublished: true,
      translations: [
        { locale: "pl", name: "Zamek", description: "Opis PL", address: "Rynek", regionLabel: "Południe" },
        { locale: "en", name: "Castle", address: "Market Square" }
      ]
    });
    expect(document.id).toBe("db-id");
    expect(document.externalId).toBe("legacy-42");
    expect(document.names).toEqual({ pl: "Zamek", en: "Castle" });
    expect(document.descriptions).toEqual({ pl: "Opis PL", en: null });
    expect(document.addresses).toEqual({ pl: "Rynek", en: "Market Square" });
    expect(document.regionLabels).toEqual({ pl: "Południe", en: null });
    expect(document.searchableText).toContain("Castle");
  });

  it("declares deterministic search, filter, sort, and display boundaries", () => {
    expect(monumentIndexSettings.searchableAttributes).toContain("names.pl");
    expect(monumentIndexSettings.filterableAttributes).toContain("region");
    expect(monumentIndexSettings.sortableAttributes).toContain("slug");
    expect(monumentIndexSettings.displayedAttributes).not.toContain("searchableText");
  });
});
