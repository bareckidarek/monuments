# Backward compatibility

The repository has no implemented public runtime surfaces yet. Until the modernization produces them, the approved PRD is the protected planning contract.

## Protected planning contract

Changes to the v1 goals, non-goals, architecture, migration strategy, or acceptance criteria in `.ai/prds/monuments-modernization-v1.md` must explain the replacement decision in the same change and update dependent specifications. Do not silently reintroduce excluded infrastructure or a direct legacy-runtime dependency.

## Future contract surfaces

When implementation begins, document each concrete surface here before treating it as stable:

- public monument URLs and rendered response shapes;
- localized content and Polish fallback behavior;
- import formats, stable external IDs, validation reports, and rerun semantics;
- database migrations and persisted data;
- search-index documents and rebuild commands;
- media storage interfaces and image constraints;
- map-provider abstraction boundaries;
- Docker Compose configuration and local development commands.

Breaking changes to any recorded surface require an explicit migration or deprecation path, updated acceptance coverage, and release notes. Database and import changes must include a rollback or recovery plan; URL and response changes must preserve compatibility or document redirects and versioning.
