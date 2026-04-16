import { useRef, useCallback, useEffect } from 'react'
import { useAvatarStore } from '../state/avatarStore'
import { damp, clamp } from '../utils/spring'

export function useAudioReactiveMouth() {
  const setExpression = useAvatarStore(s => s.setExpression)
  const setAudioLevel = useAvatarStore(s => s.setAudioLevel)
  const audioReactiveMode = useAvatarStore(s => s.audioReactiveMode)

  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(128) as Uint8Array<ArrayBuffer>)
  const rafRef = useRef(0)
  const smoothRef = useRef(0)
  const activeRef = useRef(false)

  const tick = useCallback(() => {
    if (!analyserRef.current) return
    analyserRef.current.getByteTimeDomainData(dataRef.current)
    let rms = 0
    for (let i = 0; i < dataRef.current.length; i++) {
      const v = (dataRef.current[i] - 128) / 128
      rms += v * v
    }
    rms = Math.sqrt(rms / dataRef.current.length)
    smoothRef.current = damp(smoothRef.current, clamp(rms * 6, 0, 1), 20, 1 / 60)
    setAudioLevel(smoothRef.current)
    setExpression({ jawOpen: smoothRef.current * 0.8 })
    if (activeRef.current) rafRef.current = requestAnimationFrame(tick)
  }, [setExpression, setAudioLevel])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      ctxRef.current = ctx
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
      activeRef.current = true
      rafRef.current = requestAnimationFrame(tick)
    } catch (e) {
      console.warn('Microphone access denied', e)
    }
  }, [tick])

  const stop = useCallback(() => {
    activeRef.current = false
    cancelAnimationFrame(rafRef.current)
    ctxRef.current?.close()
    ctxRef.current = null
    analyserRef.current = null
    setAudioLevel(0)
  }, [setAudioLevel])

  useEffect(() => {
    if (audioReactiveMode) { start() }
    else { stop() }
    return stop
  }, [audioReactiveMode, start, stop])

  return { start, stop }
}
