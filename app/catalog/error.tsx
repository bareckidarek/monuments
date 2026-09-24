"use client";

export default function CatalogError({ reset }: { reset: () => void }) {
  return <main><h1>Catalog unavailable</h1><p>We could not load the catalog.</p><button onClick={reset}>Try again</button></main>;
}
