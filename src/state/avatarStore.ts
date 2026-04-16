import { create } from 'zustand'

export type EmotionType =
  | 'neutral' | 'happy' | 'sad' | 'angry'
  | 'surprised' | 'thinking' | 'focused' | 'calm'

export type TaskType =
  | 'greeting' | 'explaining' | 'warning' | 'success'
  | 'error' | 'thinking' | 'listening' | 'idle'

export interface ExpressionState {
  jawOpen: number
  mouthWidth: number
  lipRound: number
  lipPress: number
  mouthCornerPull: number
  browLeft: number
  browRight: number
  browRaise: number
  eyeOpenness: number
  cheekRaise: number
  headPitch: number
  headYaw: number
  headRoll: number
  neckSway: number
}

export const neutralExpression: ExpressionState = {
  jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0,
  mouthCornerPull: 0, browLeft: 0, browRight: 0, browRaise: 0,
  eyeOpenness: 1, cheekRaise: 0,
  headPitch: 0, headYaw: 0, headRoll: 0, neckSway: 0,
}

export interface AvatarState {
  emotion: EmotionType
  task: TaskType
  speechText: string
  speechRate: number
  speechPitch: number
  intensity: number
  autoEmotionFromTask: boolean
  showDebug: boolean
  audioReactiveMode: boolean
  isSpeaking: boolean
  speechProgress: number
  expression: ExpressionState
  audioLevel: number
  setEmotion: (e: EmotionType) => void
  setTask: (t: TaskType) => void
  setSpeechText: (t: string) => void
  setSpeechRate: (r: number) => void
  setSpeechPitch: (p: number) => void
  setIntensity: (i: number) => void
  setAutoEmotionFromTask: (v: boolean) => void
  setShowDebug: (v: boolean) => void
  setAudioReactiveMode: (v: boolean) => void
  setIsSpeaking: (v: boolean) => void
  setSpeechProgress: (v: number) => void
  setExpression: (e: Partial<ExpressionState>) => void
  setAudioLevel: (v: number) => void
}

export const useAvatarStore = create<AvatarState>((set) => ({
  emotion: 'neutral',
  task: 'idle',
  speechText: 'Hello, I am your AI assistant. How can I help you today?',
  speechRate: 1.0,
  speechPitch: 1.0,
  intensity: 0.7,
  autoEmotionFromTask: false,
  showDebug: false,
  audioReactiveMode: false,
  isSpeaking: false,
  speechProgress: 0,
  expression: { ...neutralExpression },
  audioLevel: 0,

  setEmotion: (emotion) => set({ emotion }),
  setTask: (task) => set({ task }),
  setSpeechText: (speechText) => set({ speechText }),
  setSpeechRate: (speechRate) => set({ speechRate }),
  setSpeechPitch: (speechPitch) => set({ speechPitch }),
  setIntensity: (intensity) => set({ intensity }),
  setAutoEmotionFromTask: (autoEmotionFromTask) => set({ autoEmotionFromTask }),
  setShowDebug: (showDebug) => set({ showDebug }),
  setAudioReactiveMode: (audioReactiveMode) => set({ audioReactiveMode }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setSpeechProgress: (speechProgress) => set({ speechProgress }),
  setExpression: (e) => set(s => ({ expression: { ...s.expression, ...e } })),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
}))
