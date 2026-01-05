# @typed-sdk-stack/core

The **core** package is the foundation of the `typed-sdk-stack` monorepo. It provides **shared infrastructure specifically for building typed SDKs for APIs published on the RapidAPI marketplace**.

This package exists to eliminate repeated boilerplate across RapidAPI SDKs while enforcing **consistent typing, error handling, caching, and request behavior**.

The core package is **RapidAPI-focused by design**. It does not attempt to be a universal data-ingestion framework.

---

## 🎯 Design Goals

* Purpose-built for RapidAPI APIs
* Strong TypeScript typing end-to-end
* One mental model across all RapidAPI SDKs
* Safe defaults (timeouts, retries, rate awareness)
* Cache-aware but not a proxy
* Simple to extend for new RapidAPI vendors

---

## 🧩 Core Features

### 1. RapidAPI Client Abstraction

A first-class RapidAPI HTTP client that:

* Automatically injects `x-rapidapi-key` and `x-rapidapi-host`
* Supports per-request or per-client keys
* Uses Axios under the hood so behavior is consistent across Node, Bun, and edge runtimes
* Optional Pino-based logging (pass `pinoInstance` to surface request lifecycle logs)
* Returns a serializable response DTO (status/data/headers/duration/request metadata + `fromCache` + `cacheMetrics`) that SDKs can override by subclassing `buildResponseDto`
* Ships with a `CacheManager` helper so SDKs can inject custom Keyv stores or reuse the default namespaced cache
* Supports pluggable metrics trackers (defaults to in-memory) so cache/request metrics can be forwarded to any observability system
* Normalizes RapidAPI request/response behavior

All vendor SDKs build on this client.

---

### 2. Vendor SDK Base Class

A shared base class for RapidAPI vendor SDKs providing:

* Base URL handling
* Header management
* Request helpers
* Consistent method signatures

This ensures all vendor SDKs feel the same to consumers.

---

### 3. Authentication & Key Management

Built-in support for:

* Single RapidAPI key
* Multi-tenant / per-user keys
* Runtime key switching
* Bring-Your-Own-Key (BYOK) usage

Keys are treated as data, not globals.

---

### 4. Caching Primitives

Explicit caching utilities designed for RapidAPI usage:

* In-memory cache
* Redis-compatible adapters
* TTL configuration per endpoint (per-request via `ttl`)
* Deterministic cache key helpers (`CacheManager.createCacheKey()` combines method/url/params/payload/metadata)
* Extensible `CacheManager` that can be constructed with your own `Keyv` instance (Redis, SQLite, etc.) or reused from `RapidApiClient`
* Opt-in request-level caching controls (`cacheKey` override + `ttl`) and default GET caching with cache-hit/miss logging; responses include `fromCache` plus running `cacheMetrics` (`{ hits, misses }`)

Caching request options:

* `cache` — boolean to force caching (`true`) or skip caching entirely (`false`) regardless of HTTP method.
* `cacheKey` — override the derived key so non-GET calls can be cached deterministically; also enables caching when provided.
* `ttl` — provide a per-request TTL (milliseconds) passed to Keyv; falls back to the store default.

Caching is opt-in and transparent.

#### Example: Bring-your-own cache + TTL overrides

```ts
import Keyv from '@keyvhq/redis';
import { RapidApiClient } from '@typed-sdk-stack/core';

const redisCache = new Keyv('redis://localhost:6379', {
    namespace: 'weather-prod',
    ttl: 60_000, // default TTL for any entry without a per-request override
});

const client = new RapidApiClient({
    rapidApiKey: process.env.RAPID_API_KEY!,
    rapidApiHost: 'weatherapi-com.p.rapidapi.com',
    keyvInstance: redisCache,
});

await client.request({
    method: 'get',
    uri: '/current.json',
    params: { q: '53.1,-0.13' },
    cache: true,
    ttl: 5_000, // overrides the store default just for this call
});
```

Per-request `ttl` always wins; when it is omitted the underlying Keyv instance controls expiry (e.g., Redis TTL). Custom
stores can be anything Keyv supports (Redis, SQLite, in-memory) so SDKs can reuse existing infrastructure.

---

### 5. Rate Limit Awareness

RapidAPI-aware rate handling:

* Soft throttling helpers
* Retry-after respect (when present)
* Provider-specific limits handled in vendor SDKs
* Dedicated `RateLimitTracker` helper (Keyv-backed) that stores the latest RapidAPI headers and surfaces them through response metadata/hooks

The core never attempts to bypass RapidAPI limits.

---

### 6. Retry & Resilience Utilities

Configurable retry helpers:

* Exponential backoff
* Jitter
* Retry-on network or 5xx errors

Retries are conservative by default and configurable per SDK.

---

### 7. Error Normalization

All RapidAPI errors are normalized into a shared error model:

* Network errors
* Timeout errors
* Auth / invalid-key errors
* Rate-limit errors
* Vendor response errors

Consumers never depend on vendor-specific error formats.

---

### 8. Response Mapping Helpers

Utilities to:

* Map vendor responses into stable SDK return types
* Apply defaults
* Strip RapidAPI-specific artifacts

Vendor SDKs expose clean, typed results.

---

### 9. Optional Runtime Validation

Optional schema validation using:

* Zod

Used to:

* Detect upstream RapidAPI schema changes
* Fail fast during development

Disabled by default in production builds.

---

### 10. Observability Hooks

Hook points for:

* Request timing
* Cache hits / misses
* Retry counts
* Error rates

Hooks are framework-agnostic and optional.

#### Example: Structured logging with Pino

```ts
import pino from 'pino';
import { RapidApiClient } from '@typed-sdk-stack/core';

const logger = pino({ level: 'debug' });

const client = new RapidApiClient({
    rapidApiKey: process.env.RAPID_API_KEY!,
    rapidApiHost: 'weatherapi-com.p.rapidapi.com',
    pinoInstance: logger,
});

await client.request({
    method: 'get',
    uri: '/current.json',
    params: { q: '53.1,-0.13' },
});
```

The client emits structured events (`rapidapi.request.start`, `rapidapi.request.success`, `rapidapi.request.failure`,
`rapidapi.cache.hit`, `rapidapi.cache.miss`, `rapidapi.cache.store`) with metadata such as method, uri, params, duration,
and cache keys. Secrets (e.g., `rapidApiKey`) are automatically redacted, so adjusting log verbosity is as simple as
changing the provided Pino instance’s level.

---

### 11. Testing Utilities

SDK-focused test helpers:

* Mock RapidAPI client
* Mock vendor responses
* Deterministic fixtures
* Cache isolation

Designed for fast, reliable SDK testing.

Live integration tests are available in `tests/Integration.test.ts`. They are skipped by default; run
`RUN_RAPID_API_TESTS=true RAPID_API_KEY=... bun test tests/Integration.test.ts` (optionally override host/params via env) to hit a real RapidAPI endpoint without affecting the regular `bun run test` suite.

---

### 12. Clear Scope Boundaries

The core package:

* Knows what RapidAPI is
* Knows how RapidAPI requests work
* Knows nothing about business domains (NBA, travel, finance, etc.)

Domain logic belongs in higher-level packages.

---

## 🚫 Explicit Non-Goals

The core package will **not**:

* Aggregate or analyze data
* Provide predictions or intelligence
* Expose public HTTP APIs
* Contain domain-specific logic
* Act as a RapidAPI proxy service

---

## 🧱 Intended Consumers

* RapidAPI vendor SDK packages
* Aggregate SDKs built on multiple RapidAPI vendors
* Internal tooling for RapidAPI integrations

---

## 🧠 Philosophy

> This package exists to make RapidAPI SDKs boring—in the best way.
>
> If two SDKs behave differently, it is a bug.
