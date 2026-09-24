import type { Monument } from "../catalog/repository";

export type ViewportBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapMarker = {
  id: string;
  slug: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type ViewportMarkerRepository = {
  listMarkersInViewport(bounds: ViewportBounds, limit: number): Promise<MapMarker[]>;
};

export const MAX_MARKERS = 500;

export function validateViewport(input: Partial<ViewportBounds>): ViewportBounds {
  const values = [input.north, input.south, input.east, input.west];
  if (values.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error("Viewport bounds must be finite numbers");
  }
  const bounds = input as ViewportBounds;
  if (
    bounds.south < -90 ||
    bounds.north > 90 ||
    bounds.west < -180 ||
    bounds.east > 180 ||
    bounds.south >= bounds.north ||
    bounds.west >= bounds.east
  ) {
    throw new Error("Viewport bounds are invalid");
  }
  return bounds;
}

export async function listViewportMarkers(
  repository: ViewportMarkerRepository,
  input: Partial<ViewportBounds>,
  limit = MAX_MARKERS
): Promise<MapMarker[]> {
  const bounds = validateViewport(input);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_MARKERS) {
    throw new Error(`Marker limit must be an integer between 1 and ${MAX_MARKERS}`);
  }
  return repository.listMarkersInViewport(bounds, limit);
}

export class InMemoryViewportMarkerRepository implements ViewportMarkerRepository {
  constructor(private readonly monuments: Monument[]) {}

  async listMarkersInViewport(bounds: ViewportBounds, limit: number): Promise<MapMarker[]> {
    return this.monuments
      .filter((monument) => monument.isPublished)
      .filter(
        (monument): monument is Monument & { latitude: number; longitude: number } =>
          typeof monument.latitude === "number" && typeof monument.longitude === "number"
      )
      .filter(
        (monument) =>
          monument.latitude >= bounds.south &&
          monument.latitude <= bounds.north &&
          monument.longitude >= bounds.west &&
          monument.longitude <= bounds.east
      )
      .sort((left, right) => left.slug.localeCompare(right.slug))
      .slice(0, limit)
      .map((monument) => ({
        id: monument.id,
        slug: monument.slug,
        label: monument.translations.find((translation) => translation.locale === "pl")?.name ?? monument.slug,
        latitude: monument.latitude,
        longitude: monument.longitude
      }));
  }
}
