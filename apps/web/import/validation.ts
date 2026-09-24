import {
  CANONICAL_SCHEMA_VERSION,
  checksumForImport,
  checksumForRecord,
  IMPORT_ERROR_CODES,
  type CanonicalImport,
  type CanonicalRecord,
  type CanonicalTranslation,
  type ImportValidationError,
  type ValidatedImport
} from "./schema";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const namespacePattern = /^[a-z0-9][a-z0-9._-]{1,63}$/;

export type ValidationReport = {
  ok: boolean;
  errors: ImportValidationError[];
  validRecordCount: number;
  invalidRecordCount: number;
  checksum: string | null;
  validated?: ValidatedImport;
};

export function validateCanonicalImport(input: unknown): ValidationReport {
  const errors: ImportValidationError[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [{ code: IMPORT_ERROR_CODES.INVALID_DOCUMENT, message: "Import must be an object." }], validRecordCount: 0, invalidRecordCount: 0, checksum: null };
  }
  const sourceNamespace = input.sourceNamespace;
  const records = input.records;
  if (input.schemaVersion !== CANONICAL_SCHEMA_VERSION) {
    errors.push({ code: IMPORT_ERROR_CODES.UNSUPPORTED_VERSION, message: `Expected schema version ${CANONICAL_SCHEMA_VERSION}.`, field: "schemaVersion" });
  }
  if (typeof sourceNamespace !== "string" || !namespacePattern.test(sourceNamespace)) {
    errors.push({ code: IMPORT_ERROR_CODES.INVALID_NAMESPACE, message: "Source namespace must be 2-64 lowercase characters.", field: "sourceNamespace" });
  }
  if (!Array.isArray(records)) {
    errors.push({ code: IMPORT_ERROR_CODES.INVALID_DOCUMENT, message: "Records must be an array.", field: "records" });
    return { ok: false, errors, validRecordCount: 0, invalidRecordCount: 0, checksum: null };
  }
  const typedRecords: CanonicalRecord[] = [];
  const seen = new Map<string, number>();
  records.forEach((value, index) => {
    const recordErrors = validateRecord(value, index, seen);
    errors.push(...recordErrors);
    if (recordErrors.length === 0) typedRecords.push(value as CanonicalRecord);
  });
  const checksumInput = { schemaVersion: input.schemaVersion, sourceNamespace, records };
  const computedChecksum = checksumForImport(checksumInput as Omit<CanonicalImport, "checksum">);
  if (typeof input.checksum !== "string" || input.checksum !== computedChecksum) {
    errors.push({ code: IMPORT_ERROR_CODES.INVALID_CHECKSUM, message: "Checksum does not match canonical content.", field: "checksum" });
  }
  const recordHashes = typedRecords.map((record) => checksumForRecord(sourceNamespace as string, record));
  return {
    ok: errors.length === 0,
    errors,
    validRecordCount: typedRecords.length,
    invalidRecordCount: records.length - typedRecords.length,
    checksum: computedChecksum,
    ...(errors.length === 0 ? { validated: { document: input as CanonicalImport, recordHashes } } : {})
  };
}

function validateRecord(value: unknown, index: number, seen: Map<string, number>): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  if (!isObject(value)) return [{ code: IMPORT_ERROR_CODES.INVALID_RECORD, message: "Record must be an object.", recordIndex: index }];
  const externalId = value.externalId;
  if (typeof externalId !== "string" || externalId.trim() === "") {
    errors.push({ code: IMPORT_ERROR_CODES.INVALID_EXTERNAL_ID, message: "External ID is required.", recordIndex: index, field: "externalId" });
  } else if (seen.has(externalId)) {
    errors.push({ code: IMPORT_ERROR_CODES.DUPLICATE_EXTERNAL_ID, message: `External ID duplicates record ${seen.get(externalId)}.`, recordIndex: index, externalId, field: "externalId" });
  } else seen.set(externalId, index);
  if (typeof value.slug !== "string" || !slugPattern.test(value.slug)) errors.push({ code: IMPORT_ERROR_CODES.INVALID_SLUG, message: "Slug must contain lowercase URL-safe words.", recordIndex: index, field: "slug" });
  if (!Array.isArray(value.translations)) {
    errors.push({ code: IMPORT_ERROR_CODES.MISSING_TRANSLATION, message: "At least one translation is required.", recordIndex: index, field: "translations" });
  } else {
    const locales = new Set<string>();
    value.translations.forEach((translation: unknown) => {
      if (!isObject(translation) || !isTranslation(translation)) {
        errors.push({ code: IMPORT_ERROR_CODES.INVALID_LOCALE, message: "Translation must contain locale and name.", recordIndex: index, field: "translations" });
      } else {
        if (locales.has(translation.locale)) errors.push({ code: IMPORT_ERROR_CODES.INVALID_LOCALE, message: "Locale may occur only once per record.", recordIndex: index, field: "translations" });
        locales.add(translation.locale);
      }
    });
    if (!locales.has("pl")) errors.push({ code: IMPORT_ERROR_CODES.MISSING_TRANSLATION, message: "Polish translation is required.", recordIndex: index, field: "translations" });
  }
  if (!validCoordinate(value.latitude, -90, 90) || !validCoordinate(value.longitude, -180, 180)) errors.push({ code: IMPORT_ERROR_CODES.INVALID_COORDINATES, message: "Coordinates must be null or within latitude/longitude ranges.", recordIndex: index, field: "coordinates" });
  return errors;
}

function isTranslation(value: Record<string, unknown>): value is Record<string, unknown> & CanonicalTranslation {
  return (value.locale === "pl" || value.locale === "en") && typeof value.name === "string" && value.name.trim() !== "";
}
function validCoordinate(value: unknown, min: number, max: number) {
  return value === undefined || value === null || (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max);
}
function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
