# Feature: Observability Hooks

## Open Questions
1. Which hook events matter most (before request, after response, retry attempt, error, cache hit/miss)?
2. Should hooks be synchronous, async, or both? Do they need to mutate requests/responses?
3. Any preferred metrics/logging format we should target (OpenTelemetry, custom events)?

## Implementation Notes
- Design a typed hook registry (subscribe/unsubscribe) inside `RapidApiClient` with minimal overhead when unused.
- Fire hooks for key lifecycle events (request start, success, failure, retry, cache hit/miss) and pass structured context (method, URL, duration, status, error).
- Provide utility helpers for common logging/metric scenarios and document hook usage in README.
- Add tests ensuring hooks fire in the correct order and do not block or throw uncaught errors.
