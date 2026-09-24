import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { InMemoryMonumentRepository, type Monument } from "./repository";
import { InMemoryViewportMarkerRepository, listViewportMarkers } from "../map/viewport";
import { monumentToSearchDocument } from "../search/mapper";
import { searchCatalog } from "../search/query";
import { getCatalogMonument, listCatalogMonuments } from "./services";

const MONUMENT_COUNT = 10_000;

function createLoadDataset(): Monument[] {
  return Array.from({ length: MONUMENT_COUNT }, (_, index) => ({
    id: `load-${index.toString().padStart(5, "0")}`,
    slug: `monument-${index.toString().padStart(5, "0")}`,
    region: `region-${index % 10}`,
    latitude: 49 + (index % 500) / 100,
    longitude: 14 + (index % 800) / 100,
    isPublished: true,
    translations: [
      {
        locale: "pl" as const,
        name: `Historic landmark ${index.toString().padStart(5, "0")}`,
        description: "Deterministic load-test monument"
      }
    ]
  }));
}

describe("10,000-monument in-memory load harness", () => {
  it("keeps list, detail, search, and bounded map queries correct and bounded", async () => {
    const monuments = createLoadDataset();
    const repository = new InMemoryMonumentRepository(monuments);
    const documents = monuments.map(monumentToSearchDocument);

    const listStarted = performance.now();
    const page = await listCatalogMonuments(repository, { locale: "pl", page: 40, pageSize: 100 });
    const listMilliseconds = performance.now() - listStarted;

    const detailStarted = performance.now();
    const detail = await getCatalogMonument(repository, { locale: "pl", slug: "monument-05000" });
    const detailMilliseconds = performance.now() - detailStarted;

    const searchStarted = performance.now();
    const search = await searchCatalog(repository, documents, { locale: "pl", q: "historic landmark", pageSize: 50 });
    const searchMilliseconds = performance.now() - searchStarted;

    const mapStarted = performance.now();
    const markers = await listViewportMarkers(
      new InMemoryViewportMarkerRepository(monuments),
      { north: 53, south: 51, east: 22, west: 18 },
      500
    );
    const mapMilliseconds = performance.now() - mapStarted;

    expect(page.total).toBe(MONUMENT_COUNT);
    expect(page.items).toHaveLength(100);
    expect(page.items[0]?.slug).toBe("monument-03900");
    expect(detail?.translation.name).toBe("Historic landmark 05000");
    expect(search.total).toBe(MONUMENT_COUNT);
    expect(search.items).toHaveLength(50);
    expect(markers).toHaveLength(500);
    expect(markers.every((marker) => marker.latitude >= 51 && marker.latitude <= 53)).toBe(true);

    // Generous ceilings keep this deterministic local benchmark useful without
    // coupling it to a particular machine's absolute CPU speed.
    expect(listMilliseconds).toBeLessThan(2_000);
    expect(detailMilliseconds).toBeLessThan(250);
    expect(searchMilliseconds).toBeLessThan(2_000);
    expect(mapMilliseconds).toBeLessThan(2_000);
  });
});
