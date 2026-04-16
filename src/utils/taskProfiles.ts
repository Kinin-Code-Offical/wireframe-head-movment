import type { TaskType, EmotionType } from '../state/avatarStore'

export interface TaskProfile {
  suggestedEmotion: EmotionType
  headMotionBias: { pitch: number; yaw: number; roll: number }
  nodAmplitude: number
  nodFrequency: number
  gazeDriftScale: number
  mouthArticulation: number
}

export const taskProfiles: Record<TaskType, TaskProfile> = {
  greeting: {
    suggestedEmotion: 'happy',
    headMotionBias: { pitch: -0.05, yaw: 0, roll: 0 },
    nodAmplitude: 0.06, nodFrequency: 0.4, gazeDriftScale: 1.1, mouthArticulation: 1.1,
  },
  explaining: {
    suggestedEmotion: 'focused',
    headMotionBias: { pitch: 0, yaw: 0, roll: 0 },
    nodAmplitude: 0.04, nodFrequency: 0.6, gazeDriftScale: 0.9, mouthArticulation: 1.25,
  },
  warning: {
    suggestedEmotion: 'angry',
    headMotionBias: { pitch: 0.03, yaw: 0, roll: 0 },
    nodAmplitude: 0.02, nodFrequency: 0.3, gazeDriftScale: 0.7, mouthArticulation: 0.9,
  },
  success: {
    suggestedEmotion: 'happy',
    headMotionBias: { pitch: -0.04, yaw: 0, roll: 0.02 },
    nodAmplitude: 0.05, nodFrequency: 0.5, gazeDriftScale: 1.0, mouthArticulation: 1.1,
  },
  error: {
    suggestedEmotion: 'sad',
    headMotionBias: { pitch: 0.06, yaw: 0, roll: 0 },
    nodAmplitude: 0.015, nodFrequency: 0.2, gazeDriftScale: 0.8, mouthArticulation: 0.85,
  },
  thinking: {
    suggestedEmotion: 'thinking',
    headMotionBias: { pitch: 0.04, yaw: 0.06, roll: 0.05 },
    nodAmplitude: 0.025, nodFrequency: 0.25, gazeDriftScale: 1.4, mouthArticulation: 0.7,
  },
  listening: {
    suggestedEmotion: 'focused',
    headMotionBias: { pitch: -0.02, yaw: 0, roll: 0 },
    nodAmplitude: 0.02, nodFrequency: 0.35, gazeDriftScale: 0.85, mouthArticulation: 0.3,
  },
  idle: {
    suggestedEmotion: 'neutral',
    headMotionBias: { pitch: 0, yaw: 0, roll: 0 },
    nodAmplitude: 0.01, nodFrequency: 0.15, gazeDriftScale: 1.0, mouthArticulation: 1.0,
  },
}
