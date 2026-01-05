# Feature: Documentation & Tooling

## Open Questions
1. Do you want TypeDoc output published automatically (e.g., GitHub Pages via Docusaurus) or checked into the repo?
2. Should docs cover internal APIs (error classes, hooks) or just public SDK usage?
3. Any branding/style requirements for Docusaurus (themes, navigation, versioning)?

## Implementation Notes
- Configure TypeDoc to generate API docs for `@typed-sdk-stack/core`, integrate the output with Docusaurus (or another static site generator) for publishing.
- Expand `packages/core/README.md` with usage examples for each major feature (client config, caching, retries, hooks, errors) and link to the generated docs.
- Add CI automation (GitHub Action) to build docs on release branches and optionally deploy to GitHub Pages or another hosting target.
- Ensure AGENTS.md reflects documentation workflows so contributors understand how to update docs.
