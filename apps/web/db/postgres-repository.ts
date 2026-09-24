import type { Pool } from "pg";
import type { Locale } from "../i18n/locale";
import type { Monument, MonumentRepository, Page, Translation } from "../catalog/repository";

export class PostgresMonumentRepository implements MonumentRepository {
  constructor(private readonly pool: Pool) {}

  async listPublished({ page, pageSize, region }: { page: number; pageSize: number; locale: Locale; region?: string }): Promise<Page<Monument>> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;
    const result = await this.pool.query(
      `SELECT m.id, m.slug, m.latitude, m.longitude, m.is_published, m.region,
              count(*) OVER() AS total,
              json_agg(json_build_object('locale', t.locale, 'name', t.name,
                'description', t.description, 'address', t.address,
                'regionLabel', t.region_label)) AS translations
         FROM monument m
         JOIN monument_translation t ON t.monument_id = m.id
        WHERE m.is_published
          AND ($3::text IS NULL OR m.region = $3)
        GROUP BY m.id
        ORDER BY m.slug
        LIMIT $1 OFFSET $2`,
      [safePageSize, offset, region?.trim() || null]
    );
    return {
      items: result.rows.map(toMonument),
      page: safePage,
      pageSize: safePageSize,
      total: Number(result.rows[0]?.total ?? 0)
    };
  }

  async findPublishedBySlug({ slug }: { slug: string; locale: Locale }): Promise<Monument | null> {
    const result = await this.pool.query(
      `SELECT m.id, m.slug, m.latitude, m.longitude, m.is_published, m.region,
              json_agg(json_build_object('locale', t.locale, 'name', t.name,
                'description', t.description, 'address', t.address,
                'regionLabel', t.region_label)) AS translations
         FROM monument m
         JOIN monument_translation t ON t.monument_id = m.id
        WHERE m.slug = $1 AND m.is_published
        GROUP BY m.id`,
      [slug]
    );
    return result.rows[0] ? toMonument(result.rows[0]) : null;
  }
}

function toMonument(row: Record<string, unknown>): Monument {
  return {
    id: String(row.id),
    slug: String(row.slug),
    region: row.region === null ? null : String(row.region),
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    isPublished: Boolean(row.is_published),
    translations: (row.translations as Translation[]).map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      description: translation.description,
      address: translation.address,
      regionLabel: translation.regionLabel
    }))
  };
}
