import { checksumForImport, type CanonicalImport, type CanonicalRecord } from "./schema";

export type SyntheticSourceRecord = {
  legacyId: string;
  namePl: string;
  nameEn?: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
};

export type SourceAdapterReport = {
  sourceNamespace: string;
  sourceRecordCount: number;
  transformedRecordCount: number;
  skippedRecordCount: number;
  skipped: Array<{ legacyId: string; reason: string }>;
};

export function adaptSyntheticSource(records: SyntheticSourceRecord[]): {
  document: CanonicalImport;
  report: SourceAdapterReport;
} {
  const skipped: SourceAdapterReport["skipped"] = [];
  const transformed: CanonicalRecord[] = [];

  for (const source of records) {
    if (!source.legacyId.trim() || !source.namePl.trim()) {
      skipped.push({ legacyId: source.legacyId, reason: "missing legacyId or Polish name" });
      continue;
    }

    transformed.push({
      externalId: source.legacyId,
      slug: slugify(source.namePl),
      latitude: source.latitude ?? null,
      longitude: source.longitude ?? null,
      region: source.region ?? null,
      isPublished: true,
      translations: [
        { locale: "pl", name: source.namePl },
        ...(source.nameEn?.trim() ? [{ locale: "en" as const, name: source.nameEn }] : [])
      ]
    });
  }

  const input = {
    schemaVersion: "1.0" as const,
    sourceNamespace: "synthetic-legacy",
    records: transformed
  };

  return {
    document: { ...input, checksum: checksumForImport(input) },
    report: {
      sourceNamespace: input.sourceNamespace,
      sourceRecordCount: records.length,
      transformedRecordCount: transformed.length,
      skippedRecordCount: skipped.length,
      skipped
    }
  };
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[łŁ]/g, "l")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
