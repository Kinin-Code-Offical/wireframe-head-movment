import { useAvatarStore } from '../state/avatarStore'

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="debug-row">
      <span className="key">{k}</span>
      <span className="val">{v}</span>
    </div>
  )
}

export default function DebugPanel() {
  const expr = useAvatarStore(s => s.expression)
  const emotion = useAvatarStore(s => s.emotion)
  const task = useAvatarStore(s => s.task)
  const speechProgress = useAvatarStore(s => s.speechProgress)
  const audioLevel = useAvatarStore(s => s.audioLevel)

  const f = (v: number) => v.toFixed(3)

  return (
    <div className="debug-panel">
      <div className="title">Debug</div>
      <Row k="jawOpen" v={f(expr.jawOpen)} />
      <Row k="mouthWidth" v={f(expr.mouthWidth)} />
      <Row k="lipRound" v={f(expr.lipRound)} />
      <Row k="browLeft" v={f(expr.browLeft)} />
      <Row k="browRight" v={f(expr.browRight)} />
      <Row k="blink" v={f(1 - expr.eyeOpenness)} />
      <Row k="headPitch" v={f(expr.headPitch)} />
      <Row k="headYaw" v={f(expr.headYaw)} />
      <Row k="headRoll" v={f(expr.headRoll)} />
      <Row k="speechProg" v={(speechProgress * 100).toFixed(1) + '%'} />
      <Row k="emotion" v={emotion} />
      <Row k="task" v={task} />
      <Row k="audioLevel" v={f(audioLevel)} />
    </div>
  )
}
