import type { Locale } from "../i18n/locale";
import { getCatalogMonument, type LocalizedMonument } from "../catalog/services";
import type { MonumentRepository } from "../catalog/repository";
import type { SearchDocument } from "./mapper";

export type SearchCatalogInput = {
  q?: string;
  region?: string;
  locale: Locale;
  page?: number;
  pageSize?: number;
};

export async function searchCatalog(
  repository: MonumentRepository,
  documents: SearchDocument[],
  input: SearchCatalogInput
): Promise<{ items: LocalizedMonument[]; page: number; pageSize: number; total: number }> {
  const query = input.q?.trim().toLocaleLowerCase() ?? "";
  const region = input.region?.trim();
  const matches = documents
    .filter((document) => document.isPublished)
    .filter((document) => !region || document.region === region)
    .filter((document) => !query || document.searchableText.toLocaleLowerCase().includes(query))
    .sort((left, right) => left.slug.localeCompare(right.slug));
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  const selected = matches.slice((page - 1) * pageSize, page * pageSize);
  const items: LocalizedMonument[] = [];

  for (const document of selected) {
    const monument = await getCatalogMonument(repository, { slug: document.slug, locale: input.locale });
    if (monument) items.push(monument);
  }

  return { items, page, pageSize, total: matches.length };
}
