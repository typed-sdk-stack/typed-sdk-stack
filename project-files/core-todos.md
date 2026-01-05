# Core package ToDos

## HTTP Client MVP ✅
- Completed: `RapidApiClient` now supports configurable Axios instances, inferred base URLs, default headers, schemas, and tests.

## Error & Retry Layer
- Build error hierarchy (`RapidApiClientError`, auth error, rate-limit error) with context, original causes, and status codes.
- Implement retry policy (max attempts, backoff, retryable status/network errors) plus configuration hooks.
- Add tests covering 4xx/5xx normalization, retries, and ensuring failures surface actionable metadata.

## Client Enhancements for SDKs
- As needs arise, extend `RapidApiClient` with helper methods (default params, request transforms, caching knobs) instead of creating a separate base class.

## Caching (follow-up) ✅
- Completed: TTL regression tests (unit + integration), README example for custom Keyv + per-request TTL, and `cacheMetrics` exposure on responses.

## Logging (follow-up)
- Provide README documentation that demonstrates passing a custom `pinoInstance`, overriding levels, and what the default structured messages look like. ✅
- Ensure secrets such as `rapidApiKey` are consistently redacted even if future metadata changes; add a regression test that inspects emitted log payloads. ✅
- Expose a lightweight extension point (e.g., callback or hook) so SDKs can append extra metadata to each log entry without duplicating the client.

## Rate Limit Awareness & Throttling
- Track RapidAPI rate headers, expose them through the client/base class, and implement soft throttling helpers.
- Provide hooks so SDKs can plug in custom limiters (e.g., p-limit, token buckets).


## Observability Hooks
- Add hook registry (before request, after response, on retry/error, cache hit/miss) with typed callbacks and minimal overhead.
- Expose metrics/state (e.g., retry counts, last status) so SDKs can tie into logging/telemetry.

## Testing Utilities
- Provide test helpers (mock `RapidApiClient`, fixture builders, deterministic cache adapters) so SDK packages can unit test without hitting RapidAPI.
- Document patterns for Bun tests, axios-mock-adapter usage, and fixture organization.

## Documentation & Tooling
- Generate TypeDoc outputs and wire them into Docusaurus (or README sections) for public API docs.
- Document all conventions in `packages/core/README.md`, including usage examples for each major feature.

## testing file conventions
In packages/core/tests/Schemas.ts lines 1-65: the test file name does not follow
the repository test pattern and may be ignored by Bun's test runner; rename the
file from packages/core/tests/Schemas.ts to packages/core/tests/Schemas.test.ts
so it matches the **/*.test.ts convention and will be discovered and executed by
the test runner.
