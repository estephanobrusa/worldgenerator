import { useState, useEffect, useRef } from 'react'
import { generate2DMap, generate3DMap } from 'procedural-map-gen'
import { renderMap } from 'procedural-map-gen/canvas'
import type { Map2D, Map3D, MapConfig } from 'procedural-map-gen'
import ThreeView from './ThreeView'
import BiomeEditor from './BiomeEditor'
import type { BiomeEntry } from './types'
import './App.css'

const INITIAL_BIOMES: BiomeEntry[] = [
  { name: 'ocean',    heightMin: 0.00, heightMax: 0.17, color: '#0d4f7a', objects: [] },
  { name: 'water',    heightMin: 0.17, heightMax: 0.34, color: '#1a6b9a', objects: [] },
  { name: 'plain',    heightMin: 0.34, heightMax: 0.51, color: '#7ec850', objects: [{ name: 'grass', probability: 10 }] },
  { name: 'forest',   heightMin: 0.51, heightMax: 0.67, color: '#2d7a2d', objects: [{ name: 'tree',  probability: 30 }] },
  { name: 'mountain', heightMin: 0.67, heightMax: 0.84, color: '#8b8b8b', objects: [{ name: 'rock',  probability: 20 }] },
  { name: 'desert',   heightMin: 0.84, heightMax: 1.00, color: '#e8c87a', objects: [{ name: 'cactus', probability: 15 }] },
]

const INITIAL_COLORS: Record<string, string> = {
  ocean:    '#0d4f7a',
  water:    '#1a6b9a',
  plain:    '#7ec850',
  land:     '#a8d878',
  forest:   '#2d7a2d',
  mountain: '#8b8b8b',
  desert:   '#e8c87a',
  sky:      '#87ceeb',
}

function countBiomes(map: Map2D): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of map) {
    for (const cell of row) {
      counts[cell.biome] = (counts[cell.biome] ?? 0) + 1
    }
  }
  return counts
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [width, setWidth] = useState(30)
  const [height, setHeight] = useState(20)
  const [seed, setSeed] = useState('world')
  // TODO: move mode, depth, cellSize, showObjects into a "display settings" state object
  const [mode, setMode] = useState<'2D' | '3D'>('2D')
  const [depth, setDepth] = useState(4)
  const [cellSize, setCellSize] = useState(10)
  const [showObjects, setShowObjects] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState(0)

  const [currentMap2D, setCurrentMap2D] = useState<Map2D | null>(null)
  const [currentMap3D, setCurrentMap3D] = useState<Map3D | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'canvas' | 'three'>('canvas')

  const [biomes, setBiomes] = useState<BiomeEntry[]>(INITIAL_BIOMES)
  const [biomeColors, setBiomeColors] = useState<Record<string, string>>(INITIAL_COLORS)

  // Derive biome counts and total cells from current map state
  const activeLayer: Map2D | null =
    mode === '2D'
      ? currentMap2D
      : currentMap3D?.[selectedLayer] ?? null

  const biomeCounts = activeLayer ? countBiomes(activeLayer) : {}
  const totalCells = activeLayer ? activeLayer.length * (activeLayer[0]?.length ?? 0) : 0

  function generateMap() {
    setError(null)
    try {
      const biomesWithRanges = biomes.map(b => ({
        name: b.name,
        objects: b.objects,
        heightRange: [b.heightMin, b.heightMax] as [number, number],
      }))

      const config: MapConfig = {
        width,
        height,
        seed,
        biomes: biomesWithRanges,
      }
      if (mode === '2D') {
        const map = generate2DMap(config)
        setCurrentMap2D(map)
        setCurrentMap3D(null)
        setSelectedLayer(0)
      } else {
        const map3d = generate3DMap({ ...config, depth })
        setCurrentMap3D(map3d)
        setCurrentMap2D(null)
        setSelectedLayer(0)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  // Generate on mount
  useEffect(() => {
    generateMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-regenerate when biomes change (height ranges, probabilities, names)
  useEffect(() => {
    generateMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biomes])
  // Render canvas whenever map or display settings change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !activeLayer) return

    try {
      renderMap(canvas, activeLayer, { cellSize, showObjects, colorMap: biomeColors })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [activeLayer, cellSize, showObjects, viewMode, biomeColors])

  //const maxLayer = mode === '3D' && currentMap3D ? currentMap3D.length - 1 : 0

  return (
    <div className="app">
      <header className="app-header">
        <h1>procedural-map-gen</h1>
        <span className="header-sub">interactive demo</span>
      </header>

      <div className="app-body">
        {/* Sidebar Controls */}
        <aside className="sidebar">
          <section className="control-group">
            <h2>Map Settings</h2>

            <label className="control-label">
              Width <span className="val">{width}</span>
              <input type="range" min={5} max={100} value={width}
                onChange={e => setWidth(Number(e.target.value))} />
            </label>

            <label className="control-label">
              Height <span className="val">{height}</span>
              <input type="range" min={5} max={60} value={height}
                onChange={e => setHeight(Number(e.target.value))} />
            </label>

            <label className="control-label">
              Seed
              <input type="text" className="seed-input" value={seed}
                onChange={e => setSeed(e.target.value)}
                placeholder="enter seed…" />
            </label>
          </section>

          {/* <section className="control-group">
            <h2>Render</h2>

            <div className="control-label">
              Mode
              <div className="toggle-group">
                <button
                  className={`toggle-btn ${mode === '2D' ? 'active' : ''}`}
                  onClick={() => setMode('2D')}
                >2D</button>
                <button
                  className={`toggle-btn ${mode === '3D' ? 'active' : ''}`}
                  onClick={() => setMode('3D')}
                >3D</button>
              </div>
            </div>

            {mode === '3D' && (
              <label className="control-label">
                Depth <span className="val">{depth}</span>
                <input type="range" min={2} max={10} value={depth}
                  onChange={e => setDepth(Number(e.target.value))} />
              </label>
            )}

            <label className="control-label">
              Cell Size <span className="val">{cellSize}px</span>
              <input type="range" min={4} max={24} value={cellSize}
                onChange={e => setCellSize(Number(e.target.value))} />
            </label>

            <label className="control-label checkbox-label">
              <input type="checkbox" checked={showObjects}
                onChange={e => setShowObjects(e.target.checked)} />
              Show Objects
            </label>
          </section> */}

          <section className="control-group">
            <h2>Biomes</h2>
            <BiomeEditor
              biomes={biomes}
              colors={biomeColors}
              onChange={(b, c) => { setBiomes(b); setBiomeColors(c) }}
            />
          </section>

          <button className="regen-btn" onClick={generateMap}>
            Regenerate
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {error && (
            <div className="error-banner">
              Error: {error}
            </div>
          )}

          {/* Layer selector for 3D */}
          {/* {mode === '3D' && currentMap3D && (
            <div className="layer-selector">
              <button
                className="layer-btn"
                disabled={selectedLayer <= 0}
                onClick={() => setSelectedLayer(l => Math.max(0, l - 1))}
              >&#8592;</button>
              <span className="layer-label">Layer {selectedLayer + 1} / {maxLayer + 1}</span>
              <button
                className="layer-btn"
                disabled={selectedLayer >= maxLayer}
                onClick={() => setSelectedLayer(l => Math.min(maxLayer, l + 1))}
              >&#8594;</button>
              <input type="range" min={0} max={maxLayer} value={selectedLayer}
                onChange={e => setSelectedLayer(Number(e.target.value))}
                className="layer-slider" />
            </div>
          )} */}

          {/* View toggle */}
          <div className="view-toggle">
            <span className="view-toggle-label">View</span>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${viewMode === 'canvas' ? 'active' : ''}`}
                onClick={() => setViewMode('canvas')}
              >Canvas 2D</button>
              <button
                className={`toggle-btn ${viewMode === 'three' ? 'active' : ''}`}
                onClick={() => setViewMode('three')}
              >Three.js 3D</button>
            </div>
          </div>

          {/* Canvas */}
          {viewMode === 'canvas' && (
            <div className="canvas-wrapper">
              <canvas ref={canvasRef} />
            </div>
          )}

          {/* Three.js 3D view */}
          {viewMode === 'three' && (
            <div className="three-wrapper">
              <ThreeView
                map2D={currentMap2D}
                map3D={currentMap3D}
                mode={mode}
                biomeColors={biomeColors}
              />
            </div>
          )}

          {/* Stats */}
          <div className="stats-panel">
            <div className="stats-meta">
              <span><span className="stat-key">seed</span> <code>{seed || '(empty)'}</code></span>
              <span><span className="stat-key">size</span> <code>{width}×{height}</code></span>
              <span><span className="stat-key">cells</span> <code>{totalCells}</code></span>
              {mode === '3D' && (
                <span><span className="stat-key">depth</span> <code>{depth}</code></span>
              )}
            </div>

            <div className="biome-table">
              <div className="biome-header">
                <span>Biome</span>
                <span>Count</span>
                <span>%</span>
                <span>Distribution</span>
              </div>
              {Object.entries(biomeCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([biome, count]) => {
                  const pct = totalCells > 0 ? ((count / totalCells) * 100).toFixed(1) : '0'
                  const color = biomeColors[biome] ?? '#cccccc'
                  return (
                    <div key={biome} className="biome-row">
                      <span className="biome-name">
                        <span className="biome-swatch" style={{ background: color }} />
                        {biome}
                      </span>
                      <span className="biome-count">{count}</span>
                      <span className="biome-pct">{pct}%</span>
                      <span className="biome-bar-wrap">
                        <span className="biome-bar"
                          style={{ width: `${pct}%`, background: color }} />
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
