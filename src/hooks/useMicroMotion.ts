import { useRef, useEffect } from 'react'
import { useAvatarStore } from '../state/avatarStore'
import { sinWave, noise } from '../utils/math'
import { damp, clamp } from '../utils/spring'
import { emotionProfiles } from '../utils/emotionProfiles'
import { taskProfiles } from '../utils/taskProfiles'

export function useMicroMotion() {
  const setExpression = useAvatarStore(s => s.setExpression)
  const blinkRef = useRef(1)
  const blinkTimerRef = useRef(0)
  const nextBlinkRef = useRef(3)
  const rafRef = useRef(0)
  const lastRef = useRef(performance.now())

  const gazeXRef = useRef(0)
  const gazeYRef = useRef(0)
  const gazeTargetXRef = useRef(0)
  const gazeTargetYRef = useRef(0)
  const gazeTimerRef = useRef(0)

  useEffect(() => {
    const tick = () => {
      const now = performance.now()
      const dt = Math.min((now - lastRef.current) / 1000, 0.05)
      lastRef.current = now
      const t = now / 1000

      const state = useAvatarStore.getState()
      const profile = emotionProfiles[state.emotion]
      const taskProfile = taskProfiles[state.task]
      const intensity = state.intensity
      const isSpeaking = state.isSpeaking

      blinkTimerRef.current += dt
      if (blinkTimerRef.current >= nextBlinkRef.current) {
        blinkTimerRef.current = 0
        nextBlinkRef.current = (3 + Math.random() * 4) / profile.blinkRate
      }
      const blinkPhase = blinkTimerRef.current
      let eyeOpen = 1
      if (blinkPhase < 0.08) eyeOpen = clamp(1 - blinkPhase / 0.04, 0, 1)
      else if (blinkPhase < 0.16) eyeOpen = clamp((blinkPhase - 0.08) / 0.08, 0, 1)
      blinkRef.current = eyeOpen

      gazeTimerRef.current += dt
      if (gazeTimerRef.current > 2 + Math.random() * 3) {
        gazeTimerRef.current = 0
        const scale = taskProfile.gazeDriftScale * intensity * 0.04
        gazeTargetXRef.current = (Math.random() * 2 - 1) * scale
        gazeTargetYRef.current = (Math.random() * 2 - 1) * scale * 0.5
      }
      gazeXRef.current = damp(gazeXRef.current, gazeTargetXRef.current, 3, dt)
      gazeYRef.current = damp(gazeYRef.current, gazeTargetYRef.current, 3, dt)

      const breathScale = profile.breathingAmp * intensity
      const breathPitch = sinWave(t, 0.22, 0.008 * breathScale)
      const breathRoll = sinWave(t, 0.17, 0.004 * breathScale)

      const nodAmp = taskProfile.nodAmplitude * profile.headMotionAmp * intensity
      const nodFreq = taskProfile.nodFrequency
      const nodPitch = isSpeaking ? sinWave(t, nodFreq, nodAmp) : sinWave(t, nodFreq * 0.5, nodAmp * 0.3)

      const yawDrift = noise(t, 0.15) * 0.012 * profile.headMotionAmp * intensity

      const taskBias = taskProfile.headMotionBias

      setExpression({
        eyeOpenness: clamp(blinkRef.current * (profile.base.eyeOpenness ?? 1), 0, 1.4),
        headPitch: breathPitch + nodPitch + taskBias.pitch + gazeYRef.current,
        headYaw: yawDrift + taskBias.yaw + gazeXRef.current,
        headRoll: breathRoll + taskBias.roll,
        neckSway: sinWave(t, 0.18, 0.005 * breathScale),
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [setExpression])
}
