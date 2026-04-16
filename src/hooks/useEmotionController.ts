import { useRef, useEffect } from 'react'
import { useAvatarStore } from '../state/avatarStore'
import { emotionProfiles } from '../utils/emotionProfiles'
import { SpringValue } from '../utils/spring'
import type { ExpressionState } from '../state/avatarStore'

type SpringMap = { [K in keyof ExpressionState]: SpringValue }

function makeSpringMap(): SpringMap {
  return {
    jawOpen: new SpringValue(0),
    mouthWidth: new SpringValue(0),
    lipRound: new SpringValue(0),
    lipPress: new SpringValue(0),
    mouthCornerPull: new SpringValue(0),
    browLeft: new SpringValue(0),
    browRight: new SpringValue(0),
    browRaise: new SpringValue(0),
    eyeOpenness: new SpringValue(1),
    cheekRaise: new SpringValue(0),
    headPitch: new SpringValue(0),
    headYaw: new SpringValue(0),
    headRoll: new SpringValue(0),
    neckSway: new SpringValue(0),
  }
}

export function useEmotionController() {
  const springsRef = useRef<SpringMap>(makeSpringMap())
  const setExpression = useAvatarStore(s => s.setExpression)
  const lastTickRef = useRef(performance.now())
  const rafRef = useRef(0)

  useEffect(() => {
    const tick = () => {
      const now = performance.now()
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.05)
      lastTickRef.current = now

      const state = useAvatarStore.getState()
      const profile = emotionProfiles[state.emotion]
      const base = profile.base as Partial<ExpressionState>
      const k = profile.springStiffness
      const d = profile.springDamping
      const isSpeaking = state.isSpeaking
      const liveExpr = state.expression

      const springs = springsRef.current
      const keys = Object.keys(springs) as (keyof ExpressionState)[]

      for (const key of keys) {
        const spring = springs[key]
        spring.stiffness = k
        spring.damping = d

        let target = base[key] ?? 0
        if (key === 'eyeOpenness') target = base.eyeOpenness ?? 1

        if (isSpeaking && ['jawOpen', 'mouthWidth', 'lipRound', 'lipPress'].includes(key)) {
          target = liveExpr[key]
        }

        spring.setTarget(target)
        spring.step(dt)
      }

      const next: Partial<ExpressionState> = {}
      for (const key of keys) {
        if (isSpeaking && ['jawOpen', 'mouthWidth', 'lipRound', 'lipPress'].includes(key)) continue
        ;(next as Record<string, number>)[key] = springsRef.current[key].current
      }

      setExpression(next)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [setExpression])
}
