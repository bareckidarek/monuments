import { describe, expect, it } from "vitest";
import { CANONICAL_SCHEMA_VERSION, checksumForImport, checksumForRecord, type CanonicalImport } from "./schema";

const withoutChecksum = {
  schemaVersion: CANONICAL_SCHEMA_VERSION,
  sourceNamespace: "legacy-fixture",
  records: [{
    externalId: "a-1",
    slug: "monument-a",
    latitude: 52.1,
    longitude: 21,
    translations: [{ locale: "pl" as const, name: "Zabytek A" }]
  }]
};

describe("canonical import schema", () => {
  it("produces deterministic document and record checksums", () => {
    const input: CanonicalImport = { ...withoutChecksum, checksum: checksumForImport(withoutChecksum) };
    expect(input.checksum).toHaveLength(64);
    expect(checksumForImport({ ...withoutChecksum, records: [withoutChecksum.records[0]] })).toBe(input.checksum);
    expect(checksumForRecord(input.sourceNamespace, input.records[0])).toHaveLength(64);
  });

  it("changes the record hash when source data changes", () => {
    const first = checksumForRecord("source", withoutChecksum.records[0]);
    const changed = checksumForRecord("source", { ...withoutChecksum.records[0], slug: "changed" });
    expect(changed).not.toBe(first);
  });
});
