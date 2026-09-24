import { describe, expect, it } from "vitest";
import { checksumForImport, type CanonicalImport } from "./schema";
import { InMemoryImportDatabase } from "./persistence";

function input(records: CanonicalImport["records"]): CanonicalImport {
  const base = { schemaVersion: "1.0" as const, sourceNamespace: "fixture", records };
  return { ...base, checksum: checksumForImport(base) };
}
const record = (name = "A") => ({ externalId: "a", slug: "monument-a", translations: [{ locale: "pl" as const, name }] });

describe("idempotent import persistence", () => {
  it("inserts once and makes a repeated import a no-op", async () => {
    const db = new InMemoryImportDatabase();
    expect((await db.run(input([record()]))).importedCount).toBe(1);
    const repeat = await db.run(input([record()]));
    expect(repeat.importedCount).toBe(0);
    expect(repeat.skippedCount).toBe(1);
    expect(db.records.size).toBe(1);
  });

  it("updates a changed source hash without creating a duplicate external ID", async () => {
    const db = new InMemoryImportDatabase();
    await db.run(input([record()]), "one");
    const changed = await db.run(input([record("Changed")]), "two");
    expect(changed.records[0].outcome).toBe("updated");
    expect(db.records.size).toBe(1);
    expect(db.records.get("fixture:a")?.record.translations[0].name).toBe("Changed");
  });

  it("resumes an interrupted batch from durable checkpoints", async () => {
    const db = new InMemoryImportDatabase();
    db.failAfter = 1;
    await expect(db.run(input([record(), { ...record(), externalId: "b", slug: "monument-b" }]))).rejects.toThrow("simulated interruption");
    db.failAfter = undefined;
    const resumed = await db.run(input([record(), { ...record(), externalId: "b", slug: "monument-b" }]));
    expect(resumed.importedCount).toBe(1);
    expect(resumed.skippedCount).toBe(1);
    expect(db.records.size).toBe(2);
  });

  it("rolls back a failed transaction and leaves no partial records", async () => {
    const db = new InMemoryImportDatabase();
    db.failAfter = 0;
    await expect(db.run(input([record()]), "rollback")).rejects.toThrow();
    expect(db.records.size).toBe(0);
  });
});
