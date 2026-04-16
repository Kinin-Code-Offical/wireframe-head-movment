import SceneRoot from './components/SceneRoot'
import ControlPanel from './components/ControlPanel'
import DebugPanel from './components/DebugPanel'
import { useAvatarStore } from './state/avatarStore'

export default function App() {
  const showDebug = useAvatarStore(s => s.showDebug)
  const isSpeaking = useAvatarStore(s => s.isSpeaking)

  return (
    <div className="app-root">
      <div className="scene-container">
        <SceneRoot />
      </div>
      <ControlPanel />
      {showDebug && <DebugPanel />}
      <div className="status-bar">
        <div className={`status-dot ${isSpeaking ? 'active' : ''}`} />
        <span>{isSpeaking ? 'Speaking' : 'Idle'}</span>
      </div>
    </div>
  )
}
