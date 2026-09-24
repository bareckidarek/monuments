import Link from "next/link";
import type { Metadata } from "next";
import { listCatalogMonuments } from "../../apps/web/catalog/services";
import { resolveLocale } from "../../apps/web/i18n/locale";
import { catalogRepository } from "../../apps/web/catalog/runtime-repository";
import { demoMonuments } from "../../apps/web/catalog/runtime-repository";
import { monumentToSearchDocument } from "../../apps/web/search/mapper";
import { searchCatalog } from "../../apps/web/search/query";

export const revalidate = 60;

type SearchParams = { locale?: string; region?: string; page?: string; q?: string };

export const metadata: Metadata = {
  title: "Catalog | Monuments",
  description: "Browse the public monument catalog."
};

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = resolveLocale(searchParams.locale);
  const page = Number.parseInt(searchParams.page ?? "1", 10);
  const pageNumber = Number.isFinite(page) && page > 0 ? page : 1;
  const result = searchParams.q
    ? await searchCatalog(catalogRepository, demoMonuments.map(monumentToSearchDocument), {
        locale,
        q: searchParams.q,
        region: searchParams.region,
        page: pageNumber,
        pageSize: 20
      })
    : await listCatalogMonuments(catalogRepository, {
        locale,
        region: searchParams.region,
        page: pageNumber,
        pageSize: 20
      });

  const labels = locale === "en"
    ? { title: "Monument catalog", intro: "Browse published monuments.", empty: "No monuments match these filters.", details: "View details", language: "Polski" }
    : { title: "Katalog zabytków", intro: "Przeglądaj opublikowane zabytki.", empty: "Nie znaleziono zabytków dla wybranych filtrów.", details: "Zobacz szczegóły", language: "English" };
  const otherLocale = locale === "en" ? "pl" : "en";

  return (
    <main>
      <nav aria-label={locale === "en" ? "Catalog navigation" : "Nawigacja katalogu"}>
        <Link href={`/catalog?locale=${otherLocale}`}>{labels.language}</Link>
      </nav>
      <header>
        <h1>{labels.title}</h1>
        <p>{labels.intro}</p>
        <form method="get" role="search">
          <label htmlFor="catalog-search">{locale === "en" ? "Search" : "Szukaj"}</label>
          <input id="catalog-search" name="q" type="search" defaultValue={searchParams.q} />
          <input type="hidden" name="locale" value={locale} />
          {searchParams.region && <input type="hidden" name="region" value={searchParams.region} />}
          <button type="submit">{locale === "en" ? "Search" : "Szukaj"}</button>
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
        <nav aria-label={locale === "en" ? "Pagination" : "Paginacja"}>
          <p>{result.page} / {Math.ceil(result.total / result.pageSize)}</p>
          {result.page > 1 && <Link href={`/catalog?locale=${locale}&page=${result.page - 1}`}>←</Link>}
          {result.page * result.pageSize < result.total && <Link href={`/catalog?locale=${locale}&page=${result.page + 1}`}>→</Link>}
        </nav>
      )}
    </main>
  );
}
