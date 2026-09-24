import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogMonument } from "../../../apps/web/catalog/services";
import { resolveLocale } from "../../../apps/web/i18n/locale";
import { catalogRepository } from "../../../apps/web/catalog/runtime-repository";

export const revalidate = 60;

type Params = { slug: string };
type SearchParams = { locale?: string };

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const locale = resolveLocale(searchParams.locale);
  const monument = await getCatalogMonument(catalogRepository, { slug: params.slug, locale });
  if (!monument) return { title: "Monument not found | Monuments" };
  return {
    title: `${monument.translation.name} | Monuments`,
    description: monument.translation.description ?? `Details for ${monument.translation.name}.`
  };
}

export default async function MonumentPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const locale = resolveLocale(searchParams.locale);
  const monument = await getCatalogMonument(catalogRepository, { slug: params.slug, locale });
  if (!monument) notFound();
  const backLabel = locale === "en" ? "Back to catalog" : "Wróć do katalogu";
  const resolvedNotice = locale === "en" && monument.translation.locale !== "en"
    ? <p role="status">English content is unavailable; Polish content is shown.</p>
    : null;

  return (
    <main>
      <nav aria-label={locale === "en" ? "Breadcrumb" : "Okruszki nawigacji"}><Link href={`/catalog?locale=${locale}`}>{backLabel}</Link></nav>
      <article>
        <h1>{monument.translation.name}</h1>
        {resolvedNotice}
        {monument.translation.address && <p><strong>{locale === "en" ? "Address" : "Adres"}:</strong> {monument.translation.address}</p>}
        {monument.translation.description && <p>{monument.translation.description}</p>}
        {monument.latitude != null && monument.longitude != null && (
          <p>{locale === "en" ? "Coordinates" : "Współrzędne"}: {monument.latitude}, {monument.longitude}</p>
        )}
      </article>
    </main>
  );
}
