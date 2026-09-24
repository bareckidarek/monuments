export type MapCoordinate = { latitude: number; longitude: number };

export type MapMarker = MapCoordinate & {
  id: string;
  slug: string;
  label: string;
};

export type MapViewport = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapTileLayerConfig = {
  urlTemplate: string;
  attribution: string;
  maxZoom?: number;
};

export type MapAdapter = {
  setViewport(viewport: MapViewport): void;
  setMarkers(markers: readonly MapMarker[], onSelect: (marker: MapMarker) => void): void;
  destroy(): void;
};

export type LeafletMap = {
  setView(center: [number, number], zoom?: number): void;
  remove(): void;
  eachLayer(callback: (layer: unknown) => void): void;
  removeLayer(layer: unknown): void;
  addLayer(layer: unknown): void;
};

export type LeafletRuntime = {
  map(container: HTMLElement): LeafletMap;
  tileLayer(urlTemplate: string, options: { attribution: string; maxZoom?: number }): unknown;
  marker(coordinate: [number, number]): {
    addTo(map: LeafletMap): unknown;
    bindTooltip(label: string): unknown;
    on(event: "click", handler: () => void): unknown;
  };
  latLngBounds(corners: [[number, number], [number, number]]): { getCenter(): { lat: number; lng: number } };
};

export function createLeafletMapAdapter(
  container: HTMLElement,
  leaflet: LeafletRuntime,
  tiles: MapTileLayerConfig
): MapAdapter {
  const map = leaflet.map(container);
  const tileLayer = leaflet.tileLayer(tiles.urlTemplate, {
    attribution: tiles.attribution,
    maxZoom: tiles.maxZoom
  });
  map.addLayer(tileLayer);
  let markers: unknown[] = [];

  return {
    setViewport(viewport) {
      const bounds = leaflet.latLngBounds([
        [viewport.south, viewport.west],
        [viewport.north, viewport.east]
      ]);
      const center = bounds.getCenter();
      map.setView([center.lat, center.lng]);
    },
    setMarkers(nextMarkers, onSelect) {
      for (const marker of markers) map.removeLayer(marker);
      markers = nextMarkers.map((item) => {
        const marker = leaflet.marker([item.latitude, item.longitude]);
        marker.bindTooltip(item.label);
        marker.on("click", () => onSelect(item));
        marker.addTo(map);
        return marker;
      });
    },
    destroy() {
      map.remove();
    }
  };
}
