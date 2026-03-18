import { useState } from 'react'
import type { BiomeEntry } from './types'

interface BiomeEditorProps {
  biomes: BiomeEntry[]
  colors: Record<string, string>
  onChange: (biomes: BiomeEntry[], colors: Record<string, string>) => void
}

/**
 * When the user sets biome[i].weight = newVal (0–100),
 * redistribute the remaining (100 - newVal) proportionally
 * among all other biomes (preserving their relative ratios).
 * Always keeps sum == 100.
 */
function redistributeWeights(biomes: BiomeEntry[], changedIndex: number, newVal: number): BiomeEntry[] {
  const clamped = Math.max(0, Math.min(100, Math.round(newVal)))
  const remaining = 100 - clamped
  const others = biomes.filter((_, i) => i !== changedIndex)
  const othersTotal = others.reduce((s, b) => s + b.weight, 0)

  return biomes.map((b, i) => {
    if (i === changedIndex) return { ...b, weight: clamped }
    if (othersTotal === 0) {
      // all others were 0 — distribute evenly
      return { ...b, weight: Math.round(remaining / others.length) }
    }
    return { ...b, weight: Math.round((b.weight / othersTotal) * remaining) }
  })
}

export default function BiomeEditor({ biomes, colors, onChange }: BiomeEditorProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  function updateBiome(index: number, patch: Partial<BiomeEntry>) {
    const updated = biomes.map((b, i) => i === index ? { ...b, ...patch } : b)
    onChange(updated, buildColors(updated, colors))
  }

  function updateWeight(index: number, newVal: number) {
    const updated = redistributeWeights(biomes, index, newVal)
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
    // redistribute the deleted biome's weight to the last remaining biome
    const totalRemaining = remaining.reduce((s, b) => s + b.weight, 0)
    const diff = 100 - totalRemaining
    if (diff !== 0 && remaining.length > 0) {
      remaining[remaining.length - 1].weight = Math.max(0, remaining[remaining.length - 1].weight + diff)
    }
    const updatedColors = { ...colors }
    delete updatedColors[removed.name]
    onChange(remaining, updatedColors)
  }

  function addBiome() {
    // give the new biome 10% and scale others down
    const newBiome: BiomeEntry = {
      name: 'new',
      heightMin: 0.9,
      heightMax: 1.0,
      color: '#ffffff',
      weight: 10,
      objects: [],
    }
    const scaled = biomes.map(b => ({
      ...b,
      weight: Math.round(b.weight * 0.9),
    }))
    // fix rounding so sum == 100
    const sum = scaled.reduce((s, b) => s + b.weight, 0) + 10
    if (sum !== 100 && scaled.length > 0) {
      scaled[0].weight += 100 - sum
    }
    const updatedBiomes = [...scaled, newBiome]
    onChange(updatedBiomes, { ...colors, new: '#ffffff' })
  }

  return (
    <div className="biome-editor">
      {biomes.map((biome, i) => {
        const invalid = biome.heightMin >= biome.heightMax
        const isExpanded = expandedRow === i
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

            {/* Weight slider — always visible */}
            <div className="biome-field-group">
              <span className="biome-field-label">
                Weight <span className="val">{biome.weight}%</span>
              </span>
              <div className="biome-prob-row">
                <input
                  type="range"
                  className="biome-prob-slider"
                  value={biome.weight}
                  min={0} max={100} step={1}
                  onChange={e => updateWeight(i, Number(e.target.value))}
                />
                <input
                  type="number"
                  className="biome-height-input biome-prob-number"
                  value={biome.weight}
                  min={0} max={100} step={1}
                  onChange={e => updateWeight(i, Number(e.target.value))}
                />
              </div>
              {/* Visual weight bar */}
              <div className="biome-weight-bar-wrap">
                <div
                  className="biome-weight-bar"
                  style={{ width: `${biome.weight}%`, background: biome.color }}
                />
              </div>
            </div>

            {/* Height range */}
            <div className="biome-card-heights">
              <div className="biome-field-group">
                <span className="biome-field-label">Height min</span>
                <input
                  type="number"
                  className="biome-height-input"
                  value={biome.heightMin}
                  min={0} max={1} step={0.01}
                  onChange={e => updateBiome(i, { heightMin: Number(e.target.value) })}
                />
              </div>
              <div className="biome-field-group">
                <span className="biome-field-label">Height max</span>
                <input
                  type="number"
                  className="biome-height-input"
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
