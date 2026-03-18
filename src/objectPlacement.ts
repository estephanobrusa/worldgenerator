import type { ObjectConfig } from './types.js'

export function placeObject(
  height: number,
  objects: ObjectConfig[],
  spawnPrng: () => number
): string | undefined {
  for (const obj of objects) {
    const roll = spawnPrng() * 100  // advance PRNG always, even if height check fails
    const meetsHeight =
      (obj.minHeight === undefined || height >= obj.minHeight) &&
      (obj.maxHeight === undefined || height <= obj.maxHeight)
    if (meetsHeight && roll < obj.probability) {
      return obj.name  // first-win: return immediately
    }
  }
  return undefined
}
