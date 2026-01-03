import { defineConfig } from 'tsup';

const createSharedTsupConfig = (overrides = {}) => {
    const {
        entry = ['src/index.ts'],
        format = ['esm', 'cjs'],
        dts = false,
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

export { createSharedTsupConfig };
export default createSharedTsupConfig;
