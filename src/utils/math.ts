export function sinWave(t: number, freq: number, amp: number, phase = 0): number {
  return Math.sin(t * freq * Math.PI * 2 + phase) * amp
}

export function noise(t: number, scale = 1): number {
  return (Math.sin(t * 1.618 * scale) * 0.5 + Math.sin(t * 2.414 * scale) * 0.3 + Math.sin(t * 3.732 * scale) * 0.2)
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function randRange(min: number, max: number, seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  const r = x - Math.floor(x)
  return min + r * (max - min)
}
