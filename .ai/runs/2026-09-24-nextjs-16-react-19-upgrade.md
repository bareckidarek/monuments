# Execution plan — Next.js 16 and React 19 upgrade

## Goal

Upgrade the merged Monuments application to the latest stable Next.js and React releases compatible with the repository, remove the temporary dependency-audit waiver, and preserve the existing catalog behavior.

## Scope

- Update Next.js, React, React DOM, their type packages, and the lockfile.
- Adapt application/configuration code only where the new framework versions require it.
- Re-run typecheck, tests, production build, and the dependency audit.
- Update release documentation to remove the superseded waiver and record the validated dependency versions.

## Non-goals

- No map route or new product functionality.
- No database schema or import behavior changes.
- No unrelated dependency refreshes.
- No forced history rewrite or `npm audit fix --force` shortcut without validating the resulting migration.

## Risks

- Next.js 16 may require Node.js 20.9+ and may expose React Server Components or build configuration incompatibilities.
- A dependency upgrade can change production rendering or image behavior; the existing build and test gate must remain green.
- If the latest stable release cannot be adopted without unrelated scope expansion, stop with the exact compatibility blocker documented.

## Implementation plan

### Phase 1: Dependency migration

- [x] 1.1 Update Next.js, React, React DOM, and React type dependencies to the latest stable compatible versions — 7b16a5c
- [x] 1.2 Resolve framework/compiler configuration changes and keep the lockfile consistent — 7b16a5c

### Phase 2: Compatibility validation

- [ ] 2.1 Add or update regression coverage for any migration-related behavior changes
- [ ] 2.2 Run typecheck, the full test suite, production build, and dependency audit

### Phase 3: Release documentation

- [ ] 3.1 Remove the superseded dependency waiver and record the validated upgrade outcome

## Progress

PR: #2 (link: https://github.com/bareckidarek/monuments/pull/2)

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Dependency migration

- [x] 1.1 Update Next.js, React, React DOM, and React type dependencies to the latest stable compatible versions — 7b16a5c
- [x] 1.2 Resolve framework/compiler configuration changes and keep the lockfile consistent — 7b16a5c

### Phase 2: Compatibility validation

- [x] 2.1 Add or update regression coverage for any migration-related behavior changes — 7b16a5c
- [x] 2.2 Run typecheck, the full test suite, production build, and dependency audit — 7b16a5c

### Phase 3: Release documentation

- [x] 3.1 Remove the superseded dependency waiver and record the validated upgrade outcome — 7b16a5c
