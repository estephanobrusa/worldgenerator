# Changelog

## [1.0.0] - 2026-03-18

### Added
- `generate2DMap()` — 2D procedural map generation with height-based biome assignment
- `generate3DMap()` — 3D map generation with temperature and humidity noise layers
- Multi-axis biome range matching for 3D maps
- Deterministic PRNG (FNV-1a seed hashing + mulberry32)
- Object placement with per-biome spawn rules
- Input validation with descriptive errors
- Canvas rendering via `procedural-map-gen/canvas` subpath export
- CLI tool (`pmg`) for terminal map generation
- Full TypeScript types, ESM + CJS dual build
