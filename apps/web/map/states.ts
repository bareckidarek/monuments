export type MapViewState =
  | { status: "loading"; message: string }
  | { status: "ready"; markerCount: number; compact: boolean }
  | { status: "empty"; message: string }
  | { status: "error"; message: string; retryable: boolean };

export function resolveMapViewState(input: {
  loading: boolean;
  markerCount: number;
  error?: unknown;
  viewportWidth?: number;
}): MapViewState {
  if (input.loading) return { status: "loading", message: "Loading map markers" };
  if (input.error) return { status: "error", message: "Map data is temporarily unavailable", retryable: true };
  if (input.markerCount === 0) return { status: "empty", message: "No published monuments in this area" };
  return {
    status: "ready",
    markerCount: input.markerCount,
    compact: input.viewportWidth !== undefined && input.viewportWidth < 640
  };
}
