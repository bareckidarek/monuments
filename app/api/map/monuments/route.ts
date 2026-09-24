import { NextResponse } from "next/server";
import { catalogRepository } from "../../../../apps/web/catalog/runtime-repository";
import { listViewportMarkers, MAX_MARKERS, type ViewportBounds } from "../../../../apps/web/map/viewport";

const numberParam = (value: string | null) => (value === null ? undefined : Number(value));

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bounds: Partial<ViewportBounds> = {
    north: numberParam(url.searchParams.get("north")),
    south: numberParam(url.searchParams.get("south")),
    east: numberParam(url.searchParams.get("east")),
    west: numberParam(url.searchParams.get("west"))
  };
  const requestedLimit = Number(url.searchParams.get("limit") ?? MAX_MARKERS);

  try {
    const markers = await listViewportMarkers(catalogRepository, bounds, requestedLimit);
    return NextResponse.json({ items: markers, total: markers.length });
  } catch (error) {
    console.error("Map viewport query failed", error);
    return NextResponse.json(
      { code: "INVALID_VIEWPORT", message: "The map viewport could not be loaded." },
      { status: 400 }
    );
  }
}
