import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAvatarStore } from '../state/avatarStore'
import { damp, clamp } from '../utils/spring'

// ─── Geometry resolution ────────────────────────────────────────────────────
const LON = 80          // longitude divisions (density of wireframe columns)
const LAT_SKULL = 44    // latitude rings for skull/face
const LAT_JAW = 18      // latitude rings for lower jaw
// phi where jaw separates from skull  (cos φ ≈ -0.17  →  y ≈ -0.17 before deform)
const JAW_SPLIT_PHI = Math.acos(-0.17)   // ≈ 1.742 rad
// phi of chin bottom  (cos φ ≈ -0.88  →  y ≈ -0.88 before deform)
const CHIN_PHI = Math.acos(-0.88)         // ≈ 2.638 rad

// ─── Core parametric head surface ────────────────────────────────────────────
// phi   : 0 = top,  π = bottom
// theta : 0 = front (+z), π/2 = right (+x), π = back (-z), 3π/2 = left (-x)
function headPt(phi: number, theta: number): THREE.Vector3 {
  const sp = Math.sin(phi)
  const cp = Math.cos(phi)
  const st = Math.sin(theta)
  const ct = Math.cos(theta)

  // unit-sphere coords – used for feature region tests
  const ux = sp * st   // right = +
  const uy = cp        // up   = +
  const uz = sp * ct   // front = +

  // scaled base position (head aspect ratios)
  let x = ux * 0.73
  let y = uy * 1.00
  let z = uz * 0.82

  // ── Forehead backward slope ──────────────────────────────────────────────
  if (uy > 0.22 && uz > 0) {
    const t = clamp((uy - 0.22) / 0.78, 0, 1)
    z -= t * t * 0.18 * uz
  }

  // ── Occipital protrusion ─────────────────────────────────────────────────
  if (uz < 0 && uy > -0.10 && uy < 0.45) {
    const t = clamp(-uz * 1.4 - 0.3, 0, 1)
    const yT = 1.0 - Math.pow(Math.abs(uy - 0.18) / 0.55, 2)
    if (yT > 0) z -= t * yT * 0.08
  }

  // ── Temple narrowing (sides of forehead) ─────────────────────────────────
  if (uy > 0.12 && uy < 0.68) {
    const excess = Math.max(0, Math.abs(ux) - 0.68)
    const vT = clamp((uy - 0.12) / 0.56, 0, 1)
    x -= Math.sign(ux) * excess * vT * 0.28
  }

  // ── Cheekbone expansion ──────────────────────────────────────────────────
  if (uy > -0.26 && uy < 0.14 && uz > -0.18) {
    const frontFace = clamp(uz * 2.2, 0, 1)
    const sideT = Math.max(0, Math.abs(ux) - 0.56) / 0.44
    const cheekT = 1.0 - Math.pow(Math.abs(uy - 0.0) / 0.26, 2)
    if (sideT > 0 && frontFace > 0 && cheekT > 0) {
      x += Math.sign(ux) * sideT * cheekT * frontFace * 0.062
      z += sideT * cheekT * frontFace * 0.052
    }
  }

  // ── Jaw narrowing ────────────────────────────────────────────────────────
  if (uy < -0.10) {
    const jT = clamp((-uy - 0.10) / 0.90, 0, 1)
    x *= (1.0 - jT * jT * 0.76)
    // back of jaw recedes toward centre
    if (uz < 0) z += jT * 0.06
  }

  // ── Chin protrusion ──────────────────────────────────────────────────────
  if (uz > 0.4 && uy < -0.52 && Math.abs(ux) < 0.25) {
    const cT = Math.exp(-(ux * ux * 22 + Math.pow(uy + 0.66, 2) * 28))
    z += cT * 0.07
  }

  // ── Facial features (front-facing surface only) ──────────────────────────
  const faceW = clamp((uz - 0.12) / 0.88, 0, 1)   // 0 = side/back, 1 = full front

  if (faceW > 0) {
    // ── Eye sockets ──────────────────────────────────────────────────────
    for (const sx of [0.365, -0.365] as const) {
      const ey = 0.215
      const dx = (ux - sx) / 0.255
      const dy = (uy - ey) / 0.165
      const d2 = dx * dx + dy * dy
      if (d2 < 2.6) {
        z -= faceW * Math.exp(-d2 * 1.8) * 0.060
        // brow ridge just above socket
        const bdy = (uy - (ey + 0.13)) / 0.105
        const bdx = dx / 1.35
        const bd2 = bdx * bdx + bdy * bdy
        if (bd2 < 1.4 && uy > ey) {
          z += faceW * Math.exp(-bd2 * 3.2) * 0.030
        }
      }
    }

    // ── Nose bridge + tip ────────────────────────────────────────────────
    if (Math.abs(ux) < 0.31 && uy > -0.33 && uy < 0.32) {
      const nx = Math.abs(ux) / 0.31
      const ny = (uy + 0.33) / 0.65
      const bridge = Math.exp(-nx * nx * 16)
                   * Math.pow(clamp(Math.sin(ny * Math.PI), 0, 1), 0.55)
      z += bridge * faceW * 0.155

      // nostril wings
      if (uy < -0.06 && uy > -0.26 && Math.abs(ux) > 0.06 && Math.abs(ux) < 0.22) {
        const nwX = (Math.abs(ux) - 0.06) / (0.22 - 0.06)
        const nwY = clamp((uy + 0.26) / 0.20, 0, 1)
        const nw = Math.exp(-Math.pow(nwX - 0.38, 2) / 0.08) * Math.sin(nwY * Math.PI)
        z += nw * faceW * 0.032
      }
    }

    // ── Lip area protrusion ──────────────────────────────────────────────
    if (Math.abs(ux) < 0.29 && uy > -0.54 && uy < -0.08) {
      const lx = Math.abs(ux / 0.29)
      const ly = (uy + 0.54) / 0.46
      const lipP = (1.0 - Math.pow(lx, 1.4)) * Math.sin(clamp(ly, 0, 1) * Math.PI)
      z += lipP * faceW * 0.042
      // philtrum groove
      if (uy > -0.24 && uy < -0.08 && Math.abs(ux) < 0.09) {
        z -= Math.exp(-(ux * ux) / 0.005) * faceW * 0.014
            * clamp((uy + 0.24) / 0.16, 0, 1)
      }
    }

    // ── Nasolabial fold (slight lateral crease) ──────────────────────────
    if (Math.abs(ux) > 0.14 && Math.abs(ux) < 0.30
        && uy > -0.42 && uy < 0.0) {
      const fold = Math.exp(-Math.pow(Math.abs(ux) - 0.22, 2) / 0.006)
                 * Math.sin(clamp((uy + 0.42) / 0.42, 0, 1) * Math.PI) * 0.4
      z -= fold * faceW * 0.018
    }
  }

  return new THREE.Vector3(x, y, z)
}

// ─── Build a parametric surface geometry over a phi range ───────────────────
function buildSurfaceGeo(
  phiStart: number, phiEnd: number,
  latSegs: number, lonSegs: number,
): THREE.BufferGeometry {
  const pos: number[] = []
  const idx: number[] = []
  const stride = lonSegs + 1
  for (let la = 0; la <= latSegs; la++) {
    const phi = phiStart + (la / latSegs) * (phiEnd - phiStart)
    for (let lo = 0; lo <= lonSegs; lo++) {
      const theta = (lo / lonSegs) * Math.PI * 2
      const p = headPt(phi, theta)
      pos.push(p.x, p.y, p.z)
    }
  }
  for (let la = 0; la < latSegs; la++) {
    for (let lo = 0; lo < lonSegs; lo++) {
      const a = la * stride + lo
      const b = a + 1
      const c = (la + 1) * stride + lo
      const d = c + 1
      idx.push(a, b, c, b, d, c)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  return geo
}

// ─── Build jaw geometry, translated so pivot == local origin ────────────────
// hingeY is the world-space Y of the jaw hinge, so local y = world_y - hingeY
function buildJawGeoLocal(hingeY: number, latSegs: number, lonSegs: number): THREE.BufferGeometry {
  const geo = buildSurfaceGeo(JAW_SPLIT_PHI, CHIN_PHI, latSegs, lonSegs)
  const attr = geo.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < attr.count; i++) {
    attr.setY(i, attr.getY(i) - hingeY)
  }
  attr.needsUpdate = true
  return geo
}

// ─── Ear geometry (multi-ring flat helix) ───────────────────────────────────
function buildEarGeo(side: 1 | -1): THREE.BufferGeometry {
  const NUM_RINGS = 8
  const NUM_PTS = 28
  const pos: number[] = []
  const idx: number[] = []
  const stride = NUM_PTS + 1

  // ear centre in head space
  const ecX = side * 0.755
  const ecY = -0.045
  const ecZ = -0.165

  for (let r = 0; r < NUM_RINGS; r++) {
    const rT = r / (NUM_RINGS - 1)      // 0 = outer rim, 1 = inner concha
    const scaleX = 0.072 - rT * 0.048   // x half-width
    const scaleY = 0.118 - rT * 0.072   // y half-height
    const depthZ = rT * 0.030           // how far inward concha dips
    const spiralTilt = rT * 0.06        // slight forward tilt as we spiral in

    for (let i = 0; i <= NUM_PTS; i++) {
      const a = (i / NUM_PTS) * Math.PI * 2
      // flatten ear against side of head (small z extent, large xy extent)
      const px = ecX + side * (Math.cos(a) * scaleX)
      const py = ecY + Math.sin(a) * scaleY
      const pz = ecZ + side * spiralTilt - depthZ
      pos.push(px, py, pz)
    }
  }

  for (let r = 0; r < NUM_RINGS - 1; r++) {
    for (let i = 0; i < NUM_PTS; i++) {
      const a = r * stride + i
      const b = a + 1
      const c = (r + 1) * stride + i
      const d = c + 1
      idx.push(a, b, c, b, d, c)
    }
  }

  // Ear lobe – small rounded blob below concha
  const lobeBase = NUM_RINGS * stride
  const lobeSegs = 12
  for (let i = 0; i <= lobeSegs; i++) {
    const a = (i / lobeSegs) * Math.PI * 2
    pos.push(
      ecX + side * Math.cos(a) * 0.030,
      ecY - 0.105 + Math.sin(a) * 0.028,
      ecZ + 0.008,
    )
  }
  // Connect bottom ring of main ear to lobe
  const bottomRingStart = (NUM_RINGS - 1) * stride
  for (let i = 0; i < lobeSegs; i++) {
    const a = bottomRingStart + (i % NUM_PTS)
    const b = bottomRingStart + ((i + 1) % NUM_PTS)
    const c = lobeBase + i
    const d = lobeBase + i + 1
    idx.push(a, b, c, b, d, c)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  return geo
}

// ─── Neck geometry (tapered elliptical cylinder) ─────────────────────────────
function buildNeckGeo(): THREE.BufferGeometry {
  const RINGS = 10
  const SEGS = 36
  const stride = SEGS + 1
  const pos: number[] = []
  const idx: number[] = []

  for (let r = 0; r <= RINGS; r++) {
    const t = r / RINGS          // 0 = top (y ≈ -0.62), 1 = base (y ≈ -1.12)
    const ry = -0.62 - t * 0.50
    const rx = 0.195 - t * 0.018 // slight taper
    const rz = 0.165 - t * 0.018
    const leanZ = -0.04 - t * 0.07  // neck leans slightly back

    for (let s = 0; s <= SEGS; s++) {
      const a = (s / SEGS) * Math.PI * 2
      pos.push(Math.cos(a) * rx, ry, leanZ + Math.sin(a) * rz)
    }
  }

  for (let r = 0; r < RINGS; r++) {
    for (let s = 0; s < SEGS; s++) {
      const a = r * stride + s
      const b = a + 1
      const c = (r + 1) * stride + s
      const d = c + 1
      idx.push(a, b, c, b, d, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  return geo
}

// ─── Helpers: line factories ─────────────────────────────────────────────────
function makeLine(pts: THREE.Vector3[], mat: THREE.LineBasicMaterial): THREE.Line {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)
}

function clearGroup(g: THREE.Group) {
  for (const c of [...g.children]) {
    const line = c as THREE.Line
    line.geometry?.dispose()
    g.remove(line)
  }
}

// ─── Brow contour (a curved arch over each eye) ───────────────────────────────
function makeBrowContour(side: 1 | -1, mat: THREE.LineBasicMaterial): THREE.Line {
  const pts: THREE.Vector3[] = []
  const N = 16
  for (let i = 0; i <= N; i++) {
    const t = i / N                   // 0 = inner, 1 = outer
    const absUX = 0.10 + t * 0.28    // always positive unit-sphere x magnitude
    const uy = 0.345 + Math.sin(t * Math.PI) * 0.040 - t * 0.012
    // Map (absUX, uy) to spherical coords for the correct half
    const phi = Math.acos(clamp(uy, -1, 1))
    const sinPhi = Math.max(0.001, Math.sin(phi))
    const rawTheta = Math.asin(clamp(absUX / sinPhi, -1, 1))
    // side > 0 = right hemisphere (positive x, theta > 0 from front)
    // side < 0 = left  hemisphere (negative x, theta < 0 → 2π-rawTheta)
    const theta = side > 0 ? rawTheta : (Math.PI * 2 - rawTheta)
    const p = headPt(phi, theta)
    pts.push(p)
  }
  return makeLine(pts, mat)
}

// ─── Eye contour (upper + lower lid + iris ring) ─────────────────────────────
function makeEyeContour(
  side: 1 | -1,
  matLid: THREE.LineBasicMaterial,
  matIris: THREE.LineBasicMaterial,
): THREE.Group {
  const g = new THREE.Group()
  const N = 24
  const ex = side * 0.278
  const ey = 0.195
  const ez = 0.720   // approximate z on head surface at eye
  const rx = 0.115
  const ryU = 0.068  // upper lid half-height
  const ryL = 0.048  // lower lid half-height

  const upper: THREE.Vector3[] = []
  const lower: THREE.Vector3[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const a = Math.PI * (1 + t)  // π → 2π for upper arc
    const ca = Math.cos(a), sa = Math.sin(a)
    upper.push(new THREE.Vector3(ex + ca * rx, ey + sa * ryU, ez - Math.abs(sa) * 0.018))
    lower.push(new THREE.Vector3(ex - ca * rx, ey - sa * ryL, ez - Math.abs(sa) * 0.010))
  }
  // iris / pupil ring
  const iris: THREE.Vector3[] = []
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI * 2
    iris.push(new THREE.Vector3(ex + Math.cos(a) * 0.034, ey + Math.sin(a) * 0.034, ez + 0.006))
  }

  g.add(makeLine(upper, matLid))
  g.add(makeLine(lower, matLid))
  g.add(makeLine(iris, matIris))
  return g
}

// ─── Jaw-line contour highlight ───────────────────────────────────────────────
function makeJawLine(mat: THREE.LineBasicMaterial): THREE.Line {
  const N = 32
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    // sweep from right ear, under chin, to left ear
    const theta = Math.PI * 0.55 + t * Math.PI * (2.0 - 2 * 0.55)
    pts.push(headPt(JAW_SPLIT_PHI, theta))
  }
  return makeLine(pts, mat)
}

// ─── Nose-bridge highlight ────────────────────────────────────────────────────
function makeNoseBridge(mat: THREE.LineBasicMaterial): THREE.Line {
  const N = 18
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const uy = 0.28 - t * 0.56   // bridge top to nose base
    const phi = Math.acos(clamp(uy, -1, 1))
    pts.push(headPt(phi, 0))
  }
  return makeLine(pts, mat)
}

// ─── Lip contour (rebuilt every frame for speech animation) ──────────────────
function buildLipLines(
  jawOpen: number,
  mouthWidth: number,
  lipRound: number,
  lipPress: number,
  cornerPull: number,
  matLip: THREE.LineBasicMaterial,
  matCorner: THREE.LineBasicMaterial,
): THREE.Line[] {
  const baseY = -0.385
  const baseZ = 0.735
  const halfW = 0.120 + mouthWidth * 0.050
  const openY = jawOpen * 0.096
  const cLift = cornerPull * 0.024
  const N = 20

  const upper: THREE.Vector3[] = []
  const lower: THREE.Vector3[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const xn = t * 2 - 1
    const taper = 1 - xn * xn
    const x = xn * halfW
    // cupid's bow
    const bow = lipRound * 0.013 * taper + cLift * (1 - taper * 0.6)
    const cupid = Math.abs(xn) < 0.55
      ? -Math.sin((Math.abs(xn) / 0.55) * Math.PI) * 0.007 * (1 - Math.abs(xn))
      : 0.0
    upper.push(new THREE.Vector3(
      x,
      baseY + openY * 0.20 + bow + cupid,
      baseZ + lipRound * 0.013 * taper,
    ))
    lower.push(new THREE.Vector3(
      x,
      baseY - openY * 0.80 - lipPress * 0.007 * taper - Math.abs(cLift) * 0.28,
      baseZ + lipRound * 0.010 * taper,
    ))
  }
  const lCorner = makeLine([upper[0], lower[0]], matCorner)
  const rCorner = makeLine([upper[N], lower[N]], matCorner)
  return [
    makeLine(upper, matLip),
    makeLine(lower, matLip),
    lCorner,
    rCorner,
  ]
}

// ─── LineSegments from BufferGeometry via WireframeGeometry ─────────────────
function wireSegments(geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial): THREE.LineSegments {
  return new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat)
}

// ═══════════════════════════════════════════════════════════════════════════════
// React component
// ═══════════════════════════════════════════════════════════════════════════════
export default function WireframeHead() {
  const rootRef = useRef<THREE.Group>(null)

  // mutable smoothed expression state (avoids re-renders)
  const le = useRef({
    jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0,
    cornerPull: 0, browLeft: 0, browRight: 0, browRaise: 0,
    eyeOpenL: 1, eyeOpenR: 1,
    headPitch: 0, headYaw: 0, headRoll: 0,
  })

  // ── Materials ──────────────────────────────────────────────────────────────
  const matMesh = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x1a5cff, transparent: true, opacity: 0.62,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), [])
  const matDim = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x0c3399, transparent: true, opacity: 0.38,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), [])
  const matBright = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x44b0ff, transparent: true, opacity: 0.96,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), [])
  const matIris = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x88ddff, transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), [])
  const matLip = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x55ccff, transparent: true, opacity: 0.98,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), [])
  const matCorner = useMemo(() => new THREE.LineBasicMaterial({
    color: 0x2288cc, transparent: true, opacity: 0.70,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), [])

  // ── Build scene graph once ─────────────────────────────────────────────────
  const {
    root,
    jawPivot,
    leftBrow, rightBrow,
    leftEye, rightEye,
    lipParent,
  } = useMemo(() => {
    const root = new THREE.Group()

    // ── Skull mesh ────────────────────────────────────────────────────────
    const skullGeo = buildSurfaceGeo(0.02, JAW_SPLIT_PHI, LAT_SKULL, LON)
    root.add(wireSegments(skullGeo, matMesh))

    // ── Jaw mesh (in pivot-local space) ───────────────────────────────────
    // Hinge Y in world space: y value at the jaw-split latitude (theta=0, front)
    const HINGE_Y = headPt(JAW_SPLIT_PHI, 0).y   // ≈ -0.17
    const jawGeoLocal = buildJawGeoLocal(HINGE_Y, LAT_JAW, LON)
    const jawMesh = wireSegments(jawGeoLocal, matMesh)

    const pivot = new THREE.Group()
    pivot.position.set(0, HINGE_Y, 0)
    pivot.add(jawMesh)
    root.add(pivot)

    // ── Ears ──────────────────────────────────────────────────────────────
    for (const s of [1, -1] as const) {
      root.add(wireSegments(buildEarGeo(s), matDim))
    }

    // ── Neck ──────────────────────────────────────────────────────────────
    root.add(wireSegments(buildNeckGeo(), matDim))

    // ── Brow contours ─────────────────────────────────────────────────────
    const lb = new THREE.Group()
    lb.add(makeBrowContour(1, matBright))
    root.add(lb)

    const rb = new THREE.Group()
    rb.add(makeBrowContour(-1, matBright))
    root.add(rb)

    // ── Eye contours ──────────────────────────────────────────────────────
    const lEye = makeEyeContour(1, matBright, matIris)
    const rEye = makeEyeContour(-1, matBright, matIris)
    root.add(lEye)
    root.add(rEye)

    // ── Structural highlight lines ─────────────────────────────────────────
    root.add(makeJawLine(matBright))
    root.add(makeNoseBridge(matBright))

    // nostril ring highlights
    for (const s of [1, -1] as const) {
      const nPts: THREE.Vector3[] = []
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2
        nPts.push(new THREE.Vector3(
          s * 0.054 + Math.cos(a) * 0.032 * s,
          -0.195 + Math.sin(a) * 0.022,
          0.845 + 0.008,
        ))
      }
      root.add(makeLine(nPts, matDim))
    }

    // ── Lip contour parent (cleared and rebuilt each frame) ───────────────
    const lp = new THREE.Group()
    root.add(lp)

    return { root, jawPivot: pivot, leftBrow: lb, rightBrow: rb, leftEye: lEye, rightEye: rEye, lipParent: lp }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matMesh, matDim, matBright, matIris])

  // Sync animated group refs (happens synchronously before useFrame)
  const jawPivotRef = useRef<THREE.Group>(jawPivot)
  const leftBrowRef = useRef<THREE.Group>(leftBrow)
  const rightBrowRef = useRef<THREE.Group>(rightBrow)
  const leftEyeRef = useRef<THREE.Group>(leftEye)
  const rightEyeRef = useRef<THREE.Group>(rightEye)
  const lipParentRef = useRef<THREE.Group>(lipParent)
  jawPivotRef.current = jawPivot
  leftBrowRef.current = leftBrow
  rightBrowRef.current = rightBrow
  leftEyeRef.current = leftEye
  rightEyeRef.current = rightEye
  lipParentRef.current = lipParent

  useFrame((_, delta) => {
    const expr = useAvatarStore.getState().expression
    const r = le.current
    const fast = 15
    const slow = 7

    r.jawOpen   = damp(r.jawOpen,   expr.jawOpen,          fast, delta)
    r.mouthWidth = damp(r.mouthWidth, expr.mouthWidth,      fast, delta)
    r.lipRound  = damp(r.lipRound,  expr.lipRound,          fast, delta)
    r.lipPress  = damp(r.lipPress,  expr.lipPress,          fast, delta)
    r.cornerPull = damp(r.cornerPull, expr.mouthCornerPull, slow, delta)
    r.browLeft  = damp(r.browLeft,  expr.browLeft,          slow, delta)
    r.browRight = damp(r.browRight, expr.browRight,         slow, delta)
    r.browRaise = damp(r.browRaise, expr.browRaise,         slow, delta)
    r.eyeOpenL  = damp(r.eyeOpenL,  expr.eyeOpenness,       fast * 1.1, delta)
    r.eyeOpenR  = damp(r.eyeOpenR,  expr.eyeOpenness,       fast * 1.1, delta)
    r.headPitch = damp(r.headPitch, expr.headPitch,         6, delta)
    r.headYaw   = damp(r.headYaw,   expr.headYaw,           6, delta)
    r.headRoll  = damp(r.headRoll,  expr.headRoll,          6, delta)

    // Head orientation
    if (rootRef.current) {
      rootRef.current.rotation.x = r.headPitch
      rootRef.current.rotation.y = r.headYaw
      rootRef.current.rotation.z = r.headRoll
    }

    // Jaw: rotate around hinge pivot
    jawPivotRef.current.rotation.x = r.jawOpen * 0.30   // up to ~17°

    // Brows: vertical offset
    leftBrowRef.current.position.y  = r.browRaise * 0.058 + r.browLeft  * 0.040
    rightBrowRef.current.position.y = r.browRaise * 0.058 + r.browRight * 0.040

    // Eyes: scale for blink / squint
    const scL = clamp(r.eyeOpenL, 0.04, 1.30)
    const scR = clamp(r.eyeOpenR, 0.04, 1.30)
    leftEyeRef.current.scale.y  = scL
    rightEyeRef.current.scale.y = scR

    // Lips: rebuild contour each frame
    clearGroup(lipParentRef.current)
    const lines = buildLipLines(
      r.jawOpen, r.mouthWidth, r.lipRound, r.lipPress, r.cornerPull,
      matLip, matCorner,
    )
    for (const ln of lines) lipParentRef.current.add(ln)
  })

  return (
    <group ref={rootRef}>
      <primitive object={root} />
    </group>
  )
}
