# ProceduralMapGen – PRD + Diseño Técnico (v1 mejorado)

## 🧠 Resumen ejecutivo

Librería de generación procedural **determinista** (2D/3D) basada en **seed + noise + reglas**.

Pipeline real:

```
seed → PRNG → noise (Perlin/Simplex) → mapas (altura/temperatura/humedad) → biomas → reglas → objetos → output
```

---

## 1. Nombre
**ProceduralMapGen** (provisional)

---

## 2. Objetivo

Crear una librería que:
- Genere mapas **2D y 3D deterministas**
- Permita definir **biomas externamente**
- Controle **spawn de objetos con reglas y probabilidades**
- Garantice **coherencia espacial** (transiciones suaves)

---

## 3. Principios clave (críticos)

- La **seed NO define contenido semántico**
- La seed solo controla el **ruido base**
- Toda lógica de mundo vive en **reglas configurables**
- Sistema **pipeline, no función mágica**

---

## 4. Alcance funcional

| Feature | Descripción | Prioridad |
|--------|------------|----------|
| Generación 2D | Grid (x, y) | Alta |
| Generación 3D | Grid (x, y, z) | Media |
| Biomas externos | Configuración dinámica | Alta |
| Objetos por bioma | Probabilidad + restricciones | Alta |
| Seed determinista | Reproducibilidad total | Alta |
| Exportación | JSON / arrays | Alta |
| Visualización | Canvas / WebGL | Baja |

---

## 5. Alcance técnico

- TypeScript (strict)
- Node + Browser
- Sin dependencias pesadas
- Test coverage ≥ 80%
- Performance: O(n) sobre celdas

---

## 6. Modelo de datos

### Input

```ts
type ObjectConfig = {
  name: string
  probability: number // 0–100
  minHeight?: number
  maxHeight?: number
}

type BiomeConfig = {
  name: string
  objects: ObjectConfig[]
  // opcional futuro:
  // heightRange?: [number, number]
  // temperatureRange?: [number, number]
}

type MapConfig = {
  width: number
  height: number
  depth?: number
  seed: string | number
  biomes: BiomeConfig[]
}
```

### Output

```ts
type MapCell = {
  x: number
  y: number
  z?: number
  biome: string
  height: number
  object?: string
}

type Map2D = MapCell[][]
type Map3D = MapCell[][][]
```

---

## 7. Algoritmo base (detallado)

### Step 1 – PRNG determinista

❌ No usar `Math.random`

✔ Usar PRNG con seed (ej: mulberry32)

```ts
const rng = createPRNG(seed)
```

---

### Step 2 – Noise

Generar valores continuos:

```ts
const h = noise(x, y, seed)
```

Rango esperado: `0 → 1`

---

### Step 3 – Mapas derivados

- height map
- (futuro) temperatura
- (futuro) humedad

---

### Step 4 – Asignación de biomas

Opciones:

#### Simple (v1)
```ts
if (h < 0.3) biome = "water"
else if (h < 0.6) biome = "plain"
else biome = "mountain"
```

#### Avanzado (v2)
- combinar height + temperatura + humedad

---

### Step 5 – Spawn de objetos

Por cada celda:

```ts
for (const obj of biome.objects) {
  if (rng() * 100 < obj.probability) {
    if (validHeight(obj, height)) {
      place(obj)
    }
  }
}
```

---

### Step 6 – Reglas (clave real del sistema)

Ejemplos:

```ts
// evitar objetos en biomas inválidos
if (biome === "water") return null

// evitar spawn en alturas inválidas
if (height < obj.minHeight) return null

// evitar colisiones
if (cellOccupied) return null
```

---

## 8. Problemas reales a resolver (no ignorar)

### ❗ 1. Colisiones

- múltiples objetos en una celda
- solución: prioridad o 1 objeto por celda

### ❗ 2. Transiciones de bioma

- ruido mal configurado → cortes bruscos
- solución: low frequency + interpolación

### ❗ 3. Distribución incorrecta

- probabilidades no reales
- solución: test estadístico

---

## 9. Fases de desarrollo

### Fase 0 – Setup
- TS + lint + tests

### Fase 1 – 2D básico
- `generate2DMap()`
- PRNG + noise simple

Tests:
- misma seed → mismo mapa
- distribución básica

---

### Fase 2 – 3D
- `generate3DMap()`

---

### Fase 3 – Restricciones
- minHeight / maxHeight

---

### Fase 4 – Reglas avanzadas
- colisiones
- validaciones

---

### Fase 5 – Testing serio

Unit:
- PRNG
- distribución

Integration:
- snapshot maps

---

### Fase 6 – Release
- README
- npm

---

## 10. Ejemplo real

```ts
const config: MapConfig = {
  width: 100,
  height: 100,
  depth: 20,
  seed: "mi-seed",
  biomes: [
    {
      name: "pradera",
      objects: [
        { name: "vaca", probability: 20, minHeight: 0, maxHeight: 1 },
        { name: "árbol", probability: 15, minHeight: 0, maxHeight: 5 }
      ]
    },
    {
      name: "cielo",
      objects: [
        { name: "nube", probability: 40, minHeight: 15 }
      ]
    }
  ]
}
```

✔ Resultado esperado:
- vacas NO aparecen en cielo
- nubes solo en altura alta
- seed reproducible

---

## 11. Métricas de éxito

- determinismo 100%
- distribución ±5%
- performance estable
- API simple

---

## 12. Arquitectura recomendada

```
core/
  prng.ts
  noise.ts
  biome.ts
  generator.ts
rules/
  spawnRules.ts
utils/
  validation.ts
```

---

## 13. Siguiente paso lógico

Antes de implementar todo:

👉 construir SOLO esto:

1. PRNG determinista
2. generate2DMap mínimo (sin biomas complejos)
3. test de reproducibilidad

Si esto falla → todo lo demás falla.

