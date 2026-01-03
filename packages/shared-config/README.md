# @typed-sdk-stack/shared-config

Shared TypeScript and tsup settings for the `typed-sdk-stack` monorepo. These presets keep compiler flags and build outputs consistent so each package can focus on feature code instead of tooling drift.

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
  "extends": "@typed-sdk-stack/shared-config/tsconfig.packages.json",
  "compilerOptions": {
    "rootDir": "src",
    "tsBuildInfoFile": "tsconfig.tsbuildinfo"
  },
  "include": ["src"]
}
```

When a package introduces a dedicated build step, update its `package.json` entry points (`main`, `types`, `exports`) to reference the emitted `dist` artifacts instead of `src`. During development you can still reference `src` for faster iteration inside the monorepo.

## Shared tsup Config

Import the helper when defining a package-level `tsup.config.ts`:

```ts
import { createSharedTsupConfig } from '@typed-sdk-stack/shared-config/tsup.base';

export default createSharedTsupConfig({
  entry: ['src/index.ts'],
  dts: true,
});
```

The factory sets sensible defaults (ESM+CJS output, DTS, sourcemaps, treeshaking). Pass overrides for package-specific needs (e.g., enabling splitting or changing targets). Remember to re-point `package.json` `main/types` to `dist` once you publish.
