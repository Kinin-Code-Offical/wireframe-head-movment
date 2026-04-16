export class SpringValue {
  current: number
  velocity: number
  target: number
  stiffness: number
  damping: number
  mass: number

  constructor(initial: number, stiffness = 180, damping = 24, mass = 1) {
    this.current = initial
    this.velocity = 0
    this.target = initial
    this.stiffness = stiffness
    this.damping = damping
    this.mass = mass
  }

  setTarget(t: number) { this.target = t }

  step(dt: number): number {
    const clampedDt = Math.min(dt, 0.05)
    const force = -this.stiffness * (this.current - this.target)
    const dampForce = -this.damping * this.velocity
    const acc = (force + dampForce) / this.mass
    this.velocity += acc * clampedDt
    this.current += this.velocity * clampedDt
    return this.current
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt))
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
