# @typed-sdk-stack/typescript-config

Shared TypeScript compiler settings for the `typed-sdk-stack` monorepo. These presets keep strictness flags consistent across every workspace so each package can focus on source code instead of config drift.

## Available Configs

### `tsconfig.json`
Base configuration consumed by the rest of the repo:
- ESNext target and libraries
- Bundler-friendly module resolution
- Strict type checking plus defensive flags (e.g., `noUncheckedIndexedAccess`)
- Disabled emit (we rely on downstream build tooling)

### `tsconfig.packages.json`
Extends the base config with options suitable for internal packages:
- `composite`, `declaration`, and `declarationMap` enabled to unblock project references later
- Designed for source-first development; packages can point `main` to `src/index.ts` during development and switch to `dist` at publish time

## Usage

Extend the preset that matches your workspace:

```jsonc
{
  "extends": "@typed-sdk-stack/typescript-config/tsconfig.packages.json",
  "compilerOptions": {
    "rootDir": "src",
    "tsBuildInfoFile": "tsconfig.tsbuildinfo"
  },
  "include": ["src"]
}
```

When a package introduces a dedicated build step, update its `package.json` entry points (`main`, `types`, `exports`) to reference the emitted `dist` artifacts instead of `src`. During development you can still reference `src` for faster iteration inside the monorepo.
