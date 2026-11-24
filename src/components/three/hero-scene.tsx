"use client"
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing"
import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import * as THREE from "three"
import { GLBDrone } from "./glb-drone"
import { ProceduralDrone } from "./procedural-drone"
import type { Quality } from "./quality"

const TURN_SECONDS = 24 // one full turn every 24 seconds

interface Pose {
  pos: [number, number, number]
  rot: [number, number, number]
  scale: number
}

// Poses the drone flies to as the hero scrolls (progress 0, 0.5, 1)
const POSES_DESKTOP: Pose[] = [
  { pos: [0, 1.05, 0], rot: [0.12, 0, 0], scale: 0.72 },
  { pos: [1.75, 0.55, -0.3], rot: [0.45, -0.7, -0.22], scale: 0.8 },
  { pos: [1.2, 1.15, 0], rot: [-0.25, 0.6, 0.18], scale: 0.7 },
]
const POSES_MOBILE: Pose[] = [
  { pos: [0, 1.6, 0], rot: [0.14, 0, 0], scale: 0.5 },
  { pos: [0.1, 1.8, -0.4], rot: [0.45, -0.6, -0.18], scale: 0.5 },
  { pos: [-0.1, 2.0, -1.0], rot: [-0.15, 0.8, 0.25], scale: 0.46 },
]

function samplePose(poses: Pose[], p: number): Pose {
  const t = Math.min(Math.max(p, 0), 1) * (poses.length - 1)
  const i = Math.min(Math.floor(t), poses.length - 2)
  const f = t - i
  const e = f * f * (3 - 2 * f) // smoothstep
  const a = poses[i]
  const b = poses[i + 1]
  const lerp3 = (x: number[], y: number[]) => x.map((v, k) => v + (y[k] - v) * e) as [number, number, number]
  return { pos: lerp3(a.pos, b.pos), rot: lerp3(a.rot, b.rot), scale: a.scale + (b.scale - a.scale) * e }
}

function Rig({
  progress,
  mobile,
  reduced,
  modelUrl,
  quality,
}: {
  progress: RefObject<number>
  mobile: boolean
  reduced: boolean
  modelUrl?: string
  quality: Quality
}) {
  const outer = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const spinner = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      pointer.current.x = THREE.MathUtils.clamp(e.gamma / 30, -1, 1)
      pointer.current.y = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("deviceorientation", onTilt, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("deviceorientation", onTilt)
    }
  }, [])

  useFrame((state, delta) => {
    const d = Math.min(delta, 1 / 20)
    const t = state.clock.elapsedTime
    const pose = samplePose(mobile ? POSES_MOBILE : POSES_DESKTOP, progress.current ?? 0)
    const o = outer.current
    const g = tilt.current
    const s = spinner.current
    if (!o || !g || !s) return

    const bob = reduced ? 0 : Math.sin(t * 1.25) * 0.07 + Math.sin(t * 0.55) * 0.03
    const damp = THREE.MathUtils.damp
    o.position.x = damp(o.position.x, pose.pos[0] + pointer.current.x * 0.12, 3, d)
    o.position.y = damp(o.position.y, pose.pos[1] + bob, 4, d)
    o.position.z = damp(o.position.z, pose.pos[2], 3, d)
    o.scale.setScalar(damp(o.scale.x, pose.scale, 3, d))
    o.rotation.x = damp(o.rotation.x, pose.rot[0], 3, d)
    o.rotation.y = damp(o.rotation.y, pose.rot[1], 3, d)
    o.rotation.z = damp(o.rotation.z, pose.rot[2], 3, d)

    // Lean toward the cursor or the way the phone is tilted
    const swayX = reduced ? 0 : Math.sin(t * 0.8) * 0.02
    g.rotation.x = damp(g.rotation.x, pointer.current.y * 0.16 + swayX, 4, d)
    g.rotation.z = damp(g.rotation.z, -pointer.current.x * 0.22, 4, d)

    // Slow showroom turn
    if (!reduced) s.rotation.y += d * ((Math.PI * 2) / TURN_SECONDS)
  })

  return (
    <group ref={outer} position={[0, mobile ? 1.55 : 1.05, 0]} scale={mobile ? 0.5 : 0.72}>
      <group ref={tilt}>
        <group ref={spinner} rotation={[0, -0.5, 0]}>
          {modelUrl ? (
            <Suspense fallback={<ProceduralDrone quality={quality} spin={!reduced} />}>
              <GLBDrone url={modelUrl} spin={!reduced} />
            </Suspense>
          ) : (
            <ProceduralDrone quality={quality} spin={!reduced} />
          )}
        </group>
      </group>
    </group>
  )
}

function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  const frames = useRef(0)
  useFrame(() => {
    if (done.current) return
    if (++frames.current > 1) {
      done.current = true
      onReady()
    }
  })
  return null
}

function CameraFit({ mobile }: { mobile: boolean }) {
  const { camera, size } = useThree()
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    // Pull back on narrow screens so the full span stays in frame
    const aspect = size.width / size.height
    cam.position.set(0, mobile ? 3.2 : 2.6, aspect < 0.8 ? 9.6 : aspect < 1.2 ? 8.2 : 7.4)
    cam.lookAt(0, mobile ? 0.55 : 0.35, 0)
    cam.updateProjectionMatrix()
  }, [camera, size, mobile])
  return null
}

export default function HeroScene({
  progress,
  quality: initialQuality,
  mobile,
  reduced,
  light,
  modelUrl,
  onReady,
}: {
  progress: RefObject<number>
  quality: Quality
  mobile: boolean
  reduced: boolean
  light: boolean
  modelUrl?: string
  onReady: () => void
}) {
  const [quality, setQuality] = useState<Quality>(initialQuality)
  const [dpr, setDpr] = useState(initialQuality === "high" ? 1.5 : initialQuality === "mid" ? 1.3 : 1)
  // Full postprocessing only on strong devices. Phones get LED glow sprites instead.
  const post = quality === "high"
  const rim = useMemo(() => new THREE.Color("#00ff85"), [])

  return (
    <Canvas
      dpr={dpr}
      camera={{ fov: 32, near: 0.1, far: 60, position: [0, 1.4, 7] }}
      gl={{
        antialias: quality !== "low",
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = light ? 1.05 : 1.15
      }}
      aria-hidden
    >
      <color attach="background" args={[light ? "#ffffff" : "#050505"]} />
      <fog attach="fog" args={[light ? "#ffffff" : "#050505", 9, 22]} />
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1)
          setQuality("low")
        }}
        flipflops={2}
      />
      <CameraFit mobile={mobile} />
      <ambientLight intensity={light ? 0.6 : 0.22} />
      <directionalLight position={[3, 6, 4]} intensity={light ? 2.2 : 2.6} color="#ffffff" />
      <directionalLight position={[-5, 2, 2]} intensity={0.5} color="#cfe3ff" />
      {/* Green rim from behind */}
      <spotLight position={[0, 0.9, -5]} angle={0.5} penumbra={1} intensity={light ? 14 : 26} color={rim} distance={12} />
      <pointLight position={[-3.5, 1.2, -2.5]} intensity={light ? 4 : 7} color={rim} distance={7} />
      <pointLight position={[3.5, 0.6, -2.5]} intensity={light ? 3 : 6} color={rim} distance={7} />

      <Environment resolution={quality === "high" ? 256 : quality === "mid" ? 128 : 64} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 2]} scale={[8, 2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, 1]} scale={[2, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1, 1]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" color="#00ff85" intensity={0.8} position={[0, -1, -6]} scale={2} />
      </Environment>

      <Rig progress={progress} mobile={mobile} reduced={reduced} modelUrl={modelUrl} quality={quality} />

      {/* Soft ground shadow on the dark stage (in light mode it reads as a smudge behind the panel) */}
      {!light && (
        <ContactShadows
          position={[0, mobile ? 0.55 : 0.05, 0]}
          opacity={0.6}
          scale={9}
          blur={2.6}
          far={3.2}
          resolution={quality === "low" ? 256 : 512}
          frames={1}
          color="#000000"
        />
      )}

      {post &&
        (light ? (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.6} luminanceThreshold={1} luminanceSmoothing={0.2} mipmapBlur radius={0.7} />
          </EffectComposer>
        ) : (
          <EffectComposer multisampling={0}>
            <Bloom intensity={1.1} luminanceThreshold={1} luminanceSmoothing={0.2} mipmapBlur radius={0.7} />
            <Vignette eskil={false} offset={0.25} darkness={0.55} />
          </EffectComposer>
        ))}
      <Ready onReady={onReady} />
    </Canvas>
  )
}
