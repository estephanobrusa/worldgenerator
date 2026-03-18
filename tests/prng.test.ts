import { describe, it, expect } from 'vitest'
import { createPRNG, normalizeSeed } from '../src/prng.js'

describe('normalizeSeed', () => {
  it('converts number seed to unsigned 32-bit integer', () => {
    expect(normalizeSeed(42)).toBe(42)
    expect(normalizeSeed(0)).toBe(0)
  })
  it('converts string seed deterministically', () => {
    expect(normalizeSeed('hello')).toBe(normalizeSeed('hello'))
    expect(normalizeSeed('hello')).not.toBe(normalizeSeed('world'))
  })
  it('string "0" and number 0 produce different seeds', () => {
    expect(normalizeSeed('0')).not.toBe(normalizeSeed(0))
  })
})

describe('createPRNG', () => {
  it('produces same sequence for same seed', () => {
    const a = createPRNG(42)
    const b = createPRNG(42)
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b())
    }
  })
  it('produces different sequences for different seeds', () => {
    const a = createPRNG(42)
    const b = createPRNG(43)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })
  it('produces values in [0, 1)', () => {
    const prng = createPRNG(99)
    for (let i = 0; i < 1000; i++) {
      const v = prng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('two instances are isolated (different offsets)', () => {
    const a = createPRNG(100)
    const b = createPRNG(101)
    a(); a(); a()  // advance a
    // b should not have been affected
    const bSeq = Array.from({ length: 5 }, () => b())
    const bFresh = createPRNG(101)
    const bFreshSeq = Array.from({ length: 5 }, () => bFresh())
    expect(bSeq).toEqual(bFreshSeq)
  })
})
