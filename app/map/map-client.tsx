"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createLeafletMapAdapter,
  type LeafletRuntime,
  type MapAdapter,
  type MapMarker,
  type MapViewport
} from "../../apps/web/map/adapter";
import { resolveMapViewState } from "../../apps/web/map/states";
import "./map.css";

const INITIAL_VIEWPORT: MapViewport = { north: 55, south: 48, east: 24, west: 12 };
const TILE_CONFIG = {
  urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
  maxZoom: 19
};

type Connection = { marker: MapMarker };

export default function MapClient() {
  const mapElement = useRef<HTMLDivElement>(null);
  const pageElement = useRef<HTMLElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeMarker, setActiveMarker] = useState<MapMarker | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [line, setLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const updateConnectionRef = useRef<() => void>(() => {});
  const requestRef = useRef<AbortController | null>(null);

  const loadMarkers = useCallback(async (viewport: MapViewport) => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(Object.entries(viewport).map(([key, value]) => [key, String(value)]));
    try {
      const response = await fetch(`/api/map/monuments?${params.toString()}`, { signal: request.signal });
      if (!response.ok) throw new Error("Map marker request failed");
      const result = (await response.json()) as { items: MapMarker[] };
      if (request.signal.aborted) return;
      setMarkers(result.items);
      adapterRef.current?.setMarkers(result.items, setActiveMarker);
    } catch (cause) {
      if (request.signal.aborted) return;
      setError(cause instanceof Error ? cause : new Error("Map marker request failed"));
      setMarkers([]);
      adapterRef.current?.setMarkers([], setActiveMarker);
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let unsubscribe = () => {};
    void import("leaflet").then(({ default: leaflet }) => {
      if (disposed || !mapElement.current) return;
      const runtime = leaflet as unknown as LeafletRuntime;
      const adapter = createLeafletMapAdapter(mapElement.current, runtime, TILE_CONFIG);
      adapterRef.current = adapter;
      adapter.setViewport(INITIAL_VIEWPORT);
      unsubscribe = adapter.onViewportChange((viewport) => {
        void loadMarkers(viewport);
        window.requestAnimationFrame(() => updateConnectionRef.current());
      });
      adapter.invalidateSize();
      void loadMarkers(INITIAL_VIEWPORT);
    });
    return () => {
      disposed = true;
      unsubscribe();
      requestRef.current?.abort();
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, [loadMarkers]);

  const updateConnection = useCallback(() => {
    if (!connection || !adapterRef.current || !pageElement.current) {
      setLine(null);
      return;
    }
    const card = pageElement.current.querySelector(`[data-marker-id="${connection.marker.id}"]`);
    const map = mapElement.current;
    if (!card || !map) {
      setLine(null);
      return;
    }
    const pageRect = pageElement.current.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const point = adapterRef.current.project(connection.marker);
    setLine({
      x1: cardRect.left - pageRect.left + cardRect.width / 2,
      y1: cardRect.top - pageRect.top,
      x2: mapRect.left - pageRect.left + point.x,
      y2: mapRect.top - pageRect.top + point.y
    });
  }, [connection]);
  updateConnectionRef.current = updateConnection;

  useEffect(() => {
    updateConnection();
    window.addEventListener("resize", updateConnection);
    return () => window.removeEventListener("resize", updateConnection);
  }, [updateConnection, markers]);

  const viewState = resolveMapViewState({
    loading,
    markerCount: markers.length,
    error,
    viewportWidth: typeof window === "undefined" ? undefined : window.innerWidth
  });

  return (
    <main ref={pageElement} className="map-page">
      <header className="map-header">
        <Link href="/catalog?locale=pl">← Katalog</Link>
        <h1>Mapa zabytków</h1>
        <p>Przeglądaj zabytki i wybierz obiekt z mapy lub dolnego paska.</p>
      </header>
      <div ref={mapElement} className="map-canvas" aria-label="Interaktywna mapa zabytków" />
      <svg className="map-connections" aria-hidden="true">
        {line && <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />}
      </svg>
      <section className={`map-status map-status-${viewState.status}`} aria-live="polite">
        {viewState.status === "loading" && <p>Ładowanie zabytków…</p>}
        {viewState.status === "empty" && <p>Brak opublikowanych zabytków w tym obszarze.</p>}
        {viewState.status === "error" && (
          <>
            <p>Nie udało się załadować zabytków.</p>
            <button type="button" onClick={() => void loadMarkers(INITIAL_VIEWPORT)}>Spróbuj ponownie</button>
          </>
        )}
      </section>
      <nav className="map-strip" aria-label="Zabytki na mapie">
        {markers.map((marker) => (
          <Link
            className={`map-card${activeMarker?.id === marker.id ? " map-card-active" : ""}`}
            data-marker-id={marker.id}
            href={`/catalog/${marker.slug}?locale=pl`}
            key={marker.id}
            onMouseEnter={() => {
              setActiveMarker(marker);
              setConnection({ marker });
            }}
            onMouseLeave={() => {
              setActiveMarker((current) => (current?.id === marker.id ? null : current));
              setConnection((current) => (current?.marker.id === marker.id ? null : current));
            }}
            onFocus={() => {
              setActiveMarker(marker);
              setConnection({ marker });
            }}
            onBlur={() => setConnection((current) => (current?.marker.id === marker.id ? null : current))}
          >
            <span>{marker.label}</span>
          </Link>
        ))}
      </nav>
      <p className="map-attribution">© OpenStreetMap contributors</p>
    </main>
  );
}
