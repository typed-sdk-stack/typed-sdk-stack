# Repository Guidelines

## Project Structure & Module Organization
This Bun + Turborepo workspace keeps all runtime code in `packages/*`; currently `packages/core` exposes the shared RapidAPI client, retry helpers, and caching primitives described in its README. New vendor SDKs should live in sibling folders with `src/`, `__tests__/`, and package docs so Turbo can schedule builds independently. Treat root-level configs (`biome.json`, `turbo.json`, `lefthook.yml`) as the single source of truth—override them only when a package truly needs a framework-specific tweak.

## Build, Test, and Development Commands
- `bun install` – install dependencies using the locked Bun toolchain.
- `bun run build` – `turbo run build` to compile every package in graph order.
- `bun run check-types` – run `tsc --noEmit` in each workspace for fast type safety.
- `bun run lint` / `bun run lint:fix` – apply Biome linting and auto-fixes project-wide.
- `bun run test` – execute the package-level `test` scripts via Turbo; keep suites hermetic.
- `bun run validate` – convenience target that chains lint, type, and test for a CI-like gate.

## Coding Style & Naming Conventions
Biome enforces 4-space indentation, 120-character lines, single quotes, and required semicolons; run `bun run lint` before committing. Stick to strict TypeScript, exporting explicit types and avoiding implicit `any`. Scope packages as `@typed-sdk-stack/<vendor>`; classes such as `NbaClient` use PascalCase, helpers stay camelCase, and config constants live under `src/config`.

## Testing Guidelines
Keep package tests inside a top-level `tests/` directory (e.g., `packages/core/tests`) so Bun’s runner can target a single location. Expose everything through the workspace `test` script so `bun run test` remains the single entry point. Mock RapidAPI calls through the core test utilities, store fixtures in `tests/__fixtures__`, and focus coverage on request construction, error normalization, and caching toggles.

## Commit & Pull Request Guidelines
Commit messages must follow Conventional Commits because `@commitlint/config-conventional` and the `bunx commitlint` hook reject anything else. The Lefthook pre-commit runs `bun run lint` and `bun run check-types`; never bypass it. PRs should link an issue, describe affected packages, list validation commands, and include screenshots or sample payloads when HTTP behavior changes.

## Security & Configuration Tips
Store secrets such as `RAPIDAPI_KEY` in local env files and inject them through constructors or config layers—never embed them in code or docs. Scrub debug logging for hostnames or keys before landing a PR, and rotate the credential immediately if a log or gist leaks sensitive data.

## Agent-Specific Instructions
Never run git commands (e.g., `git status`, `git add`, `git commit`) unless the user explicitly requests them during the session.
