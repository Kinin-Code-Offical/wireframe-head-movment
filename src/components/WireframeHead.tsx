import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAvatarStore } from '../state/avatarStore'
import { damp, clamp } from '../utils/spring'

function ellipsePoints(
  cx: number, cy: number, cz: number,
  rx: number, ry: number, n: number,
  axis: 'xy' | 'xz' | 'yz' = 'xy',
  startAngle = 0, endAngle = Math.PI * 2,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= n; i++) {
    const a = startAngle + (i / n) * (endAngle - startAngle)
    const ex = cx + rx * Math.cos(a)
    const ey = cy + ry * Math.sin(a)
    if (axis === 'xy') pts.push(new THREE.Vector3(ex, ey, cz))
    else if (axis === 'xz') pts.push(new THREE.Vector3(ex, cy, ey))
    else pts.push(new THREE.Vector3(cx, ex, ey))
  }
  return pts
}

function makeLine(pts: THREE.Vector3[], mat: THREE.LineBasicMaterial): THREE.Line {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)
}

function disposeGroup(g: THREE.Group) {
  for (const c of [...g.children]) {
    const line = c as THREE.Line
    line.geometry?.dispose()
  }
  g.clear()
}

export default function WireframeHead() {
  const rootRef = useRef<THREE.Group>(null)
  const mouthRef = useRef(new THREE.Group())
  const leftBrowRef = useRef(new THREE.Group())
  const rightBrowRef = useRef(new THREE.Group())
  const leftEyeRef = useRef(new THREE.Group())
  const rightEyeRef = useRef(new THREE.Group())

  const le = useRef({
    jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0,
    mouthCornerPull: 0, browLeft: 0, browRight: 0, browRaise: 0,
    eyeOpenness: 1, headPitch: 0, headYaw: 0, headRoll: 0,
  })

  const matMain = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x2e8fff, transparent: true, opacity: 0.85, linewidth: 1,
  }), [])
  const matDim = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x1e5cb3, transparent: true, opacity: 0.42, linewidth: 1,
  }), [])
  const matAccent = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x8855ff, transparent: true, opacity: 0.68, linewidth: 1,
  }), [])

  const scene = useMemo(() => {
    const g = new THREE.Group()

    // Skull rings
    for (let i = 0; i < 5; i++) {
      const z = -0.30 + i * 0.15
      const s = 1 - Math.abs(z + 0.08) * 0.22
      g.add(makeLine(ellipsePoints(0, 0.22, z, 0.43 * s, 0.55 * s, 32), matDim))
    }
    // Front profile
    g.add(makeLine(ellipsePoints(0, 0.22, 0, 0.43, 0.55, 40), matMain))
    // Vertical stripes
    for (let i = 0; i < 5; i++) {
      const xOff = -0.34 + i * 0.17
      const h = Math.sqrt(Math.max(0, 1 - (xOff / 0.43) ** 2))
      const topY = 0.22 + 0.55 * h
      const botY = 0.22 - 0.55 * h
      const zf = Math.sqrt(Math.max(0, (0.43 * h) ** 2 - xOff * xOff)) * 0.55
      g.add(makeLine([
        new THREE.Vector3(xOff, topY, zf),
        new THREE.Vector3(xOff, (topY + botY) / 2, zf * 1.1),
        new THREE.Vector3(xOff, botY, zf * 0.35),
      ], matDim))
    }
    // Temple arcs
    for (const s of [-1, 1]) {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * 0.5 + (i / 12) * Math.PI * 0.65
        pts.push(new THREE.Vector3(
          s * (0.18 + 0.30 * Math.cos(a)),
          0.08 + 0.22 * Math.sin(a),
          0.12 + Math.abs(Math.sin(a)) * 0.08,
        ))
      }
      g.add(makeLine(pts, matDim))
    }

    // Jaw
    g.add(makeLine(ellipsePoints(0, 0, 0, 0.32, 0.24, 24, 'xy', Math.PI, Math.PI * 2), matMain))
    g.add(makeLine(ellipsePoints(0, -0.2, 0.08, 0.13, 0.08, 10, 'xy', Math.PI * 1.1, Math.PI * 1.9), matMain))
    for (const s of [-1, 1]) {
      g.add(makeLine([
        new THREE.Vector3(s * 0.33, 0.06, -0.08),
        new THREE.Vector3(s * 0.29, -0.08, 0.08),
        new THREE.Vector3(s * 0.21, -0.18, 0.13),
        new THREE.Vector3(s * 0.11, -0.24, 0.14),
        new THREE.Vector3(0, -0.28, 0.14),
      ], matMain))
    }
    // Neck ring
    g.add(makeLine(ellipsePoints(0, -0.52, -0.04, 0.20, 0.13, 18), matDim))
    for (const s of [-1, 1]) {
      g.add(makeLine([
        new THREE.Vector3(s * 0.17, -0.28, 0.08),
        new THREE.Vector3(s * 0.13, -0.40, 0.0),
        new THREE.Vector3(s * 0.09, -0.52, -0.04),
      ], matDim))
    }

    // Cheeks
    for (const s of [-1, 1]) {
      g.add(makeLine([
        new THREE.Vector3(s * 0.35, 0.04, 0.10),
        new THREE.Vector3(s * 0.29, -0.06, 0.18),
        new THREE.Vector3(s * 0.21, -0.14, 0.20),
      ], matDim))
      g.add(makeLine([
        new THREE.Vector3(s * 0.33, 0.10, 0.08),
        new THREE.Vector3(s * 0.25, 0.08, 0.20),
        new THREE.Vector3(s * 0.17, 0.04, 0.24),
      ], matDim))
    }

    // Brows
    const lb = leftBrowRef.current
    lb.add(makeLine([
      new THREE.Vector3(0.06, 0.22, 0.22),
      new THREE.Vector3(0.14, 0.26, 0.20),
      new THREE.Vector3(0.22, 0.25, 0.18),
      new THREE.Vector3(0.30, 0.21, 0.12),
    ], matMain))
    g.add(lb)

    const rb = rightBrowRef.current
    rb.add(makeLine([
      new THREE.Vector3(-0.06, 0.22, 0.22),
      new THREE.Vector3(-0.14, 0.26, 0.20),
      new THREE.Vector3(-0.22, 0.25, 0.18),
      new THREE.Vector3(-0.30, 0.21, 0.12),
    ], matMain))
    g.add(rb)

    // Eyes
    const le2 = leftEyeRef.current
    le2.add(makeLine(ellipsePoints(0.18, 0.12, 0.22, 0.092, 0.062, 24), matMain))
    le2.add(makeLine(ellipsePoints(0.18, 0.12, 0.24, 0.024, 0.024, 12), matAccent))
    g.add(le2)

    const re = rightEyeRef.current
    re.add(makeLine(ellipsePoints(-0.18, 0.12, 0.22, 0.092, 0.062, 24), matMain))
    re.add(makeLine(ellipsePoints(-0.18, 0.12, 0.24, 0.024, 0.024, 12), matAccent))
    g.add(re)

    // Nose
    g.add(makeLine([
      new THREE.Vector3(0, 0.18, 0.22),
      new THREE.Vector3(0, 0.10, 0.27),
      new THREE.Vector3(0, 0.02, 0.28),
      new THREE.Vector3(0, -0.04, 0.26),
    ], matMain))
    for (const s of [-1, 1]) {
      g.add(makeLine(ellipsePoints(s * 0.05, -0.07, 0.24, 0.038, 0.024, 12, 'xy', 0, Math.PI * 1.7), matDim))
    }
    g.add(makeLine(ellipsePoints(0, -0.06, 0.28, 0.058, 0.028, 8, 'xy', Math.PI * 0.15, Math.PI * 0.85), matDim))

    // Mouth group (rebuilt each frame)
    g.add(mouthRef.current)

    return g
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matMain, matDim, matAccent])

  const updateMouth = (
    g: THREE.Group,
    jawOpen: number,
    mouthWidth: number,
    lipRound: number,
    lipPress: number,
    cornerPull: number,
  ) => {
    disposeGroup(g)
    const baseY = -0.175, baseZ = 0.245
    const halfW = 0.10 + mouthWidth * 0.04
    const openAmt = jawOpen * 0.088
    const cLift = cornerPull * 0.024
    const N = 14

    const upper: THREE.Vector3[] = []
    const lower: THREE.Vector3[] = []
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const xn = t * 2 - 1
      const taper = 1 - xn * xn
      const x = xn * halfW
      const bowY = lipRound * 0.011 * taper + cLift * (1 - taper)
      upper.push(new THREE.Vector3(x, baseY + openAmt * 0.2 + bowY, baseZ + lipRound * 0.01 * taper))
      lower.push(new THREE.Vector3(x, baseY - openAmt * 0.8 - lipPress * 0.007 * taper - Math.abs(cLift) * 0.3, baseZ + lipRound * 0.008 * taper))
    }
    g.add(makeLine(upper, matMain))
    g.add(makeLine(lower, matMain))
    g.add(makeLine([upper[0], lower[0]], matDim))
    g.add(makeLine([upper[N], lower[N]], matDim))
    g.add(makeLine([
      new THREE.Vector3(-0.024, baseY + openAmt * 0.2 + 0.007, baseZ + 0.002),
      new THREE.Vector3(0, baseY + openAmt * 0.2, baseZ + 0.013),
      new THREE.Vector3(0.024, baseY + openAmt * 0.2 + 0.007, baseZ + 0.002),
    ], matDim))
  }

  useFrame((_, delta) => {
    const expr = useAvatarStore.getState().expression
    const r = le.current
    const sp = 14

    r.jawOpen = damp(r.jawOpen, expr.jawOpen, sp, delta)
    r.mouthWidth = damp(r.mouthWidth, expr.mouthWidth, sp, delta)
    r.lipRound = damp(r.lipRound, expr.lipRound, sp, delta)
    r.lipPress = damp(r.lipPress, expr.lipPress, sp, delta)
    r.mouthCornerPull = damp(r.mouthCornerPull, expr.mouthCornerPull, 8, delta)
    r.browLeft = damp(r.browLeft, expr.browLeft, 8, delta)
    r.browRight = damp(r.browRight, expr.browRight, 8, delta)
    r.browRaise = damp(r.browRaise, expr.browRaise, 8, delta)
    r.eyeOpenness = damp(r.eyeOpenness, expr.eyeOpenness, sp * 1.1, delta)
    r.headPitch = damp(r.headPitch, expr.headPitch, 6, delta)
    r.headYaw = damp(r.headYaw, expr.headYaw, 6, delta)
    r.headRoll = damp(r.headRoll, expr.headRoll, 6, delta)

    if (rootRef.current) {
      rootRef.current.rotation.x = r.headPitch
      rootRef.current.rotation.y = r.headYaw
      rootRef.current.rotation.z = r.headRoll
    }

    leftBrowRef.current.position.y = r.browRaise * 0.06 + r.browLeft * 0.04
    rightBrowRef.current.position.y = r.browRaise * 0.06 + r.browRight * 0.04
    leftEyeRef.current.scale.y = clamp(r.eyeOpenness, 0.05, 1.4)
    rightEyeRef.current.scale.y = clamp(r.eyeOpenness, 0.05, 1.4)

    updateMouth(mouthRef.current, r.jawOpen, r.mouthWidth, r.lipRound, r.lipPress, r.mouthCornerPull)
  })

  return (
    <group ref={rootRef}>
      <primitive object={scene} />
    </group>
  )
}
