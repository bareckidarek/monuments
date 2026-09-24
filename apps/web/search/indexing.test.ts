import { describe, expect, it } from "vitest";
import type { Monument } from "../catalog/repository";
import { indexAfterImport, InMemorySearchIndex, rebuildSearchIndex } from "./indexing";

const monument = (id: string, name: string, isPublished = true): Monument & { externalId: string } => ({
  id,
  externalId: `source-${id}`,
  slug: `monument-${id}`,
  region: "north",
  isPublished,
  translations: [{ locale: "pl", name }]
});

describe("search indexing commands", () => {
  it("indexes published imports idempotently and keeps unpublished records out", async () => {
    const index = new InMemorySearchIndex();
    const records = [monument("1", "First"), monument("2", "Draft", false)];
    expect(await indexAfterImport(index, records)).toEqual({ indexedCount: 1 });
    expect(await indexAfterImport(index, records)).toEqual({ indexedCount: 1 });
    expect(index.documents.size).toBe(1);
    expect(index.documents.get("1")?.names.pl).toBe("First");
  });

  it("rebuilds only the derived index and removes stale documents", async () => {
    const index = new InMemorySearchIndex();
    await indexAfterImport(index, [monument("stale", "Stale")]);
    const source = { listAll: async () => [monument("fresh", "Fresh")] };
    expect(await rebuildSearchIndex(index, source)).toEqual({ indexedCount: 1 });
    expect([...index.documents.keys()]).toEqual(["fresh"]);
    expect(index.operations).toEqual([
      "configure:monuments",
      "upsert:monuments:1",
      "configure:monuments",
      "clear:monuments",
      "configure:monuments",
      "upsert:monuments:1"
    ]);
  });

  it("does not clear existing documents when indexing an imported batch", async () => {
    const index = new InMemorySearchIndex();
    await indexAfterImport(index, [monument("1", "One")]);
    await indexAfterImport(index, [monument("2", "Two")]);
    expect([...index.documents.keys()]).toEqual(["1", "2"]);
    expect(index.operations).not.toContain("clear:monuments");
  });
});
