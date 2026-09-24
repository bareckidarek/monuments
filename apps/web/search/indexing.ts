import { MONUMENTS_INDEX, monumentIndexSettings, monumentToSearchDocument, type SearchDocument, type SearchIndexSettings } from "./mapper";
import type { Monument } from "../catalog/repository";

export type SearchIndexAdapter = {
  configure(indexName: string, settings: SearchIndexSettings): Promise<void>;
  upsertDocuments(indexName: string, documents: SearchDocument[]): Promise<void>;
  clearDocuments(indexName: string): Promise<void>;
};

export type MonumentSearchSource = {
  listAll(): Promise<Array<Monument & { externalId?: string }>>;
};

export async function indexAfterImport(
  adapter: SearchIndexAdapter,
  monuments: Array<Monument & { externalId?: string }>
): Promise<{ indexedCount: number }> {
  await adapter.configure(MONUMENTS_INDEX, monumentIndexSettings);
  const documents = monuments.filter((monument) => monument.isPublished).map(monumentToSearchDocument);
  await adapter.upsertDocuments(MONUMENTS_INDEX, documents);
  return { indexedCount: documents.length };
}

export async function rebuildSearchIndex(adapter: SearchIndexAdapter, source: MonumentSearchSource): Promise<{ indexedCount: number }> {
  await adapter.configure(MONUMENTS_INDEX, monumentIndexSettings);
  await adapter.clearDocuments(MONUMENTS_INDEX);
  return indexAfterImport(adapter, await source.listAll());
}

export class InMemorySearchIndex implements SearchIndexAdapter {
  readonly documents = new Map<string, SearchDocument>();
  readonly settings = new Map<string, SearchIndexSettings>();
  readonly operations: string[] = [];

  async configure(indexName: string, settings: SearchIndexSettings) {
    this.settings.set(indexName, settings);
    this.operations.push(`configure:${indexName}`);
  }

  async upsertDocuments(indexName: string, documents: SearchDocument[]) {
    if (!this.settings.has(indexName)) throw new Error(`Index ${indexName} is not configured`);
    for (const document of documents) this.documents.set(document.id, document);
    this.operations.push(`upsert:${indexName}:${documents.length}`);
  }

  async clearDocuments(indexName: string) {
    if (!this.settings.has(indexName)) throw new Error(`Index ${indexName} is not configured`);
    this.documents.clear();
    this.operations.push(`clear:${indexName}`);
  }
}
