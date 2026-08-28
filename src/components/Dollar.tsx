import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = `${import.meta.env.BASE_URL}models/dollar.glb`
const EFFECT_RADIUS = 0.15
const PUSH_STRENGTH = 0.3
const RETURN_SPEED = 3

type AnimatedMesh = {
  mesh: THREE.Mesh
  originalPosition: THREE.Vector3
  originalGroupCenter: THREE.Vector3
  originalWorldCenter: THREE.Vector3
  targetPosition: THREE.Vector3
  pushDirection: THREE.Vector3
}

export function Model(props: ThreeElements['group']) {
  const { scene } = useGLTF(MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])
  const groupRef = useRef<THREE.Group>(null)
  const meshesRef = useRef<AnimatedMesh[]>([])
  const rotationVelocity = useRef({
    y: (Math.random() < 0.5 ? -1 : 1) * 0.12,
    z: (Math.random() * 2 - 1) * 0.015,
  })
  const initialZRotation = useRef<number | null>(null)
  const zDrift = useRef(0)
  const mouseWorld = useRef(new THREE.Vector3())
  const interactionPlane = useRef(new THREE.Plane())
  const planeNormal = useRef(new THREE.Vector3())
  const modelWorldPosition = useRef(new THREE.Vector3())
  const inverseParentMatrix = useRef(new THREE.Matrix4())
  const lastPointerMoveAt = useRef(Number.NEGATIVE_INFINITY)
  const interactionStrength = useRef(0)
  const interactionWasRunning = useRef(false)
  const { camera, gl, pointer, raycaster } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const markPointerActive = () => {
      lastPointerMoveAt.current = performance.now()
    }
    const stopPointerInteraction = () => {
      lastPointerMoveAt.current = Number.NEGATIVE_INFINITY
    }

    canvas.addEventListener('pointermove', markPointerActive, { passive: true })
    canvas.addEventListener('pointerleave', stopPointerInteraction)

    return () => {
      canvas.removeEventListener('pointermove', markPointerActive)
      canvas.removeEventListener('pointerleave', stopPointerInteraction)
    }
  }, [gl])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    group.updateWorldMatrix(true, true)
    const nestedMeshes: THREE.Mesh[] = []
    group.traverse((object) => {
      if (object instanceof THREE.Mesh && object.parent instanceof THREE.Mesh) {
        nestedMeshes.push(object)
      }
    })
    nestedMeshes.forEach((mesh) => group.attach(mesh))
    group.updateWorldMatrix(true, true)

    const meshes: AnimatedMesh[] = []
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()

      const center = new THREE.Vector3()
      object.geometry.boundingBox?.getCenter(center)
      const originalWorldCenter = object.localToWorld(center.clone())
      const originalGroupCenter = group.worldToLocal(originalWorldCenter.clone())
      meshes.push({
        mesh: object,
        originalPosition: object.position.clone(),
        originalGroupCenter,
        originalWorldCenter,
        targetPosition: object.position.clone(),
        pushDirection: new THREE.Vector3(),
      })
    })
    meshesRef.current = meshes
  }, [model])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    if (initialZRotation.current === null) initialZRotation.current = group.rotation.z
    zDrift.current += delta * rotationVelocity.current.z
    if (Math.abs(zDrift.current) >= 0.15) {
      zDrift.current = THREE.MathUtils.clamp(zDrift.current, -0.15, 0.15)
      rotationVelocity.current.z *= -1
    }
    group.rotation.y += delta * rotationVelocity.current.y
    group.rotation.z = initialZRotation.current + zDrift.current

    const smoothing = 1 - Math.exp(-RETURN_SPEED * delta)
    const pointerIsActive = performance.now() - lastPointerMoveAt.current < 500
    const interactionSmoothing = 1 - Math.exp(-(pointerIsActive ? 5 : 8) * delta)
    interactionStrength.current = THREE.MathUtils.lerp(
      interactionStrength.current,
      pointerIsActive ? 1 : 0,
      interactionSmoothing,
    )
    const interactionIsRunning = pointerIsActive || interactionStrength.current > 0.001

    if (!interactionIsRunning) {
      if (!interactionWasRunning.current) return
      let meshesAreSettled = true
      for (const item of meshesRef.current) {
        item.mesh.position.lerp(item.originalPosition, smoothing)
        if (item.mesh.position.distanceToSquared(item.originalPosition) > 1e-8) {
          meshesAreSettled = false
        } else {
          item.mesh.position.copy(item.originalPosition)
        }
      }
      interactionWasRunning.current = !meshesAreSettled
      return
    }

    interactionWasRunning.current = true
    group.updateWorldMatrix(true, true)
    group.getWorldPosition(modelWorldPosition.current)
    camera.getWorldDirection(planeNormal.current)
    interactionPlane.current.setFromNormalAndCoplanarPoint(
      planeNormal.current,
      modelWorldPosition.current,
    )
    raycaster.setFromCamera(pointer, camera)
    const mouseHit = raycaster.ray.intersectPlane(interactionPlane.current, mouseWorld.current)

    for (const item of meshesRef.current) {
      const {
        mesh,
        originalPosition,
        originalGroupCenter,
        originalWorldCenter,
        targetPosition,
        pushDirection,
      } = item
      originalWorldCenter.copy(originalGroupCenter)
      group.localToWorld(originalWorldCenter)
      targetPosition.copy(originalPosition)

      if (mouseHit && pointerIsActive) {
        const dx = originalWorldCenter.x - mouseWorld.current.x
        const dy = originalWorldCenter.y - mouseWorld.current.y
        const distanceSquared = dx * dx + dy * dy
        if (distanceSquared < EFFECT_RADIUS ** 2 && distanceSquared > 1e-6) {
          const distance = Math.sqrt(distanceSquared)
          const repulsion =
            PUSH_STRENGTH *
            (1 - distance / EFFECT_RADIUS) *
            interactionStrength.current
          pushDirection.set(dx / distance, dy / distance, 0)
          if (mesh.parent) {
            inverseParentMatrix.current.copy(mesh.parent.matrixWorld).invert()
            pushDirection.transformDirection(inverseParentMatrix.current)
          }
          pushDirection.multiplyScalar(repulsion)
          targetPosition.add(pushDirection)
          targetPosition.z += repulsion * 0.35
        }
      }
      mesh.position.lerp(targetPosition, smoothing)
    }
  })

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
