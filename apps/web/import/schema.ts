import { createHash } from "node:crypto";

export const CANONICAL_SCHEMA_VERSION = "1.0" as const;
export const IMPORT_ERROR_CODES = {
  INVALID_DOCUMENT: "IMPORT_DOCUMENT_INVALID",
  UNSUPPORTED_VERSION: "IMPORT_SCHEMA_VERSION_UNSUPPORTED",
  INVALID_NAMESPACE: "IMPORT_SOURCE_NAMESPACE_INVALID",
  INVALID_EXTERNAL_ID: "IMPORT_EXTERNAL_ID_INVALID",
  DUPLICATE_EXTERNAL_ID: "IMPORT_EXTERNAL_ID_DUPLICATE",
  INVALID_SLUG: "IMPORT_SLUG_INVALID",
  INVALID_LOCALE: "IMPORT_LOCALE_INVALID",
  MISSING_TRANSLATION: "IMPORT_TRANSLATION_MISSING",
  INVALID_COORDINATES: "IMPORT_COORDINATES_INVALID",
  INVALID_CHECKSUM: "IMPORT_CHECKSUM_INVALID",
  INVALID_RECORD: "IMPORT_RECORD_INVALID"
} as const;

export type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[keyof typeof IMPORT_ERROR_CODES];
export type CanonicalLocale = "pl" | "en";

export type CanonicalTranslation = {
  locale: CanonicalLocale;
  name: string;
  description?: string | null;
  address?: string | null;
  regionLabel?: string | null;
};

export type CanonicalRecord = {
  externalId: string;
  slug: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  isPublished?: boolean;
  translations: CanonicalTranslation[];
  images?: Array<{
    storageKey: string;
    originalFilename: string;
    mimeType: string;
    byteSize: number;
    altTextPl?: string | null;
    altTextEn?: string | null;
    captionPl?: string | null;
    captionEn?: string | null;
    provenance?: string | null;
    license?: string | null;
  }>;
};

export type CanonicalImport = {
  schemaVersion: typeof CANONICAL_SCHEMA_VERSION;
  sourceNamespace: string;
  checksum: string;
  records: CanonicalRecord[];
};

export type ImportValidationError = {
  code: ImportErrorCode;
  message: string;
  recordIndex?: number;
  externalId?: string;
  field?: string;
};

export type ValidatedImport = {
  document: CanonicalImport;
  recordHashes: string[];
};

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function checksumForImport(input: Omit<CanonicalImport, "checksum">): string {
  return createHash("sha256").update(canonicalJson(input)).digest("hex");
}

export function checksumForRecord(sourceNamespace: string, record: CanonicalRecord): string {
  return createHash("sha256")
    .update(canonicalJson({ sourceNamespace, record }))
    .digest("hex");
}
