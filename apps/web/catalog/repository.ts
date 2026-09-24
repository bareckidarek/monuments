import type { Locale } from "../i18n/locale";

export type Translation = {
  locale: Locale;
  name: string;
  description?: string | null;
  address?: string | null;
  regionLabel?: string | null;
};

export type MonumentImage = {
  id: string;
  url: string;
  altTextPl?: string | null;
  altTextEn?: string | null;
  captionPl?: string | null;
  captionEn?: string | null;
};

export type Monument = {
  id: string;
  slug: string;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPublished: boolean;
  translations: Translation[];
  images?: MonumentImage[];
};

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type MonumentRepository = {
  listPublished(input: { page: number; pageSize: number; locale: Locale; region?: string }): Promise<Page<Monument>>;
  findPublishedBySlug(input: { slug: string; locale: Locale }): Promise<Monument | null>;
};

export function localize(monument: Monument, locale: Locale): Monument & { translation: Translation } {
  const translation =
    monument.translations.find((item) => item.locale === locale) ??
    monument.translations.find((item) => item.locale === "pl");
  if (!translation) throw new Error(`Monument ${monument.id} has no Polish translation`);
  return { ...monument, translation };
}

export class InMemoryMonumentRepository implements MonumentRepository {
  constructor(private readonly monuments: Monument[]) {}

  async listPublished({ page, pageSize, locale, region }: { page: number; pageSize: number; locale: Locale; region?: string }) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const published = this.monuments
      .filter((monument) => monument.isPublished)
      .filter((monument) => !region || monument.region === region)
      .sort((a, b) => a.slug.localeCompare(b.slug));
    const start = (safePage - 1) * safePageSize;
    return {
      items: published.slice(start, start + safePageSize).map((monument) => localize(monument, locale)),
      page: safePage,
      pageSize: safePageSize,
      total: published.length
    };
  }

  async findPublishedBySlug({ slug, locale }: { slug: string; locale: Locale }) {
    const monument = this.monuments.find((item) => item.slug === slug && item.isPublished);
    return monument ? localize(monument, locale) : null;
  }
}
