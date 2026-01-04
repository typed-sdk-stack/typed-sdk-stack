# Feature: Error & Retry Layer

## Open Questions
1. Which error subclasses beyond `RapidApiClientError` do you envision (auth, rate-limit, vendor-specific)?
2. Should retries be enabled globally by default, or opt-in per request/package?
3. What backoff strategy do you prefer (exponential with jitter, fixed delay, configurable)?
4. Do you want retry counts, timings, and last error exposed via hooks/metrics?

## Implementation Notes
- Extend the error hierarchy under `packages/core/src/error/` to include auth and rate-limit variants; ensure they carry status, headers, method, URL, and original cause.
- Update `RapidApiClient` to map Axios errors to these types, including detection of RapidAPI-specific headers (e.g., rate limit headers) for context.
- Add retry configuration to `RapidApiClient` (max attempts, retryable status codes/network errors, backoff strategy), with sane defaults and override hooks.
- Emit lifecycle hooks (before retry, after retry, final failure) so SDKs can log/observe behavior.
- Expand tests to cover 4xx/5xx normalization, retry success/failure, and ensure no infinite loops.
