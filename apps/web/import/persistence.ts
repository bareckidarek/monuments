import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { checksumForRecord, type CanonicalImport, type CanonicalRecord } from "./schema";
import { validateCanonicalImport, type ValidationReport } from "./validation";

export type ImportOutcome = "inserted" | "updated" | "unchanged" | "conflict";
export type ImportRecordState = { hash: string; externalId: string; state: "applied" | "failed"; outcome: ImportOutcome };
export type ImportBatchReport = ValidationReport & {
  batchId: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  records: ImportRecordState[];
};

type StoredRecord = { sourceNamespace: string; record: CanonicalRecord; hash: string };

export class InMemoryImportDatabase {
  records = new Map<string, StoredRecord>();
  batches = new Map<string, ImportBatchReport>();
  failAfter?: number;

  async run(input: unknown, batchId = "batch-1"): Promise<ImportBatchReport> {
    const validation = validateCanonicalImport(input);
    const report: ImportBatchReport = { ...validation, batchId, importedCount: 0, skippedCount: 0, errorCount: validation.errors.length, records: [] };
    if (!validation.ok || !validation.validated) return report;
    let committed = new Map(this.records);
    const existing = this.batches.get(batchId);
    const records = existing?.records ?? [];
    try {
      for (const [index, record] of validation.validated.document.records.entries()) {
        const hash = checksumForRecord(validation.validated.document.sourceNamespace, record);
        const prior = records.find((item) => item.hash === hash);
        if (prior) {
          report.records.push(prior);
          report.skippedCount++;
          continue;
        }
        if (this.failAfter !== undefined && index >= this.failAfter) throw new Error("simulated interruption");
        const key = `${validation.validated.document.sourceNamespace}:${record.externalId}`;
        const current = this.records.get(key);
        const outcome: ImportOutcome = current ? (current.hash === hash ? "unchanged" : "updated") : "inserted";
        this.records.set(key, { sourceNamespace: validation.validated.document.sourceNamespace, record, hash });
        committed = new Map(this.records);
        const state = { hash, externalId: record.externalId, state: "applied" as const, outcome };
        records.push(state);
        report.records.push(state);
        report.importedCount++;
        this.batches.set(batchId, { ...report, records: [...records] });
      }
      report.records = records;
      report.skippedCount = records.length - report.importedCount;
      this.batches.set(batchId, report);
      return report;
    } catch (error) {
      this.records = committed;
      const partial = this.batches.get(batchId);
      if (partial) this.batches.set(batchId, { ...partial, errorCount: partial.errorCount + 1 });
      throw error;
    }
  }
}

export async function runImport(pool: Pool, input: unknown, batchId?: string): Promise<ImportBatchReport> {
  const validation = validateCanonicalImport(input);
  const id = batchId ?? randomUUID();
  const empty: ImportBatchReport = { ...validation, batchId: id, importedCount: 0, skippedCount: 0, errorCount: validation.errors.length, records: [] };
  if (!validation.ok || !validation.validated) return empty;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO import_batch (id, input_version, source_namespace, checksum, total_count)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [id, validation.validated.document.schemaVersion, validation.validated.document.sourceNamespace, validation.checksum, validation.validated.document.records.length]
    );
    for (const [index, record] of validation.validated.document.records.entries()) {
      await persistRecord(client, id, validation.validated.document.sourceNamespace, record, validation.validated.recordHashes[index]);
    }
    await client.query(`UPDATE import_batch SET status = 'completed', completed_at = now(), imported_count = $2 WHERE id = $1`, [id, validation.validated.document.records.length]);
    await client.query("COMMIT");
    return { ...empty, importedCount: validation.validated.document.records.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function persistRecord(client: { query: Pool["query"] }, batchId: string, namespace: string, record: CanonicalRecord, hash: string) {
  const prior = await client.query(`SELECT checkpoint_state FROM import_record WHERE batch_id = $1 AND source_record_hash = $2`, [batchId, hash]);
  if (prior.rowCount) return;
  const monument = await client.query(
    `INSERT INTO monument (source_namespace, external_id, slug, latitude, longitude, region, is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (source_namespace, external_id) DO UPDATE SET slug=EXCLUDED.slug, latitude=EXCLUDED.latitude,
       longitude=EXCLUDED.longitude, region=EXCLUDED.region, is_published=EXCLUDED.is_published, updated_at=now()
     RETURNING id`,
    [namespace, record.externalId, record.slug, record.latitude ?? null, record.longitude ?? null, record.region ?? null, record.isPublished ?? false]
  );
  const monumentId = monument.rows[0].id;
  for (const translation of record.translations) {
    await client.query(
      `INSERT INTO monument_translation (monument_id, locale, name, description, address, region_label)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (monument_id, locale) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
       address=EXCLUDED.address, region_label=EXCLUDED.region_label`,
      [monumentId, translation.locale, translation.name, translation.description ?? null, translation.address ?? null, translation.regionLabel ?? null]
    );
  }
  await client.query(
    `INSERT INTO import_record (batch_id, source_record_hash, external_id, validation_status, transformed_fields, checkpoint_state, idempotency_outcome)
     VALUES ($1,$2,$3,'valid',$4,'applied','inserted') ON CONFLICT (batch_id, source_record_hash) DO NOTHING`,
    [batchId, hash, record.externalId, JSON.stringify(record)]
  );
}
