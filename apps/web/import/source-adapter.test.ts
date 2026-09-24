import { describe, expect, it } from "vitest";
import { adaptSyntheticSource } from "./source-adapter";
import { validateCanonicalImport } from "./validation";

describe("synthetic source adapter", () => {
  it("transforms safe source records and emits a canonical checksum", () => {
    const result = adaptSyntheticSource([
      { legacyId: "legacy-1", namePl: "Pałac Kultury", nameEn: "Palace of Culture", region: "Mazowieckie" },
      { legacyId: "legacy-2", namePl: "" }
    ]);

    expect(result.document.records[0]).toMatchObject({
      externalId: "legacy-1",
      slug: "palac-kultury",
      translations: [{ locale: "pl" }, { locale: "en" }]
    });
    expect(result.report).toMatchObject({ sourceRecordCount: 2, transformedRecordCount: 1, skippedRecordCount: 1 });
    expect(validateCanonicalImport(result.document).ok).toBe(true);
  });

  it("does not execute or preserve source SQL", () => {
    const result = adaptSyntheticSource([{ legacyId: "legacy-3", namePl: "Pomnik" }]);
    expect(JSON.stringify(result.document)).not.toMatch(/select|insert|drop\s+table/i);
  });
});
