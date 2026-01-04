# Feature: Testing Utilities

## Open Questions
1. What helpers would best support SDK authors—mock RapidApiClient, fixture generators, snapshot tools?
2. Should we ship pre-built mocks (axios-mock-adapter wrappers) or just documented patterns?
3. Do you expect integration-test support (record/replay) or solely unit-test scaffolding?

## Implementation Notes
- Provide a mockable RapidApiClient (e.g., lightweight class with programmable responses) and helper assertions for Bun tests.
- Publish fixture factories or serializers for common RapidAPI response shapes to reduce boilerplate in SDK tests.
- Document recommended testing patterns (axios-mock-adapter usage, environment setup, fixture organization) in README/AGENTS.
- Add tests for the utilities themselves to ensure deterministic behavior.
