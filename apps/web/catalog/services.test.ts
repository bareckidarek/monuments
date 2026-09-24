import { describe, expect, it } from "vitest";
import { getCatalogMonument, listCatalogMonuments, streamCatalogMonuments } from "./services";
import { InMemoryMonumentRepository, type Monument } from "./repository";

const repository = new InMemoryMonumentRepository([
  {
    id: "1",
    slug: "alpha",
    region: "north",
    isPublished: true,
    translations: [{ locale: "pl", name: "Alfa" }, { locale: "en", name: "Alpha" }]
  },
  {
    id: "2",
    slug: "beta",
    region: "south",
    isPublished: true,
    translations: [{ locale: "pl", name: "Beta" }]
  },
  {
    id: "3",
    slug: "hidden",
    region: "north",
    isPublished: false,
    translations: [{ locale: "pl", name: "Ukryty" }]
  }
] satisfies Monument[]);

describe("catalog services", () => {
  it("applies bounded region filtering and locale fallback", async () => {
    const result = await listCatalogMonuments(repository, {
      locale: "en",
      region: " north ",
      pageSize: 1000
    });

    expect(result.items.map((item) => item.slug)).toEqual(["alpha"]);
    expect(result.items[0]?.translation.locale).toBe("en");
  });

  it("returns only published details and rejects blank slugs", async () => {
    expect((await getCatalogMonument(repository, { slug: " beta ", locale: "en" }))?.translation.name).toBe("Beta");
    expect(await getCatalogMonument(repository, { slug: "hidden", locale: "pl" })).toBeNull();
    expect(await getCatalogMonument(repository, { slug: " ", locale: "pl" })).toBeNull();
  });

  it("streams pages in stable repository order", async () => {
    const slugs: string[] = [];
    for await (const monument of streamCatalogMonuments(repository, { locale: "pl", pageSize: 1 })) {
      slugs.push(monument.slug);
    }
    expect(slugs).toEqual(["alpha", "beta"]);
  });
});
