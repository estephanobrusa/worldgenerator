import { generate2DMap, generate3DMap } from './index.js'
import { writeFileSync } from 'fs'

const ASCII_MAP: Record<string, string> = {
  water: '~',
  ocean: '≈',
  plain: '.',
  land: ',',
  mountain: '^',
  forest: 'T',
  desert: '░',
  sky: ' ',
}

function renderAscii(cells: { biome: string }[][]): string {
  return cells.map(row => row.map(c => ASCII_MAP[c.biome] ?? '?').join('')).join('\n')
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {}
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help') { args['help'] = true; continue }
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { args[key] = next; i++ }
      else { args[key] = true }
    }
  }
  return args
}

const USAGE = `
Usage: pmg [options]

Options:
  --width   <number>    Map width (default: 20)
  --height  <number>    Map height (default: 10)
  --seed    <string>    Seed string (default: world)
  --depth   <number>    Enable 3D mode with given depth
  --format  ascii|json  Output format (default: ascii)
  --output  <path>      Write output to file instead of stdout
  --help                Show this help message
`.trim()

const args = parseArgs(process.argv)

if (args['help']) {
  console.log(USAGE)
  process.exit(0)
}

const width = Number(args['width'] ?? 20)
const height = Number(args['height'] ?? 10)
const seed = String(args['seed'] ?? 'world')
const format = String(args['format'] ?? 'ascii')
const output = args['output'] ? String(args['output']) : null

if (!['ascii', 'json'].includes(format)) {
  process.stderr.write(`Error: --format must be "ascii" or "json"\n`)
  process.exit(1)
}

if (isNaN(width) || width < 1) {
  process.stderr.write(`Error: --width must be a positive number\n`)
  process.exit(1)
}

if (isNaN(height) || height < 1) {
  process.stderr.write(`Error: --height must be a positive number\n`)
  process.exit(1)
}

const defaultBiomes = [
  { name: 'water',    objects: [], heightRange: [0.0, 0.3] as [number, number] },
  { name: 'plain',    objects: [], heightRange: [0.3, 0.7] as [number, number] },
  { name: 'mountain', objects: [], heightRange: [0.7, 1.0] as [number, number] },
]

let result: string

if (args['depth']) {
  const depth = Number(args['depth'])
  if (isNaN(depth) || depth < 1) {
    process.stderr.write(`Error: --depth must be a positive number\n`)
    process.exit(1)
  }
  const map = generate3DMap({ width, height, depth, seed, biomes: defaultBiomes })
  result = format === 'json'
    ? JSON.stringify(map, null, 2)
    : map.map((layer: { biome: string }[][], i: number) => `=== Layer ${i} ===\n${renderAscii(layer)}`).join('\n')
} else {
  const map = generate2DMap({ width, height, seed, biomes: defaultBiomes })
  result = format === 'json'
    ? JSON.stringify(map, null, 2)
    : renderAscii(map)
}

if (output) {
  writeFileSync(output, result + '\n')
  console.log(`Wrote map to ${output}`)
} else {
  console.log(result)
}
