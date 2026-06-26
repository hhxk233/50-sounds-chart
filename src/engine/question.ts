import type {
  DeckSource,
  FaceKey,
  OptionGroup,
  Question,
  QuizCard,
  QuizMode,
  Selections,
} from '../types'
import { randomChoice, shuffle, type Rng } from './random'

export interface OptionOpts {
  /** 智能干扰：同「行」/同大类优先，练得更有针对性。 */
  smart?: boolean
  rng?: Rng
}

/**
 * 为某「目标表示」生成一组选项（含正确答案，已打乱）。
 *
 * 同音去歧义（核心）：
 *  - 候选目标值 ≠ 正确值：选项天然不重复（也排除了显示相同的 ず/づ）。
 *  - 候选「题面值」≠ 当前题面值：排除「也能正确回答本题」的同音卡。
 *    例题面是罗马音 zu 时，ず 与 づ 都对 —— 这条保证另一个不进选项池，避免两个正确答案。
 */
export function pickOptions(
  card: QuizCard,
  targetFace: FaceKey,
  promptFace: FaceKey,
  pool: readonly QuizCard[],
  count: number,
  opts: OptionOpts = {},
): OptionGroup {
  const rng = opts.rng ?? Math.random
  const correct = card.faces[targetFace]
  const promptVal = card.faces[promptFace]

  const candidates = pool.filter(
    (c) =>
      c.id !== card.id &&
      c.faces[targetFace] != null &&
      c.faces[targetFace] !== correct &&
      c.faces[promptFace] !== promptVal,
  )

  const needed = Math.max(0, count - 1)
  const chosen: string[] = []
  const used = new Set<string>([correct])

  const takeFrom = (list: QuizCard[]) => {
    for (const c of shuffle(list, rng)) {
      if (chosen.length >= needed) break
      const v = c.faces[targetFace]
      if (used.has(v)) continue
      used.add(v)
      chosen.push(v)
    }
  }

  if (opts.smart) {
    takeFrom(candidates.filter((c) => c.group != null && c.group === card.group))
    takeFrom(candidates.filter((c) => c.category === card.category))
    takeFrom(candidates)
  } else {
    takeFrom(candidates)
  }

  return { face: targetFace, correct, options: shuffle([correct, ...chosen], rng) }
}

/** 生成一道题：定题面，其余每种表示各一组选项。pool 应为当前启用范围内的卡。 */
export function generateQuestion(
  card: QuizCard,
  deck: DeckSource,
  mode: QuizMode,
  optionCount: number,
  pool: readonly QuizCard[],
  opts: OptionOpts = {},
): Question {
  const rng = opts.rng ?? Math.random
  const faceKeys = deck.faces.map((f) => f.key)
  const wanted = mode === 'random' ? randomChoice(faceKeys, rng) : mode
  const promptFace = faceKeys.includes(wanted) ? wanted : faceKeys[0]
  const groups = faceKeys
    .filter((k) => k !== promptFace)
    .map((target) => pickOptions(card, target, promptFace, pool, optionCount, { ...opts, rng }))
  return { card, promptFace, groups }
}

export function isQuestionCorrect(question: Question, selections: Selections): boolean {
  return question.groups.every((g) => selections[g.face] === g.correct)
}

export function emptySelections(question: Question): Selections {
  const s: Selections = {}
  for (const g of question.groups) s[g.face] = null
  return s
}

export function allSelected(question: Question, selections: Selections): boolean {
  return question.groups.every((g) => selections[g.face] != null)
}
