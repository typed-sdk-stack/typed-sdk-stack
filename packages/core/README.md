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
* Returns a serializable response DTO (status/data/headers/duration/request metadata) that SDKs can override by subclassing `buildResponseDto`
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
* TTL configuration per endpoint
* Deterministic cache key helpers

Caching is opt-in and transparent.

---

### 5. Rate Limit Awareness

RapidAPI-aware rate handling:

* Soft throttling helpers
* Retry-after respect (when present)
* Provider-specific limits handled in vendor SDKs

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

---

### 11. Testing Utilities

SDK-focused test helpers:

* Mock RapidAPI client
* Mock vendor responses
* Deterministic fixtures
* Cache isolation

Designed for fast, reliable SDK testing.

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
