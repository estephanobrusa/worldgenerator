import { describe, it, expect } from 'vitest'
import { assignBiome } from '../src/biome.js'
import type { BiomeConfig } from '../src/types.js'

const biomes: BiomeConfig[] = [
  { name: 'water', objects: [] },
  { name: 'plain', objects: [] },
  { name: 'mountain', objects: [] },
]

describe('assignBiome', () => {
  it('height 0.0 → first biome', () => {
    expect(assignBiome(0, 0, 0, biomes).name).toBe('water')
  })
  it('height 1.0 → last biome', () => {
    expect(assignBiome(1.0, 0, 0, biomes).name).toBe('mountain')
  })
  it('height at threshold boundary → next biome', () => {
    expect(assignBiome(1/3, 0, 0, biomes).name).toBe('plain')
  })
  it('height just below threshold → current biome', () => {
    expect(assignBiome(1/3 - 0.001, 0, 0, biomes).name).toBe('water')
  })
  it('single biome always returns it', () => {
    const single = [{ name: 'only', objects: [] }]
    expect(assignBiome(0, 0, 0, single).name).toBe('only')
    expect(assignBiome(0.5, 0, 0, single).name).toBe('only')
    expect(assignBiome(1.0, 0, 0, single).name).toBe('only')
  })
})

describe('assignBiome - V2 range matching', () => {
  const rangeBiomes: BiomeConfig[] = [
    { name: 'deep-sea', objects: [], heightRange: [0, 0.3] },
    { name: 'shallow', objects: [], heightRange: [0.3, 0.6], temperatureRange: [0, 0.5] },
    { name: 'tropical', objects: [], heightRange: [0.3, 0.6], temperatureRange: [0.5, 1.0], humidityRange: [0.6, 1.0] },
    { name: 'desert', objects: [] }, // fallback (no ranges = wildcard)
  ]

  it('selects biome by heightRange alone', () => {
    expect(assignBiome(0.15, 0.5, 0.5, rangeBiomes).name).toBe('deep-sea')
  })

  it('selects biome by heightRange + temperatureRange', () => {
    expect(assignBiome(0.45, 0.3, 0.5, rangeBiomes).name).toBe('shallow')
  })

  it('selects biome by all three ranges', () => {
    expect(assignBiome(0.45, 0.7, 0.8, rangeBiomes).name).toBe('tropical')
  })

  it('falls back to last biome when no range matches', () => {
    expect(assignBiome(0.9, 0.9, 0.9, rangeBiomes).name).toBe('desert')
  })

  it('wildcard biome (no ranges) matches everything', () => {
    const wildcardOnly: BiomeConfig[] = [{ name: 'any', objects: [] }]
    // has no ranges -> V1 threshold path, but single biome always returns itself
    expect(assignBiome(0.99, 0.99, 0.99, wildcardOnly).name).toBe('any')
  })

  it('inRange includes both bounds (inclusive)', () => {
    const exact: BiomeConfig[] = [
      { name: 'exact', objects: [], heightRange: [0.5, 0.5] },
      { name: 'other', objects: [] }
    ]
    expect(assignBiome(0.5, 0, 0, exact).name).toBe('exact')
  })

  it('V1 backward compat: no-range biomes still use threshold bucketing', () => {
    const noRangeBiomes: BiomeConfig[] = [
      { name: 'water', objects: [] },
      { name: 'plain', objects: [] },
      { name: 'mountain', objects: [] }
    ]
    expect(assignBiome(0, 0, 0, noRangeBiomes).name).toBe('water')
    expect(assignBiome(1/3, 0, 0, noRangeBiomes).name).toBe('plain')
    expect(assignBiome(1.0, 0, 0, noRangeBiomes).name).toBe('mountain')
  })
})
