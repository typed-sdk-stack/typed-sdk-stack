import { defineConfig, type Options } from 'tsup';

type SharedOptions = Options;

/**
 * Shared tsup config factory so every package emits consistent JS + DTS artifacts.
 * Packages can override any option by passing their own values in `overrides`.
 */
export const createSharedTsupConfig = (overrides: SharedOptions = {}) => {
    const {
        entry = ['src/index.ts'],
        format = ['esm', 'cjs'],
        dts = true,
        sourcemap = true,
        clean = true,
        target = 'es2022',
        minify = false,
        splitting = false,
        ...rest
    } = overrides;

    return defineConfig({
        entry,
        format,
        dts,
        sourcemap,
        clean,
        target,
        minify,
        splitting,
        treeshake: true,
        outDir: 'dist',
        ...rest,
    });
};

export default createSharedTsupConfig;
