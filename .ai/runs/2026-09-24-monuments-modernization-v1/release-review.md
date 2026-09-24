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
- `npm audit --audit-level=high` and `npm audit --omit=dev --audit-level=high` report zero vulnerabilities after the Next.js 16, React 19, and patched Vitest upgrades.

## Release decision

**Release review resolved:** the dependency waiver from the modernization PR is superseded by the validated upgrade in PR #2. No dependency-audit waiver remains for the current dependency tree.
