# Feature: Client Enhancements for SDKs

## Open Questions
1. Which helper methods would reduce duplication for SDK authors (e.g., `requestJson<T>()`, query builders, pagination helpers)?
2. Do we need built-in parameter validation (Zod) per SDK method, or should that live in each package?
3. Should we expose middleware hooks for request/response mutation at the client level?

## Implementation Notes
- Extend `RapidApiClient` with optional helpers (default query params, common headers, typed response parsing) that SDKs can opt into without subclassing.
- Provide a light wrapper or factory so SDK packages can compose behaviors (e.g., caching + retries + validation) declaratively.
- Document patterns for injecting package-specific defaults (hosts, base paths) while still using the shared client instance.
- Add tests showing how SDKs configure custom defaults and ensure helper behavior is opt-in.
