# Feature: Caching

## Decisions / Clarifications

- Use [Keyv](https://github.com/jaredwray/keyv) (KeyvHQ) for cache storage; allow users to pass any Keyv adapter (Redis,
  SQLite, memory, etc.).
- Cache keys should include method, URL, params, body, `rapidApiHost`, and `rapidApiKey` to avoid collisions.
- RapidApiClient should accept an optional Keyv instance (with TTL via Keyv config) or a pre-built `CacheManager`;
  default to an in-memory Keyv (namespaced per host/key) if none is provided.
- Extend `RequestParams` with optional `cache` toggle, `cacheKey` override, and `ttl` so callers can customize caching per request.

## Open Questions & Answers

1. **Headers in cache key?** Stick to the defined components (method, URL, params, payload, host, key) for now.
2. **Invalidation vs TTL?** TTL-only; no manual invalidation initially.
3. **Opt-in per request?** Yes. Passing a Keyv instance turns caching on globally (using its TTL), and per-request
   overrides can supply custom `cacheKey`/`ttl`.
4. **Cache errors?** Skip caching on failures entirely for now.
5. **Value serialization?** Store the full `RapidApiResponse` DTO (status/data/headers/duration/request metadata)
   so cached entries can be returned directly and flag `fromCache = true` when served.

## Implementation Notes

- Introduce a `CacheOptions` interface and update `RequestParams` to include `{ cacheKey?: string; ttl?: number }`.
- Provide a utility (or `CacheManager.createCacheKey()`) that combines method, URL, params, payload, host, and key
  into a deterministic string (hash if needed for length) and can accept extra metadata.
- In `RapidApiClient.request`, short-circuit GET (and other idempotent) requests when a cached entry exists; populate
  cache on successful responses respecting per-request TTL overrides.
- Default to an in-memory Keyv instance when no adapter is supplied; allow users to pass a preconfigured Keyv with their
  own TTL or persistence layer.
- Document caching behavior, Keyv setup, per-request overrides, and the `fromCache` response flag; add tests for hits,
  misses, TTL expiry, and custom cache keys.
