# Feature: Rate Limit Awareness & Throttling

## Open Questions
1. Which RapidAPI rate headers should we honor (`X-RateLimit-Requests-Remaining`, `Retry-After`, vendor-specific)?
2. Do you prefer soft throttling (delays within client) or just exposing metadata so SDKs implement their own throttles?
3. Should throttling decisions be global (shared across SDKs) or scoped per client instance?

## Implementation Notes
- Add logic in `RapidApiClient` to capture relevant rate headers on each response and expose them via hooks/state.
- Implement optional throttling helper that delays requests when thresholds are hit (configurable strategy, max concurrent requests, queue behavior).
- Allow SDKs to subscribe to rate events (e.g., near-limit, limit-exceeded) for logging or custom handling.
- Add tests simulating rate headers and verifying throttling decisions + metadata exposure.
