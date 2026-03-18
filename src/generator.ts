import type { MapConfig, MapCell, Map2D, Map3D } from './types.js'
import { normalizeSeed, createPRNG } from './prng.js'
import { createNoiseFunction } from './noise.js'
import { assignBiome } from './biome.js'
import { placeObject } from './objectPlacement.js'
import { validateConfig } from './validation.js'

export function generate2DMap(config: MapConfig): Map2D {
  validateConfig(config)

  const numericSeed = normalizeSeed(config.seed)
  const noisePrng = createPRNG(numericSeed)
  const spawnPrng = createPRNG(numericSeed + 1)

  const noise = createNoiseFunction(noisePrng)

  const map: Map2D = []

  for (let y = 0; y < config.height; y++) {
    const row: MapCell[] = []
    for (let x = 0; x < config.width; x++) {
      const height = noise(x, y)
      const biome = assignBiome(height, 0, 0, config.biomes)
      const object = placeObject(height, biome.objects, spawnPrng)
      row.push({ x, y, biome: biome.name, height, object })
    }
    map.push(row)
  }

  return map
}

export function generate3DMap(config: MapConfig): Map3D {
  if (config.depth === undefined) {
    throw new Error('MapConfig.depth is required for generate3DMap')
  }
  validateConfig(config)

  const base = normalizeSeed(config.seed)
  const heightNoisePrng      = createPRNG((base ^ 0x12345678) >>> 0)
  const temperatureNoisePrng = createPRNG((base ^ 0x9ABCDEF0) >>> 0)
  const humidityNoisePrng    = createPRNG((base ^ 0xDEADBEEF) >>> 0)
  const spawnPrng            = createPRNG((base ^ 0xCAFEBABE) >>> 0)

  const heightNoise      = createNoiseFunction(heightNoisePrng)
  const temperatureNoise = createNoiseFunction(temperatureNoisePrng)
  const humidityNoise    = createNoiseFunction(humidityNoisePrng)

  const map: Map3D = []

  for (let z = 0; z < config.depth!; z++) {
    const layer: MapCell[][] = []
    for (let y = 0; y < config.height; y++) {
      const row: MapCell[] = []
      for (let x = 0; x < config.width; x++) {
        const height      = heightNoise(x, y)
        const temperature = temperatureNoise(x, y)
        const humidity    = humidityNoise(x, y)
        const biome       = assignBiome(height, temperature, humidity, config.biomes)
        const object      = placeObject(height, biome.objects, spawnPrng)
        row.push({ x, y, z, biome: biome.name, height, temperature, humidity, object })
      }
      layer.push(row)
    }
    map.push(layer)
  }

  return map
}
