# Feature: Cache & Logging Follow-ups

## Scope
Implement the outstanding work captured under the “Caching (follow-up)” and “Logging (follow-up)” sections of `core-todos.md`.

## Deliverables
1. **TTL regression tests**
   - Add unit/integration coverage proving that per-request `ttl` values expire cached responses and force new upstream calls after expiry.
2. **Cache README example**
   - Document in `packages/core/README.md` how to inject a custom Keyv instance (e.g., Redis) and how per-request TTL overrides interact with store-level TTL.
3. **Cache metrics surface**
   - Expose cache hit/miss counters (or similar metadata) via the client or response DTO so SDKs can consume metrics without parsing logs.
4. **Logging README example**
   - Document how to supply a `pinoInstance`, adjust log levels, and what the default structured log entries look like.
5. **Secret redaction test**
   - Ensure `rapidApiKey` (and future secrets) never appear in logs; add a regression test that inspects emitted payloads.
6. **Logging extension hook**
   - Provide a lightweight mechanism (callback or hook) allowing SDKs to inject extra metadata into each log message without forking `RapidApiClient`.

## Questions / Clarifications
1. For cache metrics, should the client expose cumulative counters, per-request metadata (e.g., `response.cacheMetrics`), or both?
2. Where should the logging extension hook live? (e.g., an optional callback in `RapidApiClientParams`, or a `loggerTransform` method override?)
3. Are there additional secrets besides `rapidApiKey` we should proactively redact (e.g., payload fields flagged by SDK authors)?
