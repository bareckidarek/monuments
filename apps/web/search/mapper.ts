import type { Monument, Translation } from "../catalog/repository";

export const MONUMENTS_INDEX = "monuments";

export type SearchDocument = {
  id: string;
  externalId: string;
  slug: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  isPublished: boolean;
  names: { pl: string | null; en: string | null };
  descriptions: { pl: string | null; en: string | null };
  addresses: { pl: string | null; en: string | null };
  regionLabels: { pl: string | null; en: string | null };
  searchableText: string;
};

export type SearchIndexSettings = {
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes: string[];
  displayedAttributes: string[];
};

export const monumentIndexSettings: SearchIndexSettings = {
  searchableAttributes: [
    "names.pl",
    "names.en",
    "descriptions.pl",
    "descriptions.en",
    "addresses.pl",
    "addresses.en",
    "regionLabels.pl",
    "regionLabels.en",
    "searchableText"
  ],
  filterableAttributes: ["region", "isPublished", "names.pl", "names.en"],
  sortableAttributes: ["slug", "region"],
  displayedAttributes: [
    "id",
    "externalId",
    "slug",
    "region",
    "latitude",
    "longitude",
    "isPublished",
    "names",
    "descriptions",
    "addresses",
    "regionLabels"
  ]
};

function localized(translations: Translation[], field: keyof Translation): { pl: string | null; en: string | null } {
  const value = (locale: "pl" | "en") => translations.find((translation) => translation.locale === locale)?.[field];
  const pl = value("pl");
  const en = value("en");
  return { pl: typeof pl === "string" ? pl : null, en: typeof en === "string" ? en : null };
}

export function monumentToSearchDocument(monument: Monument & { externalId?: string }): SearchDocument {
  const names = localized(monument.translations, "name");
  const descriptions = localized(monument.translations, "description");
  const addresses = localized(monument.translations, "address");
  const regionLabels = localized(monument.translations, "regionLabel");
  return {
    id: monument.id,
    externalId: monument.externalId ?? monument.id,
    slug: monument.slug,
    region: monument.region ?? null,
    latitude: monument.latitude ?? null,
    longitude: monument.longitude ?? null,
    isPublished: monument.isPublished,
    names,
    descriptions,
    addresses,
    regionLabels,
    searchableText: [names.pl, names.en, descriptions.pl, descriptions.en, addresses.pl, addresses.en, regionLabels.pl, regionLabels.en]
      .filter((value): value is string => Boolean(value))
      .join(" ")
  };
}
