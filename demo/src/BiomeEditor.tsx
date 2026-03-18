import { useState } from 'react'
import type { BiomeEntry } from './types'

interface BiomeEditorProps {
  biomes: BiomeEntry[]
  colors: Record<string, string>
  onChange: (biomes: BiomeEntry[], colors: Record<string, string>) => void
}

export default function BiomeEditor({ biomes, colors, onChange }: BiomeEditorProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  function updateBiome(index: number, patch: Partial<BiomeEntry>) {
    const updated = biomes.map((b, i) => i === index ? { ...b, ...patch } : b)
    onChange(updated, buildColors(updated, colors))
  }

  function updateColor(index: number, color: string) {
    const biome = biomes[index]
    const updatedBiomes = biomes.map((b, i) => i === index ? { ...b, color } : b)
    onChange(updatedBiomes, { ...colors, [biome.name]: color })
  }

  function updateName(index: number, newName: string) {
    const oldName = biomes[index].name
    const updatedBiomes = biomes.map((b, i) => i === index ? { ...b, name: newName } : b)
    const updatedColors: Record<string, string> = {}
    for (const [k, v] of Object.entries(colors)) {
      updatedColors[k === oldName ? newName : k] = v
    }
    onChange(updatedBiomes, updatedColors)
  }

  function deleteBiome(index: number) {
    if (biomes.length <= 1) return
    const removed = biomes[index]
    const remaining = biomes.filter((_, i) => i !== index)
    const updatedColors = { ...colors }
    delete updatedColors[removed.name]
    onChange(remaining, updatedColors)
  }

  function addBiome() {
    const newBiome: BiomeEntry = {
      name: 'new',
      heightMin: 0.0,
      heightMax: 0.1,
      color: '#ffffff',
      objects: [],
    }
    onChange([...biomes, newBiome], { ...colors, new: '#ffffff' })
  }

  return (
    <div className="biome-editor">
      {biomes.map((biome, i) => {
        const invalid = biome.heightMin >= biome.heightMax
        const isExpanded = expandedRow === i
        const minPct = Math.round(biome.heightMin * 100)
        const maxPct = Math.round(biome.heightMax * 100)
        return (
          <div key={i} className="biome-card">
            {/* Header: color + name + delete */}
            <div className="biome-card-header">
              <div className="biome-field-group">
                <span className="biome-field-label">Color</span>
                <input
                  type="color"
                  className="biome-color-input"
                  value={biome.color}
                  onChange={e => updateColor(i, e.target.value)}
                />
              </div>
              <div className="biome-field-group biome-field-name">
                <span className="biome-field-label">Name</span>
                <input
                  type="text"
                  className="biome-name-input"
                  value={biome.name}
                  onChange={e => updateName(i, e.target.value)}
                  placeholder="biome name"
                />
              </div>
              <button
                className="biome-delete-btn"
                onClick={() => deleteBiome(i)}
                disabled={biomes.length <= 1}
                title="Delete biome"
              >✕</button>
            </div>

            {/* Height range sliders */}
            <div className="biome-card-heights">
              <div className="biome-field-group">
                <span className="biome-field-label">Min height <span className="val">{biome.heightMin.toFixed(2)}</span></span>
                <input
                  type="range"
                  className="biome-prob-slider"
                  value={biome.heightMin}
                  min={0} max={1} step={0.01}
                  onChange={e => updateBiome(i, { heightMin: Number(e.target.value) })}
                />
              </div>
              <div className="biome-field-group">
                <span className="biome-field-label">Max height <span className="val">{biome.heightMax.toFixed(2)}</span></span>
                <input
                  type="range"
                  className="biome-prob-slider"
                  value={biome.heightMax}
                  min={0} max={1} step={0.01}
                  onChange={e => updateBiome(i, { heightMax: Number(e.target.value) })}
                />
              </div>
            </div>

            {invalid && (
              <div className="biome-warning">⚠ min must be &lt; max</div>
            )}

            {/* Object probability sliders — always visible */}
            {biome.objects.length > 0 && (
              <div className="biome-probs">
                {biome.objects.map((obj, oi) => (
                  <div key={oi} className="biome-field-group">
                    <span className="biome-field-label">{obj.name || 'object'} spawn <span className="val">{obj.probability}%</span></span>
                    <div className="biome-prob-row">
                      <input
                        type="range"
                        className="biome-prob-slider"
                        value={obj.probability}
                        min={0} max={100} step={1}
                        onChange={e => {
                          const objs = biome.objects.map((o, j) => j === oi ? { ...o, probability: Number(e.target.value) } : o)
                          updateBiome(i, { objects: objs })
                        }}
                      />
                      <input
                        type="number"
                        className="biome-height-input biome-prob-number"
                        value={obj.probability}
                        min={0} max={100} step={1}
                        onChange={e => {
                          const objs = biome.objects.map((o, j) => j === oi ? { ...o, probability: Number(e.target.value) } : o)
                          updateBiome(i, { objects: objs })
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Objects expander — name editing + add/remove */}
            <button
              className="biome-objects-toggle"
              onClick={() => setExpandedRow(isExpanded ? null : i)}
            >{isExpanded ? '▲ edit objects' : `▾ edit objects (${biome.objects.length})`}</button>

            {isExpanded && (
              <div className="biome-objects-editor">
                {biome.objects.map((obj, oi) => (
                  <div key={oi} className="biome-obj-row">
                    <div className="biome-obj-header">
                      <div className="biome-field-group biome-field-name">
                        <span className="biome-field-label">Object name</span>
                        <input
                          type="text"
                          className="biome-name-input"
                          value={obj.name}
                          onChange={e => {
                            const objs = biome.objects.map((o, j) => j === oi ? { ...o, name: e.target.value } : o)
                            updateBiome(i, { objects: objs })
                          }}
                        />
                      </div>
                      <button
                        className="biome-delete-btn"
                        onClick={() => {
                          const objs = biome.objects.filter((_, j) => j !== oi)
                          updateBiome(i, { objects: objs })
                        }}
                        title="Remove object"
                      >✕</button>
                    </div>
                  </div>
                ))}
                <button
                  className="biome-add-btn"
                  style={{ marginTop: 4 }}
                  onClick={() => updateBiome(i, { objects: [...biome.objects, { name: 'object', probability: 10 }] })}
                >+ Add Object</button>
              </div>
            )}

            {/* Height range visualisation bar — always at the very bottom of the card */}
            <div
              className="biome-height-range-bar"
              title={`${minPct}% – ${maxPct}%`}
              style={{
                background: `linear-gradient(to right, #1a1a3e ${minPct}%, ${biome.color} ${minPct}%, ${biome.color} ${maxPct}%, #1a1a3e ${maxPct}%)`,
              }}
            />
          </div>
        )
      })}
      <button className="biome-add-btn" onClick={addBiome}>+ Add Biome</button>
    </div>
  )
}

function buildColors(biomes: BiomeEntry[], existing: Record<string, string>): Record<string, string> {
  const result = { ...existing }
  for (const b of biomes) result[b.name] = b.color
  return result
}
