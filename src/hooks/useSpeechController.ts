import { useRef, useCallback, useEffect } from 'react'
import { useAvatarStore } from '../state/avatarStore'
import { buildLipCurve, sampleLipCurve, estimateDuration } from '../utils/speechMapping'
import { damp } from '../utils/spring'

export function useSpeechController() {
  const setIsSpeaking = useAvatarStore(s => s.setIsSpeaking)
  const setExpression = useAvatarStore(s => s.setExpression)
  const setSpeechProgress = useAvatarStore(s => s.setSpeechProgress)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const startTimeRef = useRef(0)
  const durationRef = useRef(0)
  const lipFramesRef = useRef<ReturnType<typeof buildLipCurve>>([])
  const rafRef = useRef(0)
  const jawRef = useRef(0)
  const mwRef = useRef(0)
  const lrRef = useRef(0)
  const lpRef = useRef(0)

  const animateLip = useCallback(() => {
    const now = performance.now()
    const progress = durationRef.current > 0
      ? Math.min(1, (now - startTimeRef.current) / durationRef.current)
      : 0

    setSpeechProgress(progress)

    const target = sampleLipCurve(lipFramesRef.current, progress)
    const dt = 1 / 60
    jawRef.current = damp(jawRef.current, target.jawOpen, 18, dt)
    mwRef.current = damp(mwRef.current, target.mouthWidth, 14, dt)
    lrRef.current = damp(lrRef.current, target.lipRound, 12, dt)
    lpRef.current = damp(lpRef.current, target.lipPress, 14, dt)

    setExpression({
      jawOpen: jawRef.current,
      mouthWidth: mwRef.current,
      lipRound: lrRef.current,
      lipPress: lpRef.current,
    })

    if (useAvatarStore.getState().isSpeaking) {
      rafRef.current = requestAnimationFrame(animateLip)
    }
  }, [setExpression, setSpeechProgress])

  const speak = useCallback(() => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    cancelAnimationFrame(rafRef.current)

    const state = useAvatarStore.getState()
    const text = state.speechText
    const rate = state.speechRate
    const pitch = state.speechPitch

    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = rate
    utter.pitch = pitch
    utteranceRef.current = utter

    durationRef.current = estimateDuration(text, rate)
    lipFramesRef.current = buildLipCurve(text, durationRef.current, rate)

    utter.onstart = () => {
      startTimeRef.current = performance.now()
      setIsSpeaking(true)
      rafRef.current = requestAnimationFrame(animateLip)
    }

    utter.onend = () => {
      setIsSpeaking(false)
      setSpeechProgress(0)
      setExpression({ jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0 })
      cancelAnimationFrame(rafRef.current)
    }

    utter.onerror = () => {
      setIsSpeaking(false)
      setSpeechProgress(0)
      setExpression({ jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0 })
      cancelAnimationFrame(rafRef.current)
    }

    window.speechSynthesis.speak(utter)
  }, [animateLip, setIsSpeaking, setExpression, setSpeechProgress])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    cancelAnimationFrame(rafRef.current)
    setIsSpeaking(false)
    setSpeechProgress(0)
    setExpression({ jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0 })
  }, [setIsSpeaking, setExpression, setSpeechProgress])

  useEffect(() => () => { stop(); cancelAnimationFrame(rafRef.current) }, [stop])

  return { speak, stop }
}
