import { describe, expect, it } from "vitest";
import type { Monument } from "../catalog/repository";
import { InMemoryViewportMarkerRepository, listViewportMarkers, validateViewport } from "./viewport";

const monuments: Monument[] = [
  { id: "1", slug: "inside", latitude: 52, longitude: 20, isPublished: true, translations: [{ locale: "pl", name: "Inside" }] },
  { id: "2", slug: "hidden", latitude: 52, longitude: 20, isPublished: false, translations: [{ locale: "pl", name: "Hidden" }] },
  { id: "3", slug: "no-location", isPublished: true, translations: [{ locale: "pl", name: "No location" }] }
];

describe("bounded viewport marker queries", () => {
  it("rejects unbounded, malformed, and over-limit requests", async () => {
    expect(() => validateViewport({ north: 50 })).toThrow();
    expect(() => validateViewport({ north: 40, south: 50, east: 20, west: 10 })).toThrow();
    await expect(listViewportMarkers(new InMemoryViewportMarkerRepository(monuments), { north: 53, south: 51, east: 21, west: 19 }, 501)).rejects.toThrow();
  });

  it("returns only published records with coordinates and marker-safe fields", async () => {
    const markers = await listViewportMarkers(
      new InMemoryViewportMarkerRepository(monuments),
      { north: 53, south: 51, east: 21, west: 19 }
    );
    expect(markers).toEqual([{ id: "1", slug: "inside", label: "Inside", latitude: 52, longitude: 20 }]);
    expect(markers[0]).not.toHaveProperty("translations");
  });

  it("honors the maximum result limit", async () => {
    const many = Array.from({ length: 3 }, (_, index) => ({
      id: String(index),
      slug: `monument-${index}`,
      latitude: 52,
      longitude: 20,
      isPublished: true,
      translations: [{ locale: "pl" as const, name: `Monument ${index}` }]
    }));
    const markers = await listViewportMarkers(new InMemoryViewportMarkerRepository(many), { north: 53, south: 51, east: 21, west: 19 }, 2);
    expect(markers).toHaveLength(2);
  });
});
