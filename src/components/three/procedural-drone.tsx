"use client"
import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { forwardRef, useMemo, useRef } from "react"
import * as THREE from "three"

/**
 * A detailed procedural foldable camera drone (Mavic / Mini style).
 * Built from extruded, bevelled outlines so it reads as a real product,
 * not a toy. Forward is +Z. Overall span is roughly 3 units.
 */

const GREEN = new THREE.Color("#00ff85")

function fuselageShape(scale = 1) {
  // Top view outline, x = width, y = length (becomes -z after rotation)
  const s = new THREE.Shape()
  const p = (x: number, y: number) => [x * scale, y * scale] as const
  s.moveTo(...p(0, 1.02))
  s.bezierCurveTo(...p(0.22, 1.02), ...p(0.34, 0.96), ...p(0.38, 0.78))
  s.lineTo(...p(0.5, 0.25))
  s.bezierCurveTo(...p(0.56, 0.0), ...p(0.56, -0.35), ...p(0.52, -0.62))
  s.bezierCurveTo(...p(0.48, -0.9), ...p(0.34, -1.02), ...p(0, -1.04))
  s.bezierCurveTo(...p(-0.34, -1.02), ...p(-0.48, -0.9), ...p(-0.52, -0.62))
  s.bezierCurveTo(...p(-0.56, -0.35), ...p(-0.56, 0.0), ...p(-0.5, 0.25))
  s.lineTo(...p(-0.38, 0.78))
  s.bezierCurveTo(...p(-0.34, 0.96), ...p(-0.22, 1.02), ...p(0, 1.02))
  return s
}

function bladeShape() {
  // Slim swept blade, root at origin, tip at +x
  const s = new THREE.Shape()
  s.moveTo(0.06, -0.02)
  s.bezierCurveTo(0.25, -0.075, 0.5, -0.085, 0.74, -0.05)
  s.bezierCurveTo(0.8, -0.04, 0.84, -0.015, 0.84, 0.005)
  s.bezierCurveTo(0.83, 0.03, 0.78, 0.04, 0.7, 0.04)
  s.bezierCurveTo(0.48, 0.05, 0.24, 0.05, 0.06, 0.03)
  s.closePath()
  return s
}

function blurTexture() {
  const size = 256
  const c = document.createElement("canvas")
  c.width = c.height = size
  const g = c.getContext("2d")!
  const grad = g.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size / 2)
  grad.addColorStop(0, "rgba(255,255,255,0)")
  grad.addColorStop(0.35, "rgba(200,210,205,0.05)")
  grad.addColorStop(0.8, "rgba(220,230,225,0.12)")
  grad.addColorStop(0.9, "rgba(0,255,133,0.35)")
  grad.addColorStop(0.95, "rgba(220,230,225,0.05)")
  grad.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function glowTexture() {
  const size = 128
  const c = document.createElement("canvas")
  c.width = c.height = size
  const g = c.getContext("2d")!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, "rgba(255,255,255,1)")
  grad.addColorStop(0.25, "rgba(255,255,255,0.5)")
  grad.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

export interface DroneHandles {
  props: THREE.Object3D[]
  blinkers: THREE.MeshStandardMaterial[]
}

interface ArmSpec {
  root: [number, number, number]
  tip: [number, number, number]
  dir: 1 | -1
  front: boolean
}

const ARMS: ArmSpec[] = [
  { root: [0.38, 0.1, 0.5], tip: [1.32, 0.16, 1.02], dir: 1, front: true },
  { root: [-0.38, 0.1, 0.5], tip: [-1.32, 0.16, 1.02], dir: -1, front: true },
  { root: [0.44, -0.12, -0.62], tip: [1.28, -0.02, -1.12], dir: -1, front: false },
  { root: [-0.44, -0.12, -0.62], tip: [-1.28, -0.02, -1.12], dir: 1, front: false },
]

export const ProceduralDrone = forwardRef<THREE.Group, { spin?: boolean; quality?: "low" | "mid" | "high" }>(
  function ProceduralDrone({ spin = true, quality = "high" }, ref) {
    const propRefs = useRef<THREE.Group[]>([])
    const discRefs = useRef<THREE.Mesh[]>([])
    const blink = useRef<THREE.MeshStandardMaterial>(null)
    const seg = quality === "high" ? 6 : quality === "mid" ? 4 : 3

    const geo = useMemo(() => {
      const extrude = (shape: THREE.Shape, depth: number, bevel: number, bevelSeg: number) => {
        const g = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness: bevel,
          bevelSize: bevel * 0.85,
          bevelSegments: bevelSeg,
          curveSegments: quality === "high" ? 36 : quality === "mid" ? 24 : 14,
        })
        g.rotateX(-Math.PI / 2)
        g.center()
        g.computeVertexNormals()
        return g
      }
      const blade = new THREE.ExtrudeGeometry(bladeShape(), {
        depth: 0.012,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 2,
        curveSegments: 20,
      })
      blade.rotateX(-Math.PI / 2)
      return {
        body: extrude(fuselageShape(1), 0.26, 0.07, seg),
        shell: extrude(fuselageShape(0.86), 0.04, 0.035, seg),
        belly: extrude(fuselageShape(0.8), 0.06, 0.04, seg),
        blade,
        tipGeo: new THREE.BoxGeometry(0.08, 0.02, 0.07),
      }
    }, [quality, seg])

    const mat = useMemo(() => {
      // Clearcoat and iridescence only on strong devices; phones get cheaper standard materials.
      const rich = quality === "high"
      const surface = (
        base: THREE.MeshStandardMaterialParameters,
        extra: THREE.MeshPhysicalMaterialParameters,
      ): THREE.MeshStandardMaterial =>
        rich ? new THREE.MeshPhysicalMaterial({ ...base, ...extra }) : new THREE.MeshStandardMaterial(base)
      const shell = surface(
        { color: "#9ca29e", metalness: 0.1, roughness: 0.4 },
        { clearcoat: 0.6, clearcoatRoughness: 0.25 },
      )
      const top = surface({ color: "#b4bab6", metalness: 0.05, roughness: 0.32 }, { clearcoat: 1, clearcoatRoughness: 0.15 })
      const dark = new THREE.MeshStandardMaterial({ color: "#121513", metalness: 0.2, roughness: 0.55 })
      const metal = new THREE.MeshStandardMaterial({ color: "#8d9591", metalness: 0.95, roughness: 0.28 })
      const blade = new THREE.MeshStandardMaterial({ color: "#3a403c", metalness: 0.1, roughness: 0.5, side: THREE.DoubleSide })
      const glass = surface(
        { color: "#050807", metalness: 0.4, roughness: 0.05 },
        { clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.7, iridescenceIOR: 1.6 },
      )
      const led = new THREE.MeshStandardMaterial({
        color: GREEN,
        emissive: GREEN,
        emissiveIntensity: 5,
        toneMapped: false,
      })
      const accent = new THREE.MeshStandardMaterial({
        color: GREEN,
        emissive: GREEN,
        emissiveIntensity: 0.6,
        roughness: 0.4,
      })
      const disc = new THREE.MeshBasicMaterial({
        map: blurTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
        side: THREE.DoubleSide,
      })
      const glow = new THREE.SpriteMaterial({
        map: glowTexture(),
        color: GREEN,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: rich ? 0.35 : 0.85,
      })
      return { shell, top, dark, metal, blade, glass, led, accent, disc, glow }
    }, [quality])

    useFrame((state, delta) => {
      const d = Math.min(delta, 1 / 20)
      propRefs.current.forEach((p, i) => {
        if (!p) return
        const dir = ARMS[i].dir
        p.rotation.y += dir * d * (spin ? 34 : 1.5)
      })
      discRefs.current.forEach((m, i) => {
        if (!m) return
        m.rotation.z += ARMS[i].dir * d * 9
        ;(m.material as THREE.MeshBasicMaterial).opacity = spin ? 0.6 : 0
      })
      if (blink.current) {
        const t = state.clock.elapsedTime
        blink.current.emissiveIntensity = Math.sin(t * 3.2) > 0.2 ? 6 : 0.4
      }
    })

    return (
      <group ref={ref} dispose={null}>
        {/* Fuselage */}
        <mesh geometry={geo.body} material={mat.shell} castShadow receiveShadow />
        <mesh geometry={geo.shell} material={mat.top} position={[0, 0.2, -0.04]} castShadow />
        <mesh geometry={geo.belly} material={mat.dark} position={[0, -0.18, -0.06]} />

        {/* Shell seam, nose visor and side vents */}
        <mesh geometry={geo.shell} material={mat.dark} position={[0, 0.185, -0.04]} scale={[1.03, 0.4, 1.02]} />
        <RoundedBox args={[0.62, 0.17, 0.14]} radius={0.06} smoothness={seg} position={[0, 0.06, 0.9]} material={mat.glass} />
        {[-1, 1].map((side) =>
          [0, 1, 2].map((k) => (
            <mesh key={`${side}${k}`} position={[side * 0.555, 0.02, -0.15 - k * 0.12]} material={mat.dark}>
              <boxGeometry args={[0.02, 0.05, 0.08]} />
            </mesh>
          )),
        )}

        {/* Top vents and battery seam */}
        {[-0.18, -0.06, 0.06, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.245, -0.55]} material={mat.dark}>
            <boxGeometry args={[0.05, 0.012, 0.32]} />
          </mesh>
        ))}
        <mesh position={[0, 0.236, 0.05]} material={mat.dark}>
          <boxGeometry args={[0.62, 0.008, 0.012]} />
        </mesh>
        <mesh position={[0, 0.24, -0.86]} material={mat.metal}>
          <boxGeometry args={[0.26, 0.02, 0.05]} />
        </mesh>

        {/* Forward vision sensors */}
        {[-0.2, 0.2].map((x) => (
          <group key={x} position={[x, 0.07, 0.96]} rotation={[0, x > 0 ? 0.3 : -0.3, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={mat.dark}>
              <cylinderGeometry args={[0.07, 0.07, 0.04, 24]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.022]} material={mat.glass}>
              <cylinderGeometry args={[0.045, 0.045, 0.01, 24]} />
            </mesh>
          </group>
        ))}

        {/* Rear status LED */}
        <mesh position={[0, 0.02, -1.13]}>
          <boxGeometry args={[0.22, 0.03, 0.02]} />
          <meshStandardMaterial ref={blink} color={GREEN} emissive={GREEN} emissiveIntensity={5} toneMapped={false} />
        </mesh>

        <sprite material={mat.glow} position={[0, 0.02, -1.16]} scale={[0.6, 0.22, 1]} />

        {/* Gimbal and camera */}
        <group position={[0, -0.2, 0.92]}>
          <mesh material={mat.dark} position={[0, 0.06, -0.06]}>
            <boxGeometry args={[0.18, 0.1, 0.12]} />
          </mesh>
          <mesh material={mat.metal} position={[0.2, -0.04, 0]}>
            <boxGeometry args={[0.035, 0.2, 0.12]} />
          </mesh>
          <mesh material={mat.metal} position={[-0.2, -0.04, 0]}>
            <boxGeometry args={[0.035, 0.2, 0.12]} />
          </mesh>
          <RoundedBox args={[0.36, 0.26, 0.28]} radius={0.07} smoothness={seg} position={[0, -0.1, 0.02]} material={mat.dark} castShadow />
          <group position={[0, -0.1, 0.17]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={mat.metal}>
              <cylinderGeometry args={[0.105, 0.105, 0.03, 40]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]} material={mat.glass}>
              <cylinderGeometry args={[0.085, 0.085, 0.02, 40]} />
            </mesh>
            <mesh position={[0, 0, 0.024]}>
              <torusGeometry args={[0.06, 0.004, 8, 48]} />
              <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={2.4} toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* Arms, motors, propellers, legs and LEDs */}
        {ARMS.map((a, i) => {
          const root = new THREE.Vector3(...a.root)
          const tip = new THREE.Vector3(...a.tip)
          const mid = root.clone().lerp(tip, 0.5)
          const v = tip.clone().sub(root)
          const len = v.length()
          const yaw = Math.atan2(v.x, v.z)
          const pitch = -Math.asin(v.y / len)
          return (
            <group key={i}>
              <group position={mid} rotation={[pitch, yaw, 0]}>
                <RoundedBox args={[0.12, 0.1, len]} radius={0.04} smoothness={seg} material={mat.shell} castShadow />
                <mesh position={[0, 0.052, 0]} material={mat.top}>
                  <boxGeometry args={[0.07, 0.01, len * 0.8]} />
                </mesh>
              </group>
              <group position={tip}>
                {/* Motor */}
                <mesh material={mat.shell} position={[0, -0.02, 0]} castShadow>
                  <cylinderGeometry args={[0.13, 0.14, 0.14, 32]} />
                </mesh>
                <mesh material={mat.metal} position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.105, 0.115, 0.07, 32]} />
                </mesh>
                {/* Landing leg */}
                <mesh material={mat.shell} position={[0, a.front ? -0.2 : -0.17, a.front ? 0.02 : -0.02]}>
                  <boxGeometry args={[0.05, a.front ? 0.28 : 0.22, 0.12]} />
                </mesh>
                {/* Under arm LED */}
                <mesh position={[0, -0.1, a.front ? 0.12 : -0.12]} material={a.front ? mat.led : mat.accent}>
                  <sphereGeometry args={[0.028, 12, 12]} />
                </mesh>
                {a.front && <sprite material={mat.glow} position={[0, -0.1, 0.13]} scale={0.34} />}
                {/* Propeller */}
                <group
                  position={[0, 0.13, 0]}
                  ref={(el) => {
                    if (el) propRefs.current[i] = el
                  }}
                >
                  <mesh material={mat.metal}>
                    <cylinderGeometry args={[0.05, 0.06, 0.05, 20]} />
                  </mesh>
                  {[0, Math.PI].map((r) => (
                    <group key={r} rotation={[0, r, 0]}>
                      <group rotation={[a.dir * 0.16, 0, 0]}>
                        <mesh geometry={geo.blade} material={mat.blade} scale={[a.dir, 1, 1]} />
                        <mesh geometry={geo.tipGeo} material={mat.accent} position={[a.dir * 0.8, 0.008, 0]} />
                      </group>
                    </group>
                  ))}
                </group>
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, 0.14, 0]}
                  material={mat.disc}
                  ref={(el) => {
                    if (el) discRefs.current[i] = el
                  }}
                >
                  <circleGeometry args={[0.86, 48]} />
                </mesh>
              </group>
            </group>
          )
        })}
      </group>
    )
  },
)
