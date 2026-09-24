import { InMemoryMonumentRepository, type Monument } from "./repository";
import { Pool } from "pg";
import { PostgresMonumentRepository } from "../db/postgres-repository";

export const demoMonuments: Monument[] = [
  {
    id: "demo-1",
    slug: "brama-brandenburska",
    region: "warszawa",
    latitude: 52.5163,
    longitude: 13.3777,
    isPublished: true,
    translations: [
      {
        locale: "pl",
        name: "Brama Brandenburska",
        description: "Klasycystyczna brama miejska i jeden z najbardziej rozpoznawalnych zabytków.",
        address: "Pariser Platz, Berlin"
      },
      {
        locale: "en",
        name: "Brandenburg Gate",
        description: "A neoclassical city gate and one of the most recognisable landmarks.",
        address: "Pariser Platz, Berlin"
      }
    ]
  },
  {
    id: "demo-2",
    slug: "zamek-na-wawelu",
    region: "malopolska",
    latitude: 50.054,
    longitude: 19.935,
    isPublished: true,
    translations: [
      {
        locale: "pl",
        name: "Zamek na Wawelu",
        description: "Historyczna rezydencja królewska na wzgórzu wawelskim.",
        address: "Wawel 5, Kraków"
      }
    ]
  }
];

type RuntimeRepositoryOptions = {
  databaseUrl?: string;
  createPool?: (connectionString: string) => Pool;
};

export function createCatalogRepository({
  databaseUrl = process.env.DATABASE_URL,
  createPool = (connectionString) => new Pool({ connectionString })
}: RuntimeRepositoryOptions = {}) {
  if (databaseUrl) return new PostgresMonumentRepository(createPool(databaseUrl));
  return new InMemoryMonumentRepository([...demoMonuments]);
}

export const catalogRepository = createCatalogRepository();
