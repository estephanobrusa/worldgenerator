import { describe, it, expect } from 'vitest'
import { createNoiseFunction } from '../src/noise.js'
import { createPRNG } from '../src/prng.js'

describe('createNoiseFunction', () => {
  it('produces values in [0, 1]', () => {
    const prng = createPRNG(42)
    const noise = createNoiseFunction(prng)
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const v = noise(x, y)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
  it('same seed produces same output', () => {
    const noise1 = createNoiseFunction(createPRNG(42))
    const noise2 = createNoiseFunction(createPRNG(42))
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(noise1(x, y)).toBe(noise2(x, y))
      }
    }
  })
  it('different seeds produce different outputs', () => {
    const noise1 = createNoiseFunction(createPRNG(1))
    const noise2 = createNoiseFunction(createPRNG(2))
    const vals1 = Array.from({ length: 9 }, (_, i) => noise1(i % 3, Math.floor(i / 3)))
    const vals2 = Array.from({ length: 9 }, (_, i) => noise2(i % 3, Math.floor(i / 3)))
    expect(vals1).not.toEqual(vals2)
  })
})
