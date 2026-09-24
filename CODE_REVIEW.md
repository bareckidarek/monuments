# Code review guidance

This repository is currently a planning-stage modernization project. Review changes against the approved product requirements in `.ai/prds/monuments-modernization-v1.md` and avoid introducing implementation assumptions that contradict its goals or non-goals.

## Priorities

- **Correctness:** preserve domain data, stable monument URLs, Polish fallback behavior, repeatable imports, and explicit reporting of invalid records.
- **Security:** treat legacy SQL as untrusted input; validate uploads at the application boundary; never introduce unrestricted SQL execution or expose credentials.
- **Contracts:** keep PostgreSQL as the source of truth and treat search indexes, image variants, and cached pages as rebuildable derived data.
- **Accessibility and UX:** user-facing work must account for responsive behavior and WCAG 2.1 AA, including empty, loading, error, and narrow-screen states.
- **Architecture:** keep the application modular without adding microservices or infrastructure that the PRD identifies as unnecessary for v1.

## Repository-specific checks

- Confirm new implementation work matches the planned TypeScript/Next.js, PostgreSQL, Meilisearch, map, media, and Docker Compose direction.
- Require regression coverage for import idempotency, validation failures, localization fallback, search/index rebuild behavior, and stable URLs as those surfaces are implemented.
- Review schema and import changes for safe reruns and clear migration or rollback behavior.
- Do not treat the absence of automated validation commands as evidence that a change is correct; add appropriate checks with the implementation.

## Severity

Block correctness, security, data-loss, contract, and accessibility regressions. Treat deviations from explicit non-goals or protected contracts as blocking unless the requirements are updated in the same change. Record lower-risk maintainability and documentation concerns as follow-up work when they do not affect release safety.
