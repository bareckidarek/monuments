import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogMonument } from "../../../apps/web/catalog/services";
import { resolveLocale } from "../../../apps/web/i18n/locale";
import { catalogRepository } from "../../../apps/web/catalog/runtime-repository";
import { AccessibleGallery } from "../../../apps/web/media/gallery";
import { canonicalMonumentPath } from "../../../apps/web/catalog/urls";
import { monumentBreadcrumbLabel } from "../../../apps/web/catalog/page-contracts";

export const revalidate = 60;

type Params = { slug: string };
type SearchParams = { locale?: string };
type PageProps = { params: Promise<Params>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale: requestedLocale } = await searchParams;
  const locale = resolveLocale(requestedLocale);
  const monument = await getCatalogMonument(catalogRepository, { slug, locale });
  if (!monument) return { title: "Monument not found | Monuments" };
  return {
    title: `${monument.translation.name} | Monuments`,
    description: monument.translation.description ?? `Details for ${monument.translation.name}.`,
    alternates: { canonical: canonicalMonumentPath(monument) }
  };
}

export default async function MonumentPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { locale: requestedLocale } = await searchParams;
  const locale = resolveLocale(requestedLocale);
  const monument = await getCatalogMonument(catalogRepository, { slug, locale });
  if (!monument) notFound();
  const backLabel = locale === "en" ? "Back to catalog" : "Wróć do katalogu";
  const resolvedNotice = locale === "en" && monument.translation.locale !== "en"
    ? <p role="status">English content is unavailable; Polish content is shown.</p>
    : null;

  return (
    <main>
      <nav aria-label={monumentBreadcrumbLabel(locale)}><Link href={`/catalog?locale=${locale}`}>{backLabel}</Link></nav>
      <article>
        <h1>{monument.translation.name}</h1>
        {resolvedNotice}
        {monument.translation.address && <p><strong>{locale === "en" ? "Address" : "Adres"}:</strong> {monument.translation.address}</p>}
        {monument.translation.description && <p>{monument.translation.description}</p>}
        <AccessibleGallery images={monument.images ?? []} locale={locale} />
        {monument.latitude != null && monument.longitude != null && (
          <p>{locale === "en" ? "Coordinates" : "Współrzędne"}: {monument.latitude}, {monument.longitude}</p>
        )}
      </article>
    </main>
  );
}
