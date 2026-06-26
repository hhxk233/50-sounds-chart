export type Rng = () => number

/** Fisher–Yates 洗牌，返回新数组。rng 可注入以便测试。 */
export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

export function randomChoice<T>(arr: readonly T[], rng: Rng = Math.random): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** 可设种子的确定性 RNG（mulberry32），用于可重复的测试。 */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
