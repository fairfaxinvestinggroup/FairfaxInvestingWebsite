import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 100

type Particle = {
  z: number
  size: number
  speed: number
  phase: number
  drift: number
  lifetime: number
  timeOffset: number
  cycle: number
  xRatio: number
  startingYRatio: number
}

type SquareParticlesProps = {
  color?: string
  opacity?: number
  inversion?: boolean
}

function seededRandom(seed: number) {
  let value = seed

  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function cycleRandom(index: number, cycle: number, salt: number) {
  const value = Math.sin(
    index * 127.1 + cycle * 311.7 + salt * 74.7,
  ) * 43758.5453

  return value - Math.floor(value)
}

export function SquareParticles({
  color = '#0b2f4f',
  opacity = 0.78,
  inversion = false,
}: SquareParticlesProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const { viewport } = useThree()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const uniforms = useMemo(
    () => ({
      particleColor: { value: new THREE.Color(color) },
      particleOpacity: { value: opacity },
    }),
    [color, opacity],
  )
  const particles = useMemo<Particle[]>(
    () => {
      const random = seededRandom(1487)

      return Array.from({ length: PARTICLE_COUNT }, () => {
        const lifetime = 14 + random() * 14

        return {
          z: -0.3 + random() * 0.8,
          size: 0.008 + random() * 0.02,
          speed: 0.006 + random() * 0.014,
          phase: random() * Math.PI * 2,
          drift: 0.012 + random() * 0.028,
          lifetime,
          timeOffset: random() * lifetime,
          cycle: -1,
          xRatio: 0,
          startingYRatio: 0,
        }
      })
    },
    [],
  )

  useFrame(({ clock }) => {
    if (!mesh.current) return

    const elapsed = clock.elapsedTime

    particles.forEach((particle, index) => {
      const particleTime = elapsed + particle.timeOffset
      const cycle = Math.floor(particleTime / particle.lifetime)
      const cycleTime = particleTime % particle.lifetime
      const lifeProgress = cycleTime / particle.lifetime
      if (cycle !== particle.cycle) {
        particle.cycle = cycle
        particle.xRatio = cycleRandom(index, cycle, 1) - 0.5
        particle.startingYRatio = cycleRandom(index, cycle, 2) - 0.5
      }
      const fadeScale = Math.min(
        1,
        lifeProgress * 8,
        (1 - lifeProgress) * 8,
      )

      dummy.position.set(
        particle.xRatio * viewport.width +
          Math.sin(elapsed * 0.35 + particle.phase) * particle.drift,
        particle.startingYRatio * viewport.height + cycleTime * particle.speed,
        particle.z,
      )
      dummy.rotation.z = elapsed * 0.035 + particle.phase
      dummy.scale.setScalar(particle.size * fadeScale)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(index, dummy.matrix)
    })

    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      {inversion ? (
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={`
            void main() {
              gl_Position =
                projectionMatrix *
                modelViewMatrix *
                instanceMatrix *
                vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 particleColor;
            uniform float particleOpacity;

            float ditherThreshold(vec2 position) {
              int x = int(mod(floor(position.x / 1.25), 4.0));
              int y = int(mod(floor(position.y / 1.25), 4.0));

              if (x == 0) {
                if (y == 0) return 16.0 / 17.0;
                if (y == 1) return 5.0 / 17.0;
                if (y == 2) return 13.0 / 17.0;
                return 1.0 / 17.0;
              }
              if (x == 1) {
                if (y == 0) return 8.0 / 17.0;
                if (y == 1) return 12.0 / 17.0;
                if (y == 2) return 4.0 / 17.0;
                return 9.0 / 17.0;
              }
              if (x == 2) {
                if (y == 0) return 14.0 / 17.0;
                if (y == 1) return 2.0 / 17.0;
                if (y == 2) return 15.0 / 17.0;
                return 3.0 / 17.0;
              }
              if (y == 0) return 6.0 / 17.0;
              if (y == 1) return 10.0 / 17.0;
              if (y == 2) return 7.0 / 17.0;
              return 11.0 / 17.0;
            }

            void main() {
              float luminance = mix(
                1.0,
                dot(particleColor, vec3(0.2126, 0.7152, 0.0722)),
                particleOpacity
              );
              float threshold = ditherThreshold(gl_FragCoord.xy);
              float level = (
                floor(luminance * 2.0) +
                step(threshold, fract(luminance * 2.0))
              ) / 2.0;

              if (level >= 0.999) discard;
              gl_FragColor = vec4(vec3(1.0 - level), 1.0);
            }
          `}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      ) : (
        <meshBasicMaterial
          color={color}
          opacity={opacity}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      )}
    </instancedMesh>
  )
}
