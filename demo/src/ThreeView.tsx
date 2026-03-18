import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Map2D, Map3D } from 'procedural-map-gen'

interface ThreeViewProps {
  map2D: Map2D | null
  map3D: Map3D | null
  mode: '2D' | '3D'
  biomeColors: Record<string, string>
}

const MAX_W = 50
const MAX_H = 50
const MAX_D = 10

/** Parse a CSS hex/rgb color string into a THREE.Color */
function toThreeColor(css: string): THREE.Color {
  return new THREE.Color(css)
}

/** Crop a 2D map to a centered MAX_W×MAX_H section */
function cropMap2D(map: Map2D): Map2D {
  const rows = map.length
  const cols = map[0]?.length ?? 0
  if (rows <= MAX_H && cols <= MAX_W) return map

  const startRow = Math.floor(Math.max(0, rows - MAX_H) / 2)
  const startCol = Math.floor(Math.max(0, cols - MAX_W) / 2)
  const endRow = Math.min(rows, startRow + MAX_H)
  const endCol = Math.min(cols, startCol + MAX_W)

  return map.slice(startRow, endRow).map(row => row.slice(startCol, endCol))
}

/** Crop a 3D map to centered MAX_W×MAX_H×MAX_D section */
function cropMap3D(map: Map3D): Map3D {
  const depth = map.length
  const rows = map[0]?.length ?? 0
  const cols = map[0]?.[0]?.length ?? 0

  const startD = Math.floor(Math.max(0, depth - MAX_D) / 2)
  const startRow = Math.floor(Math.max(0, rows - MAX_H) / 2)
  const startCol = Math.floor(Math.max(0, cols - MAX_W) / 2)
  const endD = Math.min(depth, startD + MAX_D)
  const endRow = Math.min(rows, startRow + MAX_H)
  const endCol = Math.min(cols, startCol + MAX_W)

  return map.slice(startD, endD).map(layer =>
    layer.slice(startRow, endRow).map(row => row.slice(startCol, endCol))
  )
}

export default function ThreeView({ map2D, map3D, mode, biomeColors }: ThreeViewProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0f0f1a, 1)
    mount.appendChild(renderer.domElement)

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0f0f1a, 80, 150)

    // ── Camera ────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500)

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(30, 40, 20)
    scene.add(dirLight)

    // ── OrbitControls ─────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 5
    controls.maxDistance = 200

    // ── Build geometry ────────────────────────────────────────
    const meshGroup = new THREE.Group()
    scene.add(meshGroup)

    function buildScene() {
      // Dispose old children
      meshGroup.children.slice().forEach(child => {
        if (child instanceof THREE.InstancedMesh) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
        meshGroup.remove(child)
      })

      if (mode === '2D' && map2D) {
        build2D(map2D)
      } else if (mode === '3D' && map3D) {
        build3D(map3D)
      }
    }

    function build2D(rawMap: Map2D) {
      const map = cropMap2D(rawMap)
      const mapH = map.length
      const mapW = map[0]?.length ?? 0

      // Collect cells per biome for instancing
      const byBiome: Record<string, { x: number; z: number; height: number }[]> = {}
      for (let row = 0; row < mapH; row++) {
        for (let col = 0; col < mapW; col++) {
          const cell = map[row][col]
          const biome = cell.biome
          if (!byBiome[biome]) byBiome[biome] = []
          byBiome[biome].push({ x: col, z: row, height: cell.height })
        }
      }

      const dummy = new THREE.Object3D()

      for (const [biome, cells] of Object.entries(byBiome)) {
        const color = toThreeColor(biomeColors[biome] ?? '#cccccc')
        const mat = new THREE.MeshStandardMaterial({ color })
        const geo = new THREE.BoxGeometry(1, 1, 1)
        const mesh = new THREE.InstancedMesh(geo, mat, cells.length)
        mesh.castShadow = false

        cells.forEach((c, i) => {
          const h = c.height * 3 + 0.2
          dummy.position.set(c.x - mapW / 2, h / 2, c.z - mapH / 2)
          dummy.scale.set(1, h, 1)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
        meshGroup.add(mesh)
      }

      // Position camera above center
      const cx = 0, cz = 0
      const dist = Math.max(mapW, mapH) * 1.1
      camera.position.set(cx + dist * 0.6, dist * 0.8, cz + dist * 0.6)
      camera.lookAt(cx, 0, cz)
      controls.target.set(cx, 0, cz)
      controls.update()
    }

    function build3D(rawMap: Map3D) {
      const map = cropMap3D(rawMap)
      const depth = map.length
      const mapH = map[0]?.length ?? 0
      const mapW = map[0]?.[0]?.length ?? 0

      // Collect cells per biome for instancing
      const byBiome: Record<string, { x: number; y: number; z: number }[]> = {}
      for (let d = 0; d < depth; d++) {
        for (let row = 0; row < mapH; row++) {
          for (let col = 0; col < mapW; col++) {
            const cell = map[d][row][col]
            const biome = cell.biome
            if (!byBiome[biome]) byBiome[biome] = []
            byBiome[biome].push({
              x: col,
              y: cell.z ?? d,
              z: row,
            })
          }
        }
      }

      const dummy = new THREE.Object3D()

      for (const [biome, cells] of Object.entries(byBiome)) {
        const color = toThreeColor(biomeColors[biome] ?? '#cccccc')
        const mat = new THREE.MeshStandardMaterial({
          color,
          transparent: true,
          opacity: 0.85,
        })
        const geo = new THREE.BoxGeometry(1, 1, 1)
        const mesh = new THREE.InstancedMesh(geo, mat, cells.length)

        cells.forEach((c, i) => {
          dummy.position.set(c.x - mapW / 2, c.y, c.z - mapH / 2)
          dummy.scale.set(1, 1, 1)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
        meshGroup.add(mesh)
      }

      // Position camera to see the full stack
      const cx = 0, cz = 0
      const dist = Math.max(mapW, mapH) * 1.2
      camera.position.set(cx + dist * 0.7, dist * 0.7, cz + dist * 0.7)
      camera.lookAt(cx, depth / 2, cz)
      controls.target.set(cx, depth / 2, cz)
      controls.update()
    }

    buildScene()

    // ── Resize observer ───────────────────────────────────────
    function handleResize() {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(mount)
    handleResize()

    // ── Animation loop ────────────────────────────────────────
    let rafId: number
    function animate() {
      rafId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      controls.dispose()
      meshGroup.children.slice().forEach(child => {
        if (child instanceof THREE.InstancedMesh) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
      renderer.dispose()
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map2D, map3D, mode, biomeColors])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
