/// <reference lib="dom" />
import type { Map2D } from '../types.js'

export interface RenderOptions {
  cellSize?: number
  colorMap?: Record<string, string>
  showObjects?: boolean
}

const DEFAULT_COLORS: Record<string, string> = {
  water: '#1a6b9a',
  ocean: '#0d4f7a',
  plain: '#7ec850',
  land: '#a8d878',
  mountain: '#8b8b8b',
  forest: '#2d7a2d',
  desert: '#e8c87a',
  sky: '#87ceeb',
}

export function renderMap(
  canvas: HTMLCanvasElement,
  map: Map2D,
  options: RenderOptions = {}
): void {
  const cellSize = options.cellSize ?? 8
  const colorMap = { ...DEFAULT_COLORS, ...(options.colorMap ?? {}) }
  const showObjects = options.showObjects ?? false

  const mapHeight = map.length
  const mapWidth = mapHeight > 0 ? map[0].length : 0

  canvas.width = mapWidth * cellSize
  canvas.height = mapHeight * cellSize

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context from canvas')

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const cell = map[y][x]
      ctx.fillStyle = colorMap[cell.biome] ?? '#cccccc'
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

      if (showObjects && cell.object) {
        ctx.fillStyle = '#000000'
        const dotSize = Math.max(2, cellSize * 0.25)
        ctx.fillRect(
          x * cellSize + (cellSize - dotSize) / 2,
          y * cellSize + (cellSize - dotSize) / 2,
          dotSize,
          dotSize
        )
      }
    }
  }
}
