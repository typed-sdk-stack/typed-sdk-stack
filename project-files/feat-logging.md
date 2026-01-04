# Feature: Logging

## Decisions

1. **Logging backend:** Extend `RapidApiClientParams` to accept a `pino.Logger` (or compatible interface) and rely on it for configuration/output.
2. **Logging approach:** Log directly inside `RapidApiClient` (e.g., `logger.debug({...}, 'sending request')`), deferring hook-based logging for later.
3. **Log levels:** Managed by the provided pino instance; expose the logger so users can adjust levels at runtime.
4. **Sensitive data:** Never log `rapidApiKey`; mask or omit any secret fields by default.

## Additional Notes

1. **Structured payloads:** Log payloads/params in full (no truncation), unless users sanitize them before logging.
2. **Default logger behavior:** When no logger is supplied, instantiate pino with level `silent` to avoid noisy output while preserving a consistent interface.

## Implementation Notes

- Extend `RapidApiClientParams` with an optional logger (pino or compatible interface). If none is provided, instantiate a pino logger set to `silent`.
- Instrument `RapidApiClient` to emit structured log messages for request start, success, failure, retries, and cache events, leveraging observability hooks.
- Provide helper functions so SDKs can register additional logging hooks if needed (e.g., capturing extra metadata).
- Ensure sensitive fields (RapidAPI keys) are always masked/omitted; payloads/params are logged verbatim unless the caller sanitizes them first.
- Document how to pass a pino instance and adjust log levels at runtime; add tests verifying logs fire with expected metadata without leaking secrets.
