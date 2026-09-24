import { describe, expect, it, vi } from "vitest";
import { createLeafletMapAdapter, type LeafletRuntime } from "./adapter";

describe("Leaflet map adapter", () => {
  it("keeps tile configuration and marker selection behind the adapter boundary", () => {
    const layers: unknown[] = [];
    const map = {
      setView: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getBounds: vi.fn(() => ({ getNorth: () => 53, getSouth: () => 51, getEast: () => 21, getWest: () => 19 })),
      invalidateSize: vi.fn(),
      latLngToContainerPoint: vi.fn(() => ({ x: 10, y: 20 })),
      remove: vi.fn(),
      removeLayer: vi.fn((layer) => layers.splice(layers.indexOf(layer), 1)),
      addLayer: vi.fn((layer) => layers.push(layer))
    };
    const leaflet: LeafletRuntime = {
      map: vi.fn(() => map),
      tileLayer: vi.fn((urlTemplate, options) => ({ urlTemplate, options })),
      latLngBounds: vi.fn(() => ({ getCenter: () => ({ lat: 52, lng: 20 }) })),
      marker: vi.fn((coordinate) => ({
        addTo: vi.fn(() => coordinate),
        bindTooltip: vi.fn(),
        on: vi.fn()
      }))
    };
    const selected = vi.fn();
    const adapter = createLeafletMapAdapter({} as HTMLElement, leaflet, {
      urlTemplate: "https://tiles.example/{z}/{x}/{y}.png",
      attribution: "© Example"
    });

    adapter.setViewport({ north: 53, south: 51, east: 21, west: 19 });
    adapter.setMarkers([{ id: "1", slug: "castle", label: "Castle", latitude: 52, longitude: 20 }], selected);

    expect(leaflet.tileLayer).toHaveBeenCalledWith(
      "https://tiles.example/{z}/{x}/{y}.png",
      expect.objectContaining({ attribution: "© Example" })
    );
    expect(map.setView).toHaveBeenCalledWith([52, 20]);
    expect(leaflet.marker).toHaveBeenCalledWith([52, 20]);
    adapter.project({ latitude: 52, longitude: 20 });
    adapter.invalidateSize();
    expect(map.invalidateSize).toHaveBeenCalled();
    adapter.destroy();
    expect(map.remove).toHaveBeenCalled();
  });
});
