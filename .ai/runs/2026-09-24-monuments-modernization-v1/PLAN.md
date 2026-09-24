# Execution plan — monuments-modernization-v1

Source doc: `.ai/specs/2026-09-24-monuments-modernization-v1.md`
Engine: `om-auto-create-pr-loop`

## Tasks

> Authoritative status table. `Status` is one of `todo` or `done`. On landing a Step, flip `Status` to `done` and fill the `Commit` column with the short SHA. The first row whose `Status` is not `done` is the resume point for `om-auto-continue-pr-loop`.

| Phase | Step | Title | Exec | Status | Commit |
|---|---|---|---|---|---|
| 1 | 1.1 | Create the Next.js modular-monolith shell and Docker Compose services | group:A | done | ee1c10b |
| 1 | 1.2 | Define PostgreSQL migrations for monuments, translations, images, import batches, and import records | group:A | done | a3a5092 |
| 1 | 1.3 | Implement locale resolution and repository services | group:A | done | 2dc2ba1 |
| 1 | 1.4 | Add a minimal catalog health page and CI-ready validation commands | inline | done | 2f1ebd8 |
| 2 | 2.1 | Define and version the canonical import schema | group:B | done | 0d771d6 |
| 2 | 2.2 | Implement validation-only reporting | group:B | done | 678c0e6 |
| 2 | 2.3 | Implement idempotent batch persistence and checkpoints | group:B | done | c0868e7 |
| 2 | 2.4 | Add a synthetic source-adapter fixture and report artifact | inline | done | eceaa99 |
| 3 | 3.1 | Implement paginated/streamed list and detail application services | group:C | done | 2e26468 |
| 3 | 3.2 | Build accessible list and detail pages with SSR/ISR metadata | group:C | done | c58f44b |
| 3 | 3.3 | Add stable canonical URL generation and change handling | inline | done | 4251ebf |
| 4 | 4.1 | Define the Meilisearch document mapper and index settings | group:D | done | 4f73e17 |
| 4 | 4.2 | Implement indexing after import and explicit rebuild commands | group:D | done | d233c2c |
| 4 | 4.3 | Connect search UI and filters to the catalog flow | inline | done | 34dba7b |
| 5 | 5.1 | Implement the provider-neutral map adapter with Leaflet | group:E | done | 875db2c |
| 5 | 5.2 | Implement bounded viewport marker queries | group:E | done | 0c84fa2 |
| 5 | 5.3 | Add map failure and responsive states | inline | done | c7437e1 |
| 6 | 6.1 | Implement image boundary validation and metadata persistence | group:F | todo | — |
| 6 | 6.2 | Implement local filesystem storage and processing status | group:F | todo | — |
| 6 | 6.3 | Render accessible galleries and define the S3-compatible adapter boundary | inline | todo | — |
| 7 | 7.1 | Load-test list, detail, search, and bounded map queries with approximately 10,000 monuments | dispatch:capable | todo | — |
| 7 | 7.2 | Run WCAG 2.1 AA, responsive, SEO, and browser integration checks | dispatch:capable | todo | — |
| 7 | 7.3 | Run import consistency and recovery drills | dispatch:capable | todo | — |
| 7 | 7.4 | Complete security and release review | inline | todo | — |

## Goal

Implement the approved Monuments v1 modernization as a working TypeScript/Next.js modular monolith with PostgreSQL as the source of truth, a controlled canonical import, public localized catalog pages, derived search, Leaflet map browsing, local media storage, and release-quality validation.

## Scope

The work follows the spec phases in order. Each Step is one commit and leaves the application in a runnable state. The first phase establishes the runtime and data foundations; later phases add importer, catalog, search, map, media, and hardening contracts.

## Non-goals

- No administration panel, public accounts, editorial workflow, or authentication.
- No direct execution of legacy SQL dumps against PostgreSQL.
- No PostGIS, microservices, Kubernetes, cloud-specific deployment, or legacy image migration.
- No production hosting decision beyond reproducible Docker Compose development.

## Risks

- The legacy SQL dump/schema is unavailable, so the canonical importer is implemented first and the real source adapter remains dependent on receiving that input.
- This repository has no existing application runtime or validation commands; the first phase must establish the toolchain before later phases can run.
- External Meilisearch, map tiles, and filesystem processing must fail independently without making PostgreSQL-backed catalog pages unusable.

## External references

- OpenStreetMap attribution and open-data guidance: https://www.openstreetmap.org/about
- Wikimedia Commons structured media metadata: https://commons.wikimedia.org/wiki/Commons:Structured_data
- Wikidata stable entity/data model: https://www.wikidata.org/wiki/Wikidata:Data_model
