import { useEffect, useMemo, useRef, useState } from 'react'
import { getDeck } from '../data/decks'
import { Bag } from '../engine/bag'
import {
  allSelected,
  emptySelections,
  generateQuestion,
  isQuestionCorrect,
} from '../engine/question'
import type { FaceKey, Question, Selections } from '../types'
import { useSettings } from '../store/settings'
import { useProgress } from '../store/progress'

export type QuizSource = 'all' | 'mistakes'
export type Phase = 'answering' | 'revealed'

export interface SessionStats {
  answered: number
  correct: number
  streak: number
  bestStreak: number
}

const initStats = (): SessionStats => ({ answered: 0, correct: 0, streak: 0, bestStreak: 0 })

/** 编排引擎与 store 的题目状态机：出题 → 选择 → 确定 → 反馈 → 下一题。 */
export function useQuiz() {
  const deckId = useSettings((s) => s.deckId)
  const enabled = useSettings((s) => s.enabledCategories)
  const optionCount = useSettings((s) => s.optionCount)
  const mode = useSettings((s) => s.mode)
  const smart = useSettings((s) => s.smartDistractors)
  const weightMistakes = useSettings((s) => s.weightMistakes)
  const record = useProgress((s) => s.record)

  const deck = useMemo(() => getDeck(deckId), [deckId])
  const [source, setSource] = useState<QuizSource>('all')

  // 当前牌池：normal=启用类；mistakes=进入时对错题做一次快照（session 内不变）。
  const activeCards = useMemo(() => {
    if (source === 'mistakes') {
      const m = useProgress.getState().mistakes
      const ids = new Set(Object.keys(m).filter((id) => m[id].wrong > 0))
      return deck.cards.filter((c) => ids.has(c.id))
    }
    return deck.cards.filter((c) => enabled.includes(c.category))
  }, [deck, enabled, source])

  const bagRef = useRef<Bag | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selections, setSelections] = useState<Selections>({})
  const [phase, setPhase] = useState<Phase>('answering')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [stats, setStats] = useState<SessionStats>(initStats)
  const [, force] = useState(0)

  // 出题相关设置用 ref 读取最新值，避免把它们当作牌池重建的依赖。
  const optRef = useRef({ optionCount, mode, smart })
  optRef.current = { optionCount, mode, smart }

  const buildQuestion = (card: Question['card']): Question => {
    const { optionCount: oc, mode: md, smart: sm } = optRef.current
    return generateQuestion(card, deck, md, oc, activeCards, { smart: sm })
  }

  const applyQuestion = (q: Question) => {
    setQuestion(q)
    setSelections(emptySelections(q))
    setPhase('answering')
    setLastCorrect(null)
    force((x) => x + 1)
  }

  // 牌池变化 → 重建袋子并出第一题，重置 session 统计。
  useEffect(() => {
    if (activeCards.length === 0) {
      bagRef.current = null
      setQuestion(null)
      return
    }
    const bag = new Bag(activeCards.slice(), {
      weightOf: (c) =>
        weightMistakes ? Math.min(4, useProgress.getState().mistakes[c.id]?.wrong ?? 0) : 0,
    })
    bagRef.current = bag
    setStats(initStats())
    applyQuestion(buildQuestion(bag.draw()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCards, deck, weightMistakes])

  function select(face: FaceKey, value: string) {
    if (phase !== 'answering') return
    setSelections((s) => ({ ...s, [face]: value }))
  }

  function confirm() {
    if (!question || phase !== 'answering' || !allSelected(question, selections)) return
    const correct = isQuestionCorrect(question, selections)
    setPhase('revealed')
    setLastCorrect(correct)
    record(question.card.id, correct)
    setStats((s) => {
      const streak = correct ? s.streak + 1 : 0
      return {
        answered: s.answered + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
      }
    })
  }

  function next() {
    const bag = bagRef.current
    if (!bag) return
    applyQuestion(buildQuestion(bag.draw()))
  }

  function start(src: QuizSource) {
    setSource(src) // 触发牌池 memo → 重建
  }

  function restart() {
    // 重新洗一遍当前牌池
    if (activeCards.length === 0) return
    const bag = new Bag(activeCards.slice(), {
      weightOf: (c) =>
        weightMistakes ? Math.min(4, useProgress.getState().mistakes[c.id]?.wrong ?? 0) : 0,
    })
    bagRef.current = bag
    setStats(initStats())
    applyQuestion(buildQuestion(bag.draw()))
  }

  const bag = bagRef.current
  const progress = bag
    ? { seen: bag.seenCount, total: bag.total, round: bag.round }
    : { seen: 0, total: 0, round: 0 }

  const canConfirm = Boolean(question && allSelected(question, selections))

  return {
    deck,
    source,
    question,
    selections,
    phase,
    lastCorrect,
    stats,
    progress,
    canConfirm,
    activeCount: activeCards.length,
    select,
    confirm,
    next,
    start,
    restart,
  }
}
