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
- `npm audit --omit=dev --audit-level=high` reports one critical and one high advisory in the Next.js 14/PostCSS dependency chain. Next.js was upgraded from `14.2.15` to the latest compatible `14.2.35`.

## Release decision

**Conditional release with waiver:** the remaining advisories require a breaking Next.js major upgrade, so `npm audit fix --force` is intentionally not used in this modernization PR. The waiver is limited to the current Next.js 14/PostCSS chain, with the public application kept behind the existing server-rendered routes, validated input boundaries, and provider-neutral derived services. A separate dependency-upgrade PR must evaluate Next.js 16/React 19 compatibility and remove this waiver before production deployment.
