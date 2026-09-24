import { describe, expect, it } from "vitest";
import { InMemoryMonumentRepository } from "./repository";
import { PostgresMonumentRepository } from "../db/postgres-repository";
import { catalogRepository, createCatalogRepository } from "./runtime-repository";

describe("runtime catalog source", () => {
  it("provides published demo records with Polish fallback", async () => {
    const page = await catalogRepository.listPublished({ page: 1, pageSize: 20, locale: "en" });
    expect(page.total).toBe(2);
    expect(page.items.find((item) => item.slug === "zamek-na-wawelu")?.translations[0]?.name).toBe("Zamek na Wawelu");
  });

  it("uses the configured PostgreSQL repository without connecting during selection", () => {
    const pool = { query: async () => ({ rows: [] }) } as never;
    const repository = createCatalogRepository({
      databaseUrl: "postgres://configured.example/monuments",
      createPool: () => pool
    });
    expect(repository).toBeInstanceOf(PostgresMonumentRepository);
  });

  it("uses the explicit demo repository when no database URL is configured", () => {
    expect(createCatalogRepository({ databaseUrl: "" })).toBeInstanceOf(InMemoryMonumentRepository);
  });
});
