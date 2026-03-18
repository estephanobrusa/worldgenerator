import { createNoise2D } from 'simplex-noise'

export function createNoiseFunction(prng: () => number): (x: number, y: number) => number {
  const noise2D = createNoise2D(prng)
  // simplex-noise returns values in [-1, 1], normalize to [0, 1]
  return (x: number, y: number): number => {
    const raw = noise2D(x / 16, y / 16)  // scale factor 16 for smooth terrain
    return (raw + 1) / 2
  }
}
