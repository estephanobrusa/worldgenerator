import { describe, it, expect } from 'vitest'
import { placeObject } from '../src/objectPlacement.js'
import type { ObjectConfig } from '../src/types.js'

describe('placeObject', () => {
  it('probability 100 always places object', () => {
    const objs: ObjectConfig[] = [{ name: 'tree', probability: 100 }]
    const prng = () => 0.5
    expect(placeObject(0.5, objs, prng)).toBe('tree')
  })
  it('probability 0 never places object', () => {
    const objs: ObjectConfig[] = [{ name: 'tree', probability: 0 }]
    const prng = () => 0.5
    expect(placeObject(0.5, objs, prng)).toBeUndefined()
  })
  it('height below minHeight prevents placement', () => {
    const objs: ObjectConfig[] = [{ name: 'cloud', probability: 100, minHeight: 0.8 }]
    const prng = () => 0  // would pass probability
    expect(placeObject(0.5, objs, prng)).toBeUndefined()
  })
  it('height above maxHeight prevents placement', () => {
    const objs: ObjectConfig[] = [{ name: 'fish', probability: 100, maxHeight: 0.2 }]
    const prng = () => 0
    expect(placeObject(0.5, objs, prng)).toBeUndefined()
  })
  it('first-win: returns first passing object', () => {
    const objs: ObjectConfig[] = [
      { name: 'tree', probability: 100 },
      { name: 'rock', probability: 100 },
    ]
    let calls = 0
    const prng = () => { calls++; return 0.5 }
    const result = placeObject(0.5, objs, prng)
    expect(result).toBe('tree')
    expect(calls).toBe(1)  // only one PRNG roll since first-win
  })
  it('PRNG advances once per object even on height-check failure', () => {
    const objs: ObjectConfig[] = [
      { name: 'cloud', probability: 100, minHeight: 0.9 },  // height check fails
      { name: 'tree', probability: 100 },  // height check passes
    ]
    let calls = 0
    const prng = () => { calls++; return 0 }
    placeObject(0.5, objs, prng)
    expect(calls).toBe(2)  // PRNG advanced for both objects
  })
  it('returns undefined when no objects match', () => {
    expect(placeObject(0.5, [], () => 0)).toBeUndefined()
  })
})
