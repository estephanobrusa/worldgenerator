import type { MapConfig } from './types.js'

export function validateConfig(config: MapConfig): void {
  if (!config.biomes || config.biomes.length === 0) {
    throw new Error('MapConfig.biomes must contain at least one biome')
  }
  if (config.width <= 0 || !Number.isInteger(config.width)) {
    throw new Error('MapConfig.width must be a positive integer')
  }
  if (config.height <= 0 || !Number.isInteger(config.height)) {
    throw new Error('MapConfig.height must be a positive integer')
  }
  if (config.depth !== undefined && (config.depth <= 0 || !Number.isInteger(config.depth))) {
    throw new Error('MapConfig.depth must be a positive integer when provided')
  }
  for (const biome of config.biomes) {
    for (const obj of biome.objects) {
      if (obj.probability < 0 || obj.probability > 100) {
        throw new Error(`Object "${obj.name}" in biome "${biome.name}" has invalid probability ${obj.probability} (must be 0-100)`)
      }
      if (obj.minHeight !== undefined && obj.maxHeight !== undefined && obj.minHeight > obj.maxHeight) {
        throw new Error(`Object "${obj.name}" in biome "${biome.name}" has minHeight > maxHeight`)
      }
    }
  }
}
