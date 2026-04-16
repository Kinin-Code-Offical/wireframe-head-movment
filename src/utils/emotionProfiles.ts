import type { EmotionType, ExpressionState } from '../state/avatarStore'

export interface EmotionProfile {
  base: Partial<ExpressionState>
  motionScale: number
  blinkRate: number
  headMotionAmp: number
  breathingAmp: number
  springStiffness: number
  springDamping: number
}

export const emotionProfiles: Record<EmotionType, EmotionProfile> = {
  neutral: {
    base: { mouthCornerPull: 0, browRaise: 0, cheekRaise: 0, eyeOpenness: 1, jawOpen: 0, headPitch: 0 },
    motionScale: 1, blinkRate: 1, headMotionAmp: 1, breathingAmp: 1,
    springStiffness: 160, springDamping: 22,
  },
  happy: {
    base: { mouthCornerPull: 0.55, browRaise: 0.15, cheekRaise: 0.5, eyeOpenness: 0.9, jawOpen: 0.05, headPitch: -0.04 },
    motionScale: 1.2, blinkRate: 1.1, headMotionAmp: 1.2, breathingAmp: 1.1,
    springStiffness: 200, springDamping: 20,
  },
  sad: {
    base: { mouthCornerPull: -0.4, browRaise: 0.3, browLeft: 0.2, browRight: -0.2, cheekRaise: 0, eyeOpenness: 0.75, headPitch: 0.1 },
    motionScale: 0.65, blinkRate: 0.8, headMotionAmp: 0.6, breathingAmp: 0.85,
    springStiffness: 100, springDamping: 28,
  },
  angry: {
    base: { mouthCornerPull: -0.2, browRaise: -0.35, browLeft: -0.3, browRight: -0.3, lipPress: 0.4, eyeOpenness: 1.05, headPitch: -0.05 },
    motionScale: 1.1, blinkRate: 0.7, headMotionAmp: 0.9, breathingAmp: 1.15,
    springStiffness: 280, springDamping: 18,
  },
  surprised: {
    base: { mouthCornerPull: 0, browRaise: 0.65, eyeOpenness: 1.35, jawOpen: 0.25, cheekRaise: 0.15, headPitch: -0.08 },
    motionScale: 1.3, blinkRate: 0.5, headMotionAmp: 1.1, breathingAmp: 1.2,
    springStiffness: 380, springDamping: 16,
  },
  thinking: {
    base: { mouthCornerPull: -0.05, browLeft: 0.25, browRight: -0.1, eyeOpenness: 0.85, headPitch: 0.05, headRoll: 0.04 },
    motionScale: 0.85, blinkRate: 0.9, headMotionAmp: 0.8, breathingAmp: 0.9,
    springStiffness: 140, springDamping: 26,
  },
  focused: {
    base: { mouthCornerPull: 0, lipPress: 0.2, browRaise: -0.1, eyeOpenness: 1.05, headPitch: -0.03 },
    motionScale: 0.75, blinkRate: 0.55, headMotionAmp: 0.6, breathingAmp: 0.8,
    springStiffness: 220, springDamping: 30,
  },
  calm: {
    base: { mouthCornerPull: 0.1, browRaise: 0.05, eyeOpenness: 0.85, headPitch: 0.02 },
    motionScale: 0.7, blinkRate: 0.85, headMotionAmp: 0.65, breathingAmp: 0.9,
    springStiffness: 110, springDamping: 30,
  },
}
