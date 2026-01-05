# Feature: Cache & Logging Follow-ups

## Scope
Implement the outstanding work captured under the “Caching (follow-up)” and “Logging (follow-up)” sections of `core-todos.md`.

## Deliverables
1. **TTL regression tests** ✅
   - Added unit + integration coverage proving per-request `ttl` values expire cached responses and trigger fresh fetches.
2. **Cache README example** ✅
   - Documented how to inject a custom Keyv instance (e.g., Redis) and how per-request TTL overrides interact with the store-level TTL.
3. **Cache metrics surface** ✅
   - Responses now include `cacheMetrics { hits, misses }`, reflecting per-client counters so SDKs can read stats without parsing logs.
4. **Logging README example** ✅
   - Documented how to supply a `pinoInstance`, tweak levels, and what structured log events the client emits by default.
5. **Secret redaction test** ✅
   - Added a regression test (`RapidApiClient > logging > redacts rapidApiKey in logs even with custom logger`) that captures log output and ensures secrets are masked.
6. **Logging extension hook**
   - Provide a lightweight mechanism (callback or hook) allowing SDKs to inject extra metadata into each log message without forking `RapidApiClient`.

## Questions / Clarifications
1. (Resolved) Surface cache stats via per-response metadata; cumulative counters now exposed through `response.cacheMetrics`.
2. Where should the logging extension hook live? (e.g., an optional callback in `RapidApiClientParams`, or a `loggerTransform` method override?)
3. Are there additional secrets besides `rapidApiKey` we should proactively redact (e.g., payload fields flagged by SDK authors)?
