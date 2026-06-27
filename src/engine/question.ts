import type { FaceKey, FaceValue, Question, QuizCard } from '../types'
import { randomChoice, shuffle, type Rng } from './random'

export type FacePair = readonly [FaceKey, FaceKey]

export interface GenOpts {
  faceValue: FaceValue
  /** 允许的表示集合（读音是否参与由外部按设置/TTS 支持情况决定）。 */
  allowedFaces: FaceKey[]
  optionCount: number
  smart?: boolean
  rng?: Rng
  /** 禁止出现的「题面/目标」配对（任一方向）。如 [['romaji','audio']]：罗马音与读音互为同义，太直白。 */
  excludePairs?: readonly FacePair[]
  /** 调试/特定场景下固定题面/目标。 */
  forcePromptFace?: FaceKey
  forceTargetFace?: FaceKey
}

function pairExcluded(a: FaceKey, b: FaceKey, pairs: readonly FacePair[]): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

/**
 * 为某「目标表示」抽选项 id（含正确卡，已打乱）。
 * 去歧义：候选的目标值 ≠ 正确值（选项不重复），且候选的题面值 ≠ 当前题面值
 * （排除「也能正确回答本题」的同音卡——读音/罗马音方向的 ず/づ、じ/ぢ 都靠这条）。
 */
export function pickOptionIds(
  card: QuizCard,
  targetFace: FaceKey,
  promptFace: FaceKey,
  pool: readonly QuizCard[],
  count: number,
  faceValue: FaceValue,
  smart: boolean,
  rng: Rng,
): string[] {
  const correctVal = faceValue(card, targetFace)
  const promptVal = faceValue(card, promptFace)

  const candidates = pool.filter(
    (c) =>
      c.id !== card.id &&
      faceValue(c, targetFace) !== correctVal &&
      faceValue(c, promptFace) !== promptVal,
  )

  const needed = Math.max(0, count - 1)
  const chosen: string[] = []
  const usedVals = new Set<string>([correctVal])

  const take = (list: QuizCard[]) => {
    for (const c of shuffle(list, rng)) {
      if (chosen.length >= needed) break
      const v = faceValue(c, targetFace)
      if (usedVals.has(v)) continue
      usedVals.add(v)
      chosen.push(c.id)
    }
  }

  if (smart) {
    take(candidates.filter((c) => c.group != null && c.group === card.group))
    take(candidates.filter((c) => c.category === card.category))
    take(candidates)
  } else {
    take(candidates)
  }

  return shuffle([card.id, ...chosen], rng)
}

/** 生成一道题：随机题面 + 随机目标(另一种，排除禁止配对) + 一组选项。 */
export function generateQuestion(
  card: QuizCard,
  pool: readonly QuizCard[],
  opts: GenOpts,
): Question {
  const rng = opts.rng ?? Math.random
  const faces = opts.allowedFaces
  const excludePairs = opts.excludePairs ?? []

  const promptFace =
    opts.forcePromptFace && faces.includes(opts.forcePromptFace)
      ? opts.forcePromptFace
      : randomChoice(faces, rng)

  // 目标候选：不等于题面，且与题面不构成禁止配对。
  let targets = faces.filter((f) => f !== promptFace && !pairExcluded(promptFace, f, excludePairs))
  // 兜底：万一全被排除，退回到「只去掉题面」。
  if (targets.length === 0) targets = faces.filter((f) => f !== promptFace)

  const targetFace =
    opts.forceTargetFace && targets.includes(opts.forceTargetFace)
      ? opts.forceTargetFace
      : randomChoice(targets, rng)

  const optionIds = pickOptionIds(
    card,
    targetFace,
    promptFace,
    pool,
    opts.optionCount,
    opts.faceValue,
    opts.smart ?? false,
    rng,
  )
  return { card, promptFace, targetFace, optionIds }
}

/** 判断所选卡是否答对（按目标表示的值比较，天然兼容同音）。 */
export function answerMatches(
  question: Question,
  selectedCard: QuizCard,
  faceValue: FaceValue,
): boolean {
  return (
    faceValue(selectedCard, question.targetFace) ===
    faceValue(question.card, question.targetFace)
  )
}
