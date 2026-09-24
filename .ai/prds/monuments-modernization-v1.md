# Monuments Modernization — Product Requirements Document

**Status:** Approved for v1 planning  
**Date:** 2026-09-24  
**Product:** Monuments public catalog

## 1. Overview

Monuments is a Java EE 7 application originally written in 2014. This project replaces the legacy WildFly/Java EE implementation with a lightweight, modern public catalog while preserving the value of the existing domain data.

The first release is an improved version of the current product, not a direct technical port. It will focus on a fast, accessible, searchable catalog of monuments with map-based browsing, multilingual content, and image galleries.

## 2. Goals

- Provide a fast public catalog of up to approximately 10,000 monuments.
- Preserve and clean the useful domain data from the existing application.
- Provide Polish and English content, with Polish fallback when English content is unavailable.
- Support browsing through both a searchable list and an interactive map.
- Support monument detail pages and image galleries.
- Provide good search-engine visibility through server-side rendering and static revalidation.
- Meet responsive-design and WCAG 2.1 AA requirements.
- Keep local development simple and portable through Docker Compose.
- Use a modular architecture that can evolve without introducing unnecessary infrastructure.

## 3. Non-goals for v1

- No microservices architecture.
- No Kubernetes or cloud-provider-specific deployment.
- No administration panel or public user accounts.
- No complex editorial workflow, drafts, approvals, or content versioning.
- No migration of legacy images in the first release.
- No PostGIS-dependent features such as radius search or distance ranking.
- No full production observability or backup platform initially; the application should remain ready for these additions.

## 4. Target users

The primary audience is the public browsing the monument catalog. The initial release is not an editorial CMS. Data changes will be made through a controlled import process until the need for an administration panel is validated.

## 5. Functional requirements

### 5.1 Catalog

- Display a paginated or incrementally loaded list of monuments.
- Display a detail page for each monument.
- Support stable, human-readable URLs.
- Display localized names, descriptions, regions, and other relevant fields.
- Fall back to Polish content when an English translation is unavailable.

### 5.2 Search and filters

- Search monument names, descriptions, and relevant location or region fields.
- Support filters appropriate to the existing domain model.
- Return ranked results quickly for the expected catalog size.
- Treat the search index as derived data that can be rebuilt from PostgreSQL.

### 5.3 Map

- Provide an interactive map alongside or connected to the catalog list.
- Display monument locations as markers.
- Cluster markers at lower zoom levels.
- Allow the map provider and tile provider to be replaced without changing domain logic.
- Store latitude and longitude in the application database.

### 5.4 Images

- Allow images to be added to monuments in the new application.
- Validate image type and size at the application boundary.
- Store media through a storage abstraction.
- Support local filesystem storage during development.
- Support S3-compatible object storage for a future hosted deployment.
- Leave room for thumbnails and responsive image variants.

### 5.5 Import

- Import cleaned data from the legacy application.
- Treat the legacy SQL dump as input to a controlled transformation process, not as arbitrary SQL to execute directly against the target database.
- Validate imported records before persistence.
- Produce an explicit report of invalid, skipped, and transformed records.
- Make imports repeatable and safe to rerun.
- Rebuild or synchronize the Meilisearch index after a successful import.
- Trigger page revalidation after imported content changes.

## 6. Proposed architecture

### 6.1 Application structure

Use a TypeScript and Next.js full-stack modular monolith:

```text
apps/web/
  catalog/
  search/
  map/
  media/
  i18n/
  import/
  db/
  ui/

infra/
  docker-compose.yml
  postgres/
  meilisearch/
```

The modules should have clear responsibilities and interfaces, but remain part of one deployable application. A separate service should only be introduced when a measured operational or scaling requirement justifies it.

### 6.2 Technology choices

| Concern | Choice |
|---|---|
| Language | TypeScript |
| Web framework | Next.js with React |
| Rendering | SSR plus ISR/revalidation |
| Database | PostgreSQL |
| Geospatial data | Latitude/longitude fields; no PostGIS in v1 |
| Search | Meilisearch |
| Map | Leaflet or MapLibre |
| Local runtime | Docker Compose |
| Development media storage | Local filesystem |
| Future hosted media storage | S3-compatible object storage |
| Localization | Polish and English, Polish fallback |

### 6.3 Data ownership

PostgreSQL is the source of truth. Meilisearch, generated image variants, and cached pages are derived artifacts and must be rebuildable.

## 7. Performance and quality requirements

- Public pages must be rendered in a way that supports search engine indexing.
- The UI must be responsive on mobile and desktop devices.
- The catalog should remain responsive for up to approximately 10,000 monuments.
- Search should be handled by Meilisearch rather than expensive unrestricted database scans.
- The application should start quickly in local development.
- The first implementation should avoid introducing Redis, message brokers, Elasticsearch, Kubernetes, or other infrastructure without evidence that it is needed.
- Accessibility must be considered during implementation, not added as a final retrofit.

## 8. Local development and deployment

The initial development environment should run through Docker Compose and include:

- the Next.js application;
- PostgreSQL;
- Meilisearch;
- any explicitly required import or media-processing process.

The deployment target is intentionally deferred. The application must not depend on a specific cloud vendor. Hosting can later be selected as a VPS, PaaS, or a combination of managed services without changing the domain model.

## 9. Migration strategy

The migration will use a cleaned import rather than a direct database or code migration.

1. Inspect and define the target domain model.
2. Extract the useful data from the legacy SQL dump.
3. Transform it into the target import representation.
4. Validate records and produce an import report.
5. Load PostgreSQL through application-controlled migrations/import logic.
6. Import or add new images separately; legacy images are excluded from v1.
7. Build the Meilisearch index from PostgreSQL.
8. Generate or revalidate public pages.
9. Verify representative records and map coordinates before release.

The importer should eventually use a versioned canonical representation with stable external IDs, even if the first source is a SQL dump. This prevents the legacy database format from becoming a permanent application contract.

## 10. Delivery phases

1. **Domain and database foundation**  
   Define the target model, migrations, localization structure, and Docker Compose environment.

2. **Controlled legacy import**  
   Build the SQL-dump transformation, validation, idempotent import, and reporting.

3. **Public catalog**  
   Implement list pages, detail pages, stable URLs, Polish/English content, SSR, and ISR.

4. **Search**  
   Integrate Meilisearch, indexing, filters, ranking, and rebuild commands.

5. **Map**  
   Add list/map browsing, markers, clustering, and provider abstraction.

6. **Media**  
   Add image upload/import support, storage abstraction, validation, and gallery rendering.

7. **Quality hardening**  
   Verify responsive behavior, WCAG 2.1 AA requirements, SEO metadata, performance, error handling, and import consistency.

8. **Hosting decision**  
   Select and document a deployment target only after the local application is functional and its resource requirements are understood.

## 11. Acceptance criteria

The v1 implementation is ready for evaluation when:

- The application starts locally with the documented Docker Compose workflow.
- Cleaned legacy data can be imported without executing an unrestricted SQL dump against the target database.
- Repeating the import does not create duplicate monuments.
- Invalid records are reported rather than silently discarded.
- Monument list and detail pages work in Polish and English with Polish fallback.
- Search and filters work through Meilisearch.
- The map displays monument locations and clusters markers.
- Images can be added to new monuments through the supported media flow.
- Public pages are server-rendered or statically revalidated and have appropriate SEO metadata.
- The UI is responsive and has been checked against WCAG 2.1 AA requirements.
- The search index can be rebuilt from PostgreSQL.
- The system does not require a legacy WildFly runtime to run the new application.

## 12. Deferred decisions

The following decisions are intentionally postponed until the first working release:

- production hosting provider;
- production backup and monitoring strategy;
- administration panel;
- editorial workflow and content history;
- PostGIS and spatial search;
- migration of legacy images;
- additional languages beyond Polish and English;
- extraction of import, media processing, or search into separate services.

