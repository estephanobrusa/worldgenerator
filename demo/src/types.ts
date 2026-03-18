export interface BiomeEntry {
  name: string
  heightMin: number
  heightMax: number
  color: string
  objects: { name: string; probability: number }[]
}
