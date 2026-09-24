import type { Locale } from "../i18n/locale";
import { localize, type Monument, type MonumentRepository, type Page } from "./repository";

export type CatalogListInput = {
  locale: Locale;
  page?: number;
  pageSize?: number;
  region?: string;
};

export type LocalizedMonument = Monument & {
  translation: ReturnType<typeof localize>["translation"];
};

export async function listCatalogMonuments(
  repository: MonumentRepository,
  input: CatalogListInput
): Promise<Page<LocalizedMonument>> {
  const page = await repository.listPublished({
    locale: input.locale,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 20,
    region: input.region?.trim() || undefined
  });

  return { ...page, items: page.items.map((monument) => localize(monument, input.locale)) };
}

export async function getCatalogMonument(
  repository: MonumentRepository,
  input: { slug: string; locale: Locale }
): Promise<LocalizedMonument | null> {
  const slug = input.slug.trim();
  if (!slug) return null;
  const monument = await repository.findPublishedBySlug({ slug, locale: input.locale });
  return monument ? localize(monument, input.locale) : null;
}

export async function* streamCatalogMonuments(
  repository: MonumentRepository,
  input: Omit<CatalogListInput, "page">
): AsyncGenerator<LocalizedMonument, void, undefined> {
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  let page = 1;
  while (true) {
    const result = await listCatalogMonuments(repository, { ...input, page, pageSize });
    for (const monument of result.items) yield monument;
    if (result.items.length === 0 || page * result.pageSize >= result.total) return;
    page += 1;
  }
}
