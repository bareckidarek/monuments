import Link from "next/link";
import type { Metadata } from "next";
import { listCatalogMonuments } from "../../apps/web/catalog/services";
import { resolveLocale } from "../../apps/web/i18n/locale";
import { catalogRepository } from "../../apps/web/catalog/runtime-repository";
import { demoMonuments } from "../../apps/web/catalog/runtime-repository";
import { monumentToSearchDocument } from "../../apps/web/search/mapper";
import { searchCatalog } from "../../apps/web/search/query";
import { catalogLabels, catalogNavigationLabel, paginationLabel } from "../../apps/web/catalog/page-contracts";
import { canonicalCatalogPath } from "../../apps/web/catalog/urls";

export const revalidate = 60;

type SearchParams = { locale?: string; region?: string; page?: string; q?: string };

export const metadata: Metadata = {
  title: "Catalog | Monuments",
  description: "Browse the public monument catalog.",
  alternates: { canonical: canonicalCatalogPath() }
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const locale = resolveLocale(resolvedSearchParams.locale);
  const page = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const pageNumber = Number.isFinite(page) && page > 0 ? page : 1;
  const result = resolvedSearchParams.q
    ? await searchCatalog(catalogRepository, demoMonuments.map(monumentToSearchDocument), {
        locale,
        q: resolvedSearchParams.q,
        region: resolvedSearchParams.region,
        page: pageNumber,
        pageSize: 20
      })
    : await listCatalogMonuments(catalogRepository, {
        locale,
        region: resolvedSearchParams.region,
        page: pageNumber,
        pageSize: 20
      });

  const labels = catalogLabels(locale);
  const otherLocale = locale === "en" ? "pl" : "en";

  return (
    <main>
      <nav aria-label={catalogNavigationLabel(locale)}>
        <Link href={`/catalog?locale=${otherLocale}`}>{labels.language}</Link>
      </nav>
      <header>
        <h1>{labels.title}</h1>
        <p>{labels.intro}</p>
        <form method="get" role="search">
          <label htmlFor="catalog-search">{locale === "en" ? "Search" : "Szukaj"}</label>
          <input id="catalog-search" name="q" type="search" defaultValue={resolvedSearchParams.q} />
          <input type="hidden" name="locale" value={locale} />
          {resolvedSearchParams.region && <input type="hidden" name="region" value={resolvedSearchParams.region} />}
          <button type="submit">{labels.search}</button>
        </form>
      </header>
      {result.items.length === 0 ? (
        <p role="status">{labels.empty}</p>
      ) : (
        <ul aria-label={labels.title}>
          {result.items.map((monument) => (
            <li key={monument.id}>
              <h2><Link href={`/catalog/${monument.slug}?locale=${locale}`}>{monument.translation.name}</Link></h2>
              {monument.translation.address && <p>{monument.translation.address}</p>}
              <p><Link href={`/catalog/${monument.slug}?locale=${locale}`}>{labels.details}</Link></p>
            </li>
          ))}
        </ul>
      )}
      {result.total > result.pageSize && (
        <nav aria-label={paginationLabel(locale)}>
          <p>{result.page} / {Math.ceil(result.total / result.pageSize)}</p>
          {result.page > 1 && <Link href={`/catalog?locale=${locale}&page=${result.page - 1}`}>←</Link>}
          {result.page * result.pageSize < result.total && <Link href={`/catalog?locale=${locale}&page=${result.page + 1}`}>→</Link>}
        </nav>
      )}
    </main>
  );
}
