import type { BiomeConfig } from './types.js'

function inRange(value: number, range?: [number, number]): boolean {
  if (range === undefined) return true
  return value >= range[0] && value <= range[1]
}

function hasRanges(biomes: BiomeConfig[]): boolean {
  return biomes.some(
    b => b.heightRange !== undefined || b.temperatureRange !== undefined || b.humidityRange !== undefined
  )
}

export function assignBiome(
  height: number,
  temperature: number,
  humidity: number,
  biomes: BiomeConfig[]
): BiomeConfig {
  if (!hasRanges(biomes)) {
    // V1 path: equal-width threshold buckets based on height only
    const n = biomes.length
    for (let i = 0; i < n - 1; i++) {
      if (height < (i + 1) / n) {
        return biomes[i]
      }
    }
    return biomes[n - 1]
  }

  // V2 path: range matching across height, temperature, humidity
  for (const biome of biomes) {
    if (
      inRange(height, biome.heightRange) &&
      inRange(temperature, biome.temperatureRange) &&
      inRange(humidity, biome.humidityRange)
    ) {
      return biome
    }
  }
  return biomes[biomes.length - 1] // fallback: last biome
}
