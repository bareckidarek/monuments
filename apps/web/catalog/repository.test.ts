import { describe, expect, it } from "vitest";
import { InMemoryMonumentRepository, type Monument } from "./repository";

const monuments: Monument[] = [
  {
    id: "2",
    slug: "zabytek-b",
    region: "north",
    isPublished: true,
    translations: [{ locale: "pl", name: "Zabytek B" }]
  },
  {
    id: "1",
    slug: "zabytek-a",
    region: "south",
    isPublished: true,
    translations: [
      { locale: "pl", name: "Zabytek A" },
      { locale: "en", name: "Monument A" }
    ]
  },
  {
    id: "3",
    slug: "ukryty",
    isPublished: false,
    translations: [{ locale: "pl", name: "Ukryty" }]
  }
];

describe("InMemoryMonumentRepository", () => {
  const repository = new InMemoryMonumentRepository(monuments);

  it("filters unpublished records, sorts by slug, and bounds pagination", async () => {
    const page = await repository.listPublished({ page: 0, pageSize: 500, locale: "pl" });
    expect(page.items.map((item) => item.slug)).toEqual(["zabytek-a", "zabytek-b"]);
    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(100);
    expect(page.total).toBe(2);
  });

  it("falls back to Polish when English is unavailable", async () => {
    const monument = await repository.findPublishedBySlug({ slug: "zabytek-b", locale: "en" });
    expect(monument?.translation.name).toBe("Zabytek B");
  });

  it("does not return unpublished or missing slugs", async () => {
    expect(await repository.findPublishedBySlug({ slug: "ukryty", locale: "pl" })).toBeNull();
    expect(await repository.findPublishedBySlug({ slug: "missing", locale: "pl" })).toBeNull();
  });
});
