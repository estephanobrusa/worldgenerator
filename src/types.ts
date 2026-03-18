export type ObjectConfig = {
  name: string
  probability: number  // 0-100
  minHeight?: number
  maxHeight?: number
}

export type BiomeConfig = {
  name: string
  objects: ObjectConfig[]
  heightRange?: [number, number]
  temperatureRange?: [number, number]
  humidityRange?: [number, number]
}

export type MapConfig = {
  width: number
  height: number
  depth?: number
  seed: string | number
  biomes: BiomeConfig[]
}

export type MapCell = {
  x: number
  y: number
  z?: number
  biome: string
  height: number
  temperature?: number
  humidity?: number
  object?: string
}

export type Map2D = MapCell[][]

export type Map3D = MapCell[][][]
