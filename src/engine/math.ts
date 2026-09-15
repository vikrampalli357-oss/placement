export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

export function simplifyFraction(num: number, den: number): string {
  if (den === 0) return 'undefined'
  const sign = num * den < 0 ? '-' : ''
  const n = Math.abs(num)
  const d = Math.abs(den)
  const g = gcd(n, d)
  const nn = n / g
  const dd = d / g
  if (dd === 1) return `${sign}${nn}`
  return `${sign}${nn}/${dd}`
}

export function nearlyEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b))
}

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return 'undefined'
  const r = Math.round(n)
  if (nearlyEqual(n, r)) return String(r)
  const t = Math.round(n * 1e6) / 1e6
  return String(t)
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b)
}

export function nPr(n: number, r: number): number {
  if (r < 0 || n < r) return 0
  let p = 1
  for (let i = 0; i < r; i++) p *= n - i
  return p
}

export function nCr(n: number, r: number): number {
  if (r < 0 || n < r) return 0
  r = Math.min(r, n - r)
  let c = 1
  for (let i = 1; i <= r; i++) c = (c * (n - r + i)) / i
  return c
}

export function extractNumbers(q: string): number[] {
  return [...q.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!
}

export function shuffle<T>(rng: () => number, items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}
