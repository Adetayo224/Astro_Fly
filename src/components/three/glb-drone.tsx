"use client"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { forwardRef, useMemo } from "react"
import * as THREE from "three"

/**
 * Loads public/models/drone.glb (optimised with gltf-transform + meshopt),
 * normalises its size to match the procedural drone, and spins any node whose
 * name looks like a propeller.
 */
export const GLBDrone = forwardRef<THREE.Group, { url: string; spin?: boolean }>(function GLBDrone(
  { url, spin = true },
  ref,
) {
  const { scene } = useGLTF(url, false, true)

  const { model, props } = useMemo(() => {
    const model = scene.clone(true)
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = 2.9 / Math.max(size.x, size.z, 0.0001)
    model.position.sub(center.multiplyScalar(s))
    model.scale.setScalar(s)
    const props: THREE.Object3D[] = []
    model.traverse((o) => {
      if (/prop|blade|rotor|propeller/i.test(o.name) && !props.some((p) => p === o.parent)) props.push(o)
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return { model, props }
  }, [scene])

  useFrame((_, delta) => {
    const d = Math.min(delta, 1 / 20)
    props.forEach((p, i) => {
      p.rotation.y += (i % 2 ? -1 : 1) * d * (spin ? 30 : 1)
    })
  })

  return (
    <group ref={ref}>
      <primitive object={model} />
    </group>
  )
})
