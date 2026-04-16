import { Canvas } from '@react-three/fiber'
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
      camera={{ position: [0, 0.05, 2.8], fov: 38 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0a0a0f' }}
    >
      <ambientLight intensity={0.15} />
      <pointLight position={[2, 3, 2]} intensity={0.6} color="#4a9eff" />
      <pointLight position={[-2, -1, 1]} intensity={0.25} color="#7b5ea7" />
      <Suspense fallback={null}>
        <Controllers />
        <WireframeHead />
      </Suspense>
    </Canvas>
  )
}
