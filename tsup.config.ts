import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    platform: 'node',
    noExternal: ['simplex-noise'],
    banner: { js: '#!/usr/bin/env node' },
    dts: false,
    sourcemap: false,
  },
  {
    entry: { 'canvas/index': 'src/canvas/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
  },
])
