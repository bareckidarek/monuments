import type { Metadata } from "next";
import MapClient from "./map-client";

export const metadata: Metadata = {
  title: "Mapa zabytków | Monuments",
  description: "Przeglądaj zabytki na interaktywnej mapie."
};

export default function MapPage() {
  return <MapClient />;
}
