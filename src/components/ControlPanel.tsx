import { useAvatarStore } from '../state/avatarStore'
import { useSpeechController } from '../hooks/useSpeechController'
import type { EmotionType, TaskType } from '../state/avatarStore'

const EMOTIONS: EmotionType[] = ['neutral','happy','sad','angry','surprised','thinking','focused','calm']
const TASKS: TaskType[] = ['greeting','explaining','warning','success','error','thinking','listening','idle']

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  )
}

export default function ControlPanel() {
  const store = useAvatarStore()
  const { speak, stop } = useSpeechController()

  return (
    <div className="control-panel">
      <h2>Avatar Controls</h2>

      <div className="field">
        <label>Speech Text</label>
        <textarea
          value={store.speechText}
          onChange={e => store.setSpeechText(e.target.value)}
          rows={3}
        />
      </div>

      <div className="btn-row">
        <button onClick={speak} disabled={store.isSpeaking}>▶ Speak</button>
        <button className="danger" onClick={stop}>■ Stop</button>
      </div>

      <div className="field">
        <label>Emotion</label>
        <select value={store.emotion} onChange={e => store.setEmotion(e.target.value as EmotionType)}>
          {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Task Context</label>
        <select value={store.task} onChange={e => store.setTask(e.target.value as TaskType)}>
          {TASKS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Speech Rate</label>
        <div className="slider-row">
          <input type="range" min="0.5" max="2" step="0.05" value={store.speechRate}
            onChange={e => store.setSpeechRate(Number(e.target.value))} />
          <span>{store.speechRate.toFixed(2)}</span>
        </div>
      </div>

      <div className="field">
        <label>Speech Pitch</label>
        <div className="slider-row">
          <input type="range" min="0.5" max="2" step="0.05" value={store.speechPitch}
            onChange={e => store.setSpeechPitch(Number(e.target.value))} />
          <span>{store.speechPitch.toFixed(2)}</span>
        </div>
      </div>

      <div className="field">
        <label>Intensity</label>
        <div className="slider-row">
          <input type="range" min="0" max="1" step="0.05" value={store.intensity}
            onChange={e => store.setIntensity(Number(e.target.value))} />
          <span>{store.intensity.toFixed(2)}</span>
        </div>
      </div>

      <div className="toggle-row">
        <label>Auto emotion from task</label>
        <Toggle checked={store.autoEmotionFromTask} onChange={store.setAutoEmotionFromTask} />
      </div>

      <div className="toggle-row">
        <label>Show debug panel</label>
        <Toggle checked={store.showDebug} onChange={store.setShowDebug} />
      </div>

      <div className="toggle-row">
        <label>Audio reactive mode</label>
        <Toggle checked={store.audioReactiveMode} onChange={store.setAudioReactiveMode} />
      </div>

      {store.audioReactiveMode && (
        <button className="secondary" onClick={() => {
          store.setAudioReactiveMode(false)
          setTimeout(() => store.setAudioReactiveMode(true), 100)
        }}>🎤 Request Microphone</button>
      )}
    </div>
  )
}
