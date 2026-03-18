import { describe, it, expect } from 'vitest'
import { generate2DMap, generate3DMap } from '../src/generator.js'
import type { MapConfig } from '../src/types.js'

const testConfig: MapConfig = {
  width: 10,
  height: 10,
  seed: 'test-seed',
  biomes: [
    {
      name: 'water',
      objects: [{ name: 'fish', probability: 30 }]
    },
    {
      name: 'plain',
      objects: [{ name: 'tree', probability: 20 }]
    },
    {
      name: 'mountain',
      objects: [{ name: 'rock', probability: 10, minHeight: 0.7 }]
    }
  ]
}

describe('generate2DMap', () => {
  it('returns Map2D with correct dimensions', () => {
    const map = generate2DMap(testConfig)
    expect(map).toHaveLength(10)
    map.forEach(row => expect(row).toHaveLength(10))
  })
  it('each cell has correct x, y coordinates', () => {
    const map = generate2DMap(testConfig)
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        expect(map[y][x].x).toBe(x)
        expect(map[y][x].y).toBe(y)
      }
    }
  })
  it('each cell has a valid biome name from config', () => {
    const map = generate2DMap(testConfig)
    const biomeNames = new Set(testConfig.biomes.map(b => b.name))
    map.flat().forEach(cell => expect(biomeNames.has(cell.biome)).toBe(true))
  })
  it('each cell height is in [0, 1]', () => {
    const map = generate2DMap(testConfig)
    map.flat().forEach(cell => {
      expect(cell.height).toBeGreaterThanOrEqual(0)
      expect(cell.height).toBeLessThanOrEqual(1)
    })
  })
  it('is deterministic — same seed produces identical output', () => {
    const map1 = generate2DMap(testConfig)
    const map2 = generate2DMap(testConfig)
    expect(JSON.stringify(map1)).toBe(JSON.stringify(map2))
  })
  it('different seeds produce different outputs', () => {
    const map1 = generate2DMap({ ...testConfig, seed: 'seed-a' })
    const map2 = generate2DMap({ ...testConfig, seed: 'seed-b' })
    expect(JSON.stringify(map1)).not.toBe(JSON.stringify(map2))
  })
  it('is JSON-serializable', () => {
    const map = generate2DMap(testConfig)
    expect(() => JSON.stringify(map)).not.toThrow()
    const parsed = JSON.parse(JSON.stringify(map))
    expect(parsed).toHaveLength(10)
  })
  it('throws on empty biomes', () => {
    expect(() => generate2DMap({ ...testConfig, biomes: [] })).toThrow()
  })
  it('throws on invalid dimensions', () => {
    expect(() => generate2DMap({ ...testConfig, width: 0 })).toThrow()
    expect(() => generate2DMap({ ...testConfig, height: -1 })).toThrow()
  })
  it('throws on out-of-range probability', () => {
    expect(() => generate2DMap({
      ...testConfig,
      biomes: [{ name: 'test', objects: [{ name: 'x', probability: 150 }] }]
    })).toThrow()
  })
  it('1×1 map works', () => {
    const map = generate2DMap({ ...testConfig, width: 1, height: 1 })
    expect(map).toHaveLength(1)
    expect(map[0]).toHaveLength(1)
  })
  it('performance: 500×500 completes in under 3 seconds', () => {
    const start = Date.now()
    generate2DMap({ ...testConfig, width: 500, height: 500 })
    expect(Date.now() - start).toBeLessThan(3000)
  })
})

it('v1 snapshot — generate2DMap output is byte-identical', () => {
  const snapshotConfig: MapConfig = {
    seed: 'snapshot-v1',
    width: 10,
    height: 10,
    biomes: [
      { name: 'ocean', objects: [{ name: 'fish', probability: 40 }] },
      { name: 'land', objects: [{ name: 'tree', probability: 20 }] }
    ]
  }
  expect(generate2DMap(snapshotConfig)).toMatchSnapshot()
})

const config3D: MapConfig = {
  width: 10,
  height: 10,
  depth: 5,
  seed: 'test-3d',
  biomes: [
    { name: 'underground', objects: [], heightRange: [0, 0.4] },
    { name: 'surface', objects: [{ name: 'tree', probability: 20 }], heightRange: [0.4, 0.8] },
    { name: 'sky', objects: [{ name: 'cloud', probability: 30 }] }
  ]
}

describe('generate3DMap', () => {
  it('returns Map3D with correct depth/height/width dimensions', () => {
    const map = generate3DMap(config3D)
    expect(map).toHaveLength(5)  // depth
    map.forEach(layer => {
      expect(layer).toHaveLength(10)  // height
      layer.forEach(row => expect(row).toHaveLength(10))  // width
    })
  })

  it('each cell has correct x, y, z coordinates', () => {
    const map = generate3DMap(config3D)
    for (let z = 0; z < 5; z++) {
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(map[z][y][x].x).toBe(x)
          expect(map[z][y][x].y).toBe(y)
          expect(map[z][y][x].z).toBe(z)
        }
      }
    }
  })

  it('each cell temperature is in [0, 1]', () => {
    const map = generate3DMap(config3D)
    map.flat(2).forEach(cell => {
      expect(cell.temperature).toBeGreaterThanOrEqual(0)
      expect(cell.temperature).toBeLessThanOrEqual(1)
    })
  })

  it('each cell humidity is in [0, 1]', () => {
    const map = generate3DMap(config3D)
    map.flat(2).forEach(cell => {
      expect(cell.humidity).toBeGreaterThanOrEqual(0)
      expect(cell.humidity).toBeLessThanOrEqual(1)
    })
  })

  it('is deterministic — same seed produces identical output', () => {
    const map1 = generate3DMap(config3D)
    const map2 = generate3DMap(config3D)
    expect(JSON.stringify(map1)).toBe(JSON.stringify(map2))
  })

  it('different seeds produce different outputs', () => {
    const map1 = generate3DMap({ ...config3D, seed: '3d-a' })
    const map2 = generate3DMap({ ...config3D, seed: '3d-b' })
    expect(JSON.stringify(map1)).not.toBe(JSON.stringify(map2))
  })

  it('depth=1 edge case: single layer, no NaN or Infinity', () => {
    const map = generate3DMap({ ...config3D, depth: 1 })
    expect(map).toHaveLength(1)
    map.flat(2).forEach(cell => {
      expect(Number.isFinite(cell.height)).toBe(true)
      expect(Number.isFinite(cell.temperature!)).toBe(true)
      expect(Number.isFinite(cell.humidity!)).toBe(true)
    })
  })

  it('throws when depth is missing', () => {
    const noDepth = { ...config3D, depth: undefined }
    expect(() => generate3DMap(noDepth)).toThrow()
  })

  it('throws when depth is 0', () => {
    expect(() => generate3DMap({ ...config3D, depth: 0 })).toThrow()
  })

  it('throws when depth is non-integer', () => {
    expect(() => generate3DMap({ ...config3D, depth: 2.5 })).toThrow()
  })

  it('generate2DMap is unaffected — z/temperature/humidity are undefined', () => {
    const map = generate2DMap(testConfig)
    map.flat().forEach(cell => {
      expect(cell.z).toBeUndefined()
      expect(cell.temperature).toBeUndefined()
      expect(cell.humidity).toBeUndefined()
    })
  })

  it('V1-style biomes (no ranges) work in generate3DMap', () => {
    const v1StyleConfig: MapConfig = {
      ...config3D,
      biomes: [
        { name: 'water', objects: [] },
        { name: 'land', objects: [] }
      ]
    }
    const map = generate3DMap(v1StyleConfig)
    const names = new Set(['water', 'land'])
    map.flat(2).forEach(cell => expect(names.has(cell.biome)).toBe(true))
  })

  it('is JSON-serializable', () => {
    const map = generate3DMap(config3D)
    expect(() => JSON.stringify(map)).not.toThrow()
  })

  it('performance: 100×100×10 completes in under 2 seconds', () => {
    const start = Date.now()
    generate3DMap({ ...config3D, width: 100, height: 100, depth: 10 })
    expect(Date.now() - start).toBeLessThan(2000)
  })
})
