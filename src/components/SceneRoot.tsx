import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import WireframeHead from './WireframeHead'
import { useMicroMotion } from '../hooks/useMicroMotion'
import { useEmotionController } from '../hooks/useEmotionController'
import { useTaskContextController } from '../hooks/useTaskContextController'
import { useAudioReactiveMouth } from '../hooks/useAudioReactiveMouth'

function Controllers() {
  useMicroMotion()
  useEmotionController()
  useTaskContextController()
  useAudioReactiveMouth()
  return null
}

export default function SceneRoot() {
  return (
    <Canvas
      camera={{ position: [0.38, 0.12, 2.65], fov: 42 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#060610' }}
    >
      <Suspense fallback={null}>
        <Controllers />
        <WireframeHead />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
        minAzimuthAngle={-Math.PI * 0.45}
        maxAzimuthAngle={Math.PI * 0.45}
        dampingFactor={0.06}
        enableDamping
      />
    </Canvas>
  )
}
