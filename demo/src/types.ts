export interface BiomeEntry {
  name: string
  heightMin: number
  heightMax: number
  color: string
  weight: number  // relative weight 0–100, normalised to 100% across all biomes
  objects: { name: string; probability: number }[]
}
