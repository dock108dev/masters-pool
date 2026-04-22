`CLAUDE.md` is written at the project root. It covers:

- **Project identity** — SPA, no backend, exact stack versions
- **Dev setup** — install, env vars, subdomain routing for local dev
- **Commands** — exact `npm` scripts for dev/build/lint/test/typecheck
- **Style** — strict TS rules, no Prettier, CSS conventions, line length
- **Naming** — table covering files, components, hooks, types, CSS
- **Architecture rules** — the 5 key patterns (host classification, `ApiClient` interface, `useApi`, config-driven UI, pages-own-calls)
- **Testing** — framework, query conventions, `MockApiClient` usage, globals
- **Dependencies** — how to add, what's banned and why
- **Git** — Conventional Commits, branch naming, PR rules
- **10 hard rules** — the non-negotiables an AI must know (no `any`, no direct fetch, no club logic in components, `erasableSyntaxOnly`, etc.)