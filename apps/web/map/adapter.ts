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

export type MapPoint = { x: number; y: number };

export type MapAdapter = {
  setViewport(viewport: MapViewport): void;
  setMarkers(markers: readonly MapMarker[], onSelect: (marker: MapMarker) => void): void;
  onViewportChange(handler: (viewport: MapViewport) => void): () => void;
  project(coordinate: MapCoordinate): MapPoint;
  invalidateSize(): void;
  destroy(): void;
};

export type LeafletMap = {
  setView(center: [number, number], zoom?: number): void;
  on(event: "moveend", handler: () => void): void;
  off(event: "moveend", handler: () => void): void;
  getBounds(): {
    getNorth(): number;
    getSouth(): number;
    getEast(): number;
    getWest(): number;
  };
  invalidateSize(): void;
  latLngToContainerPoint(coordinate: [number, number]): MapPoint;
  remove(): void;
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
      map.setView([center.lat, center.lng], 6);
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
    onViewportChange(handler) {
      const onMoveEnd = () => {
        const bounds = map.getBounds();
        handler({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });
      };
      map.on("moveend", onMoveEnd);
      return () => map.off("moveend", onMoveEnd);
    },
    project(coordinate) {
      return map.latLngToContainerPoint([coordinate.latitude, coordinate.longitude]);
    },
    invalidateSize() {
      map.invalidateSize();
    },
    destroy() {
      map.remove();
    }
  };
}
