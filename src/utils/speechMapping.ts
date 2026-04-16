export function estimateSyllables(text: string): number {
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, ' ')
  const words = cleaned.split(/\s+/).filter(Boolean)
  let count = 0
  for (const w of words) {
    let syl = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '')
               .replace(/^[^aeiouy]+/, '')
               .match(/[aeiouy]{1,2}/g)?.length || 1
    count += syl
  }
  return Math.max(1, count)
}

export function estimateDuration(text: string, rate: number): number {
  const syllables = estimateSyllables(text)
  return (syllables / (rate * 3.5)) * 1000
}

export interface LipFrame {
  t: number
  jawOpen: number
  mouthWidth: number
  lipRound: number
  lipPress: number
}

export function buildLipCurve(text: string, durationMs: number, rate: number): LipFrame[] {
  const words = text.split(/\s+/).filter(Boolean)
  const frames: LipFrame[] = [{ t: 0, jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0 }]
  const totalSyl = estimateSyllables(text)
  let elapsed = 0

  for (const word of words) {
    const wordSyl = Math.max(1, estimateSyllables(word))
    const wordDur = (wordSyl / totalSyl) * durationMs

    const openT = elapsed / durationMs
    const closeT = (elapsed + wordDur * 0.85) / durationMs
    const isRound = /[ouy]/.test(word.toLowerCase())
    const isWide = /[ae]/.test(word.toLowerCase())
    const hasEnding = /[,.!?;:]$/.test(word)

    frames.push({
      t: openT,
      jawOpen: 0.55 + (Math.random() * 0.25) / rate,
      mouthWidth: isWide ? 0.4 : 0.1,
      lipRound: isRound ? 0.5 : 0,
      lipPress: 0,
    })
    frames.push({
      t: closeT,
      jawOpen: hasEnding ? 0 : 0.12,
      mouthWidth: 0,
      lipRound: 0,
      lipPress: hasEnding ? 0.3 : 0,
    })

    elapsed += wordDur
  }

  frames.push({ t: 1, jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0 })
  return frames
}

export function sampleLipCurve(frames: LipFrame[], t: number): Omit<LipFrame, 't'> {
  if (frames.length === 0) return { jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0 }
  const clamped = Math.max(0, Math.min(1, t))
  let i = 0
  while (i < frames.length - 1 && frames[i + 1].t <= clamped) i++
  if (i >= frames.length - 1) return { jawOpen: 0, mouthWidth: 0, lipRound: 0, lipPress: 0 }
  const a = frames[i], b = frames[i + 1]
  const span = b.t - a.t
  const local = span < 0.0001 ? 0 : (clamped - a.t) / span
  const s = local * local * (3 - 2 * local)
  return {
    jawOpen: a.jawOpen + (b.jawOpen - a.jawOpen) * s,
    mouthWidth: a.mouthWidth + (b.mouthWidth - a.mouthWidth) * s,
    lipRound: a.lipRound + (b.lipRound - a.lipRound) * s,
    lipPress: a.lipPress + (b.lipPress - a.lipPress) * s,
  }
}
