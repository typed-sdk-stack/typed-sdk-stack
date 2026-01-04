# OpenWeatherMap SDK Game Plan

Assumes the core roadmap (error handling, retries, caching, rate-limit awareness, observability, docs) is complete.

## Phase 1 – Package Scaffold
- Create `packages/open-weather-map` with package.json, README, tsconfig, tsup config, `.gitignore`, and tests directory mirroring other workspaces.
- Reference shared configs via `@typed-sdk-stack/shared-config` and add scripts for build/test/lint/check-types/validate.
- Depend on `@typed-sdk-stack/core` (workspace version) so we can leverage the full client feature set immediately.

## Phase 2 – Domain Types & Client Stub
- Define request/response DTOs (`src/types.ts`) for current weather and forecast endpoints (units, coordinates, city IDs, etc.).
- Implement `OpenWeatherMapClient` skeleton that accepts the core client (via dependency injection or composition) and exposes method signatures with mocked returns.
- Export the client + types from `src/index.ts` and add Bun tests verifying constructors and method contracts.

## Phase 3 – Endpoint Wiring
- Wire real HTTP methods through `RapidApiClient`: current weather first, then forecast endpoints.
- Implement query-building helpers (units, language, geolocation, city lookups) and response adapters that trim unused fields.
- Add axios-mock-adapter-based tests covering successful calls, error propagation (ensuring core errors bubble up), and query serialization.

## Phase 4 – Feature Enhancements
- Layer optional caching (leveraging core caching interfaces) for idempotent GET requests; allow TTL overrides per method.
- Surface rate-limit metadata (via core hooks) so SDK consumers can inspect remaining quota.
- Add retries toggles or custom configuration for endpoints with specific resilience needs.

## Phase 5 – Documentation & Examples
- Expand `packages/open-weather-map/README.md` with installation instructions, configuration matrix (units, language, caching, retries), and sample code for each method.
- Provide usage snippets that demonstrate core features (error handling, caching, rate-limit awareness).
- Add typed examples/tests that double as documentation (e.g., `examples/current-weather.ts`).

## Phase 6 – Publish Readiness
- Ensure build outputs (`dist` JS + DTS) are correct, `files` list is accurate, and package metadata reflects the SDK scope.
- Run `bun run validate` (lint, type-check, tests) and confirm GitHub Actions pipelines pass.
- Update root docs (README, AGENTS.md) to mention the new SDK, then prep release notes and version bump when ready for npm.
