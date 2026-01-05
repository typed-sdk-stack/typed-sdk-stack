# Feature: Error, Rate Limit & Retry Layer

## Decisions / Requirements

1. **Error hierarchy**
    - Build dedicated subclasses for auth errors and rate-limit errors (extending `RapidApiClientError`).
      Vendor-specific errors can be added later if needed.

2. **Retry activation**
    - Retries remain opt-in per request/package; the client should offer configuration knobs but never retry by default
      unless explicitly enabled.

3. **Backoff strategy**
    - Use exponential backoff with jitter as the default; allow per-client overrides (fixed delay or a callback that
      returns the desired delay per attempt).

4. **Retry metrics & hooks**
    - Expose retry counts, elapsed timing, and the last error through hooks/metadata so SDKs can monitor behavior.

5. **Rate-limit headers**
    - Track the standard RapidAPI headers (`X-RateLimit-Requests-Limit`, `X-RateLimit-Requests-Remaining`,
      `X-RateLimit-Requests-Reset`, plus `Retry-After` when provided). Capture any vendor-specific headers if present
      and surface them via metadata for SDKs to interpret.

6. **Throttling scope**
    - Throttling is scoped per `RapidApiClient` instance. Shared/global throttling across SDKs can be layered externally
      if needed, but core keeps decisions local to the client instance.

7. **Throttling behavior**
    - Provide optional “soft throttling”: when remaining quota drops below thresholds, delay or queue outgoing requests
      inside the client. SDKs that want custom logic can listen to rate events and implement their own throttling
      externally.

8. **Rate-limit metadata exposure**
    - Persist the latest rate-limit headers in a dedicated Keyv-backed helper (e.g., `RateLimitTracker`) that lives
      outside `RapidApiClient`. Inject that metadata into `RapidApiResponseBuilderInput` (and resulting DTOs) so SDKs
      can inspect quota data without bloating the client.

9. **Telemetry scope**
    - Defer detailed telemetry payloads to the upcoming hooks feature; this layer only emits the metrics necessary for
      retries/rate awareness.

10. **Rate tracking toggle**
    - Provide configuration to disable rate-header tracking entirely for performance-sensitive SDKs.

## Implementation Notes
- Extend the error hierarchy under `packages/core/src/error/` to include auth and rate-limit variants; ensure they carry status, headers, method, URL, and original cause.
- Update `RapidApiClient` to map Axios errors to these types, including detection of RapidAPI-specific headers (e.g., rate limit headers) for context.
- Add retry configuration to `RapidApiClient` (max attempts, retryable status codes/network errors, backoff strategy),
  with defaults of exponential + jitter plus overrides for fixed delay or a custom function.
- Track RapidAPI rate headers on every response, store them on the client, and expose them via hooks/state so SDKs can
  monitor remaining quota.
- Add an optional throttling helper that delays or queues requests when thresholds are crossed, configurable per
  client (max concurrent, cooldown, etc.).
- Emit lifecycle hooks/events (before retry, after retry, before throttle, after throttle, limit-exceeded) so SDKs can
  log/observe behavior and surface retry + rate metrics.
- Expose retry and rate metrics (attempt count, elapsed time, last error, remaining quota) via response metadata or
  hooks for integration into observability/logging.
- Expand tests to cover 4xx/5xx normalization, retry success/failure, rate-limit error mapping, and throttling behavior
  under simulated headers to ensure no infinite loops.
