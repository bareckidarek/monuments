# Agent guidance

Monuments is being modernized from a legacy Java EE application into a TypeScript/Next.js public catalog. The approved product direction is documented in `.ai/prds/monuments-modernization-v1.md`; the repository currently contains planning material rather than an implementation.

| When the task involves… | Read first | Key rules |
|---|---|---|
| Product scope or requirements | `.ai/prds/monuments-modernization-v1.md` | Preserve the stated v1 goals and non-goals; resolve deferred decisions explicitly. |
| Specifications and delivery process | `SDLC.md`, `.ai/agentic.config.json` | Use `.ai/specs/` for specs and the configured validation gate; currently no automated validation commands are detected. |
| Application implementation | `.ai/prds/monuments-modernization-v1.md` | Planned stack is TypeScript, Next.js, PostgreSQL, Meilisearch, and Docker Compose; verify the implementation before assuming these files exist. |
| Review and compatibility | `CODE_REVIEW.md`, `BACKWARD_COMPATIBILITY.md` | Apply the repository-specific review checklist and protect the documented public contracts. |

## Validation

No automated validation commands are configured yet. Update `.ai/agentic.config.json` when implementation tooling is added.
