import { describe, expect, it } from "vitest";
import { InMemoryMonumentRepository, type Monument } from "../catalog/repository";
import { monumentToSearchDocument } from "./mapper";
import { searchCatalog } from "./query";

const monuments: Monument[] = [
  {
    id: "1",
    slug: "zamek",
    region: "south",
    isPublished: true,
    translations: [{ locale: "pl", name: "Zamek południowy" }]
  },
  {
    id: "2",
    slug: "brama",
    region: "north",
    isPublished: true,
    translations: [{ locale: "pl", name: "Brama północna" }]
  },
  {
    id: "3",
    slug: "draft",
    region: "south",
    isPublished: false,
    translations: [{ locale: "pl", name: "Zamek roboczy" }]
  }
];

describe("catalog search", () => {
  it("uses indexed text, region filters, stable ordering, and published-only results", async () => {
    const repository = new InMemoryMonumentRepository(monuments);
    const documents = monuments.map(monumentToSearchDocument);
    const result = await searchCatalog(repository, documents, {
      q: "zamek",
      region: "south",
      locale: "pl"
    });

    expect(result.items.map((item) => item.slug)).toEqual(["zamek"]);
    expect(result.total).toBe(1);
  });
});
