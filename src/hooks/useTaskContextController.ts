import { useEffect } from 'react'
import { useAvatarStore } from '../state/avatarStore'
import { taskProfiles } from '../utils/taskProfiles'

export function useTaskContextController() {
  const task = useAvatarStore(s => s.task)
  const autoEmotionFromTask = useAvatarStore(s => s.autoEmotionFromTask)
  const setEmotion = useAvatarStore(s => s.setEmotion)

  useEffect(() => {
    if (!autoEmotionFromTask) return
    const profile = taskProfiles[task]
    setEmotion(profile.suggestedEmotion)
  }, [task, autoEmotionFromTask, setEmotion])
}
