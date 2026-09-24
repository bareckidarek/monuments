import { describe, expect, it } from "vitest";
import { checksumForImport, type CanonicalImport } from "./schema";
import { validateCanonicalImport, validationReportJson } from "./validation";

function documentWith(records: CanonicalImport["records"]): CanonicalImport {
  const base = { schemaVersion: "1.0" as const, sourceNamespace: "fixture", records };
  return { ...base, checksum: checksumForImport(base) };
}

describe("validation-only import reporting", () => {
  it("reports all invalid records with stable codes and never needs a writer", () => {
    const input = documentWith([
      { externalId: "same", slug: "valid", translations: [{ locale: "pl", name: "OK" }] },
      { externalId: "same", slug: "BAD SLUG", latitude: 100, translations: [{ locale: "en", name: "No PL" }] }
    ]);
    const report = validateCanonicalImport(input);
    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "IMPORT_EXTERNAL_ID_DUPLICATE", "IMPORT_SLUG_INVALID", "IMPORT_TRANSLATION_MISSING", "IMPORT_COORDINATES_INVALID"
    ]));
    expect(report.invalidRecordCount).toBe(1);
    expect(validationReportJson(report)).toContain('"ok": false');
  });

  it("rejects tampered checksums without accepting the payload", () => {
    const input = documentWith([{ externalId: "one", slug: "one", translations: [{ locale: "pl", name: "Jeden" }] }]);
    const report = validateCanonicalImport({ ...input, records: [{ ...input.records[0], slug: "changed" }] });
    expect(report.errors.some((error) => error.code === "IMPORT_CHECKSUM_INVALID")).toBe(true);
    expect(report.validated).toBeUndefined();
  });
});
