# Security and release review

## Scope

Reviewed the Phase 1–7 implementation against `CODE_REVIEW.md`, `BACKWARD_COMPATIBILITY.md`, the approved PRD/spec, and the changed runtime surfaces.

## Checks

- Import paths do not execute legacy SQL; canonical input is validated before persistence.
- Image boundaries validate MIME, content signatures, dimensions, size, and localized alt text.
- Local media keys reject traversal/absolute paths and storage remains behind a provider-neutral interface.
- Public reads exclude unpublished monuments; map requests require finite bounded coordinates and cap marker count.
- Search and map data are derived/rebuildable; PostgreSQL remains the intended source of truth.
- Catalog URLs are stable and published slug changes require an alias/redirect.
- `npm run typecheck`, `npm test -- --run`, `npm run build`, and `git diff --check` pass.
- `npm audit --omit=dev --audit-level=high` remains blocked by one critical and one high advisory in the Next.js 14/PostCSS dependency chain. Next.js was upgraded from `14.2.15` to the latest compatible `14.2.35`; resolving the remaining advisories requires a breaking Next.js major upgrade and is deferred rather than applied with `--force`.

## Release decision

**Not release-ready:** dependency audit findings remain open. The implementation is otherwise validation-green, but the PR must remain in progress until the Next.js major-upgrade decision is made and validated.
