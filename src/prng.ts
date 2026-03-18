// FNV-1a hash for string seeds
function fnv1a(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash >>> 0
}

export function normalizeSeed(seed: string | number): number {
  if (typeof seed === 'number') return seed >>> 0
  return fnv1a(seed)
}

// mulberry32 PRNG — returns function that yields values in [0, 1)
export function createPRNG(seed: number): () => number {
  let s = seed >>> 0
  return function next(): number {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
