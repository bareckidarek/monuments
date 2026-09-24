import type { Locale } from "../i18n/locale";

export type CatalogLabels = {
  title: string;
  intro: string;
  empty: string;
  details: string;
  language: string;
  search: string;
};

export function catalogLabels(locale: Locale): CatalogLabels {
  return locale === "en"
    ? {
        title: "Monument catalog",
        intro: "Browse published monuments.",
        empty: "No monuments match these filters.",
        details: "View details",
        language: "Polski",
        search: "Search"
      }
    : {
        title: "Katalog zabytków",
        intro: "Przeglądaj opublikowane zabytki.",
        empty: "Nie znaleziono zabytków dla wybranych filtrów.",
        details: "Zobacz szczegóły",
        language: "English",
        search: "Szukaj"
      };
}

export function catalogNavigationLabel(locale: Locale): string {
  return locale === "en" ? "Catalog navigation" : "Nawigacja katalogu";
}

export function paginationLabel(locale: Locale): string {
  return locale === "en" ? "Pagination" : "Paginacja";
}

export function monumentBreadcrumbLabel(locale: Locale): string {
  return locale === "en" ? "Breadcrumb" : "Okruszki nawigacji";
}

export const responsiveCatalogContract = {
  compactMaxWidth: 640,
  wideMainPadding: "2rem 1.5rem",
  compactMainPadding: "1rem"
} as const;

export function catalogLayoutState(viewportWidth: number): "compact" | "wide" {
  return viewportWidth <= responsiveCatalogContract.compactMaxWidth ? "compact" : "wide";
}

