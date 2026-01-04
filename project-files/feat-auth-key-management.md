# Feature: Auth & Key Management

## Open Questions
1. Should the client support multiple RapidAPI keys simultaneously (per-request overrides, tenant pools)?
2. How do you want keys loaded—constructor params only, env vars, secure storage callbacks?
3. Do we need automatic key rotation or just manual swapping via setters?
4. Any auditing/logging requirements when keys change or fail authorization?

## Implementation Notes
- Enhance `RapidApiClientParams` to accept key providers (string, callback, async source) plus optional per-request overrides.
- Provide helper methods to swap keys at runtime, propagate to Axios defaults, and optionally scope keys to specific hosts/endpoints.
- Document best practices for BYOK scenarios and env-based configuration in README/AGENTS.
- Add tests covering key overrides, missing key errors, and concurrency (parallel requests using different keys).
