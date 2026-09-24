import { describe, expect, it } from "vitest";
import { adaptSyntheticSource } from "./source-adapter";
import { checksumForImport } from "./schema";
import { InMemoryImportDatabase } from "./persistence";
import { validateCanonicalImport } from "./validation";

describe("import consistency and recovery drills", () => {
  it("keeps source skips separate from canonical validation and persistence", async () => {
    const adapted = adaptSyntheticSource([
      { legacyId: "legacy-1", namePl: "Pomnik Pierwszy" },
      { legacyId: "", namePl: "Bez identyfikatora" },
      { legacyId: "legacy-2", namePl: "Pomnik Drugi", nameEn: "Second Monument" }
    ]);

    expect(adapted.report).toMatchObject({
      sourceRecordCount: 3,
      transformedRecordCount: 2,
      skippedRecordCount: 1
    });
    expect(validateCanonicalImport(adapted.document).ok).toBe(true);

    const db = new InMemoryImportDatabase();
    const result = await db.run(adapted.document, "source-drill");
    expect(result.importedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(db.records.size).toBe(2);
  });

  it("uses a stable checksum to make repeated imports idempotent", async () => {
    const adapted = adaptSyntheticSource([
      { legacyId: "legacy-1", namePl: "Pomnik Pierwszy" }
    ]);
    const reordered = {
      records: adapted.document.records,
      sourceNamespace: adapted.document.sourceNamespace,
      schemaVersion: adapted.document.schemaVersion
    };

    expect(checksumForImport(reordered)).toBe(adapted.document.checksum);
    const db = new InMemoryImportDatabase();
    const first = await db.run(adapted.document, "repeat-drill");
    const second = await db.run(adapted.document, "repeat-drill");

    expect(first.records[0]).toMatchObject({ state: "applied", outcome: "inserted" });
    expect(second.records).toEqual(first.records);
    expect(second.importedCount).toBe(0);
    expect(second.skippedCount).toBe(1);
  });

  it("resumes from durable checkpoints without duplicating earlier records", async () => {
    const adapted = adaptSyntheticSource([
      { legacyId: "legacy-1", namePl: "Pomnik Pierwszy" },
      { legacyId: "legacy-2", namePl: "Pomnik Drugi" },
      { legacyId: "legacy-3", namePl: "Pomnik Trzeci" }
    ]);
    const db = new InMemoryImportDatabase();
    db.failAfter = 2;

    await expect(db.run(adapted.document, "resume-drill")).rejects.toThrow("simulated interruption");
    expect([...db.records.keys()]).toEqual([
      "synthetic-legacy:legacy-1",
      "synthetic-legacy:legacy-2"
    ]);

    db.failAfter = undefined;
    const resumed = await db.run(adapted.document, "resume-drill");
    expect(resumed.importedCount).toBe(1);
    expect(resumed.skippedCount).toBe(2);
    expect(db.records.size).toBe(3);
    expect(new Set([...db.records.values()].map(({ hash }) => hash)).size).toBe(3);
  });

  it("rolls back the interrupted record while preserving committed checkpoints", async () => {
    const adapted = adaptSyntheticSource([
      { legacyId: "legacy-1", namePl: "Pomnik Pierwszy" },
      { legacyId: "legacy-2", namePl: "Pomnik Drugi" }
    ]);
    const db = new InMemoryImportDatabase();
    db.failAfter = 1;

    await expect(db.run(adapted.document, "rollback-drill")).rejects.toThrow("simulated interruption");
    expect(db.records.size).toBe(1);
    expect(db.batches.get("rollback-drill")?.records).toHaveLength(1);
    expect(db.records.has("synthetic-legacy:legacy-2")).toBe(false);

    db.failAfter = undefined;
    const completed = await db.run(adapted.document, "rollback-drill");
    expect(completed.importedCount).toBe(1);
    expect(completed.skippedCount).toBe(1);
    expect(db.records.size).toBe(2);
  });
});
