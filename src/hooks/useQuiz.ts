import { useMemo, useRef, useState } from 'react'
import { cardById, kanaCards, makeFaceValue } from '../data/decks'
import { Bag } from '../engine/bag'
import { answerMatches, generateQuestion, type FacePair } from '../engine/question'
import type { AnswerResult, FaceKey, FaceValue, Question } from '../types'
import { useSettings } from '../store/settings'
import { useProgress } from '../store/progress'

export interface ActiveSet {
  id: string
  label: string
  cardIds: string[]
}
export type Phase = 'answering' | 'revealed'
export type Status = 'idle' | 'running' | 'done'

export interface SessionState {
  set: ActiveSet
  length: number
  index: number // 当前第几题（0-based）
  results: AnswerResult[]
}

// 读音用打包音频，始终可用（不再依赖系统是否有日语语音）。
const audioAvailable = true

// 罗马音与读音互为同义，配在一起太直白——禁止这对（两个方向）。
const EXCLUDE_PAIRS: readonly FacePair[] = [['romaji', 'audio']]

/** 会话化答题：选集合+题量 → 出 n 题(随机题面/目标) → 成绩总结。 */
export function useQuiz() {
  const optionCount = useSettings((s) => s.optionCount)
  const romajiStyle = useSettings((s) => s.romajiStyle)
  const includeAudio = useSettings((s) => s.includeAudio)
  const smart = useSettings((s) => s.smartDistractors)
  const weightMistakes = useSettings((s) => s.weightMistakes)
  const record = useProgress((s) => s.record)

  const faceValue: FaceValue = useMemo(() => makeFaceValue(romajiStyle), [romajiStyle])
  const allowedFaces: FaceKey[] = useMemo(
    () => [
      'hiragana',
      'katakana',
      'romaji',
      ...(includeAudio && audioAvailable ? (['audio'] as const) : []),
    ],
    [includeAudio],
  )

  const bagRef = useRef<Bag | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [session, setSession] = useState<SessionState | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('answering')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)

  const buildQuestion = (cardId: string): Question | null => {
    const card = cardById.get(cardId)
    if (!card) return null
    return generateQuestion(card, kanaCards, {
      faceValue,
      allowedFaces,
      optionCount,
      smart,
      excludePairs: EXCLUDE_PAIRS,
    })
  }

  const weightOf = (cardId: string) =>
    weightMistakes ? Math.min(4, useProgress.getState().mistakes[cardId]?.wrong ?? 0) : 0

  function startSession(set: ActiveSet, length: number) {
    const pool = set.cardIds.map((id) => cardById.get(id)!).filter(Boolean)
    if (pool.length === 0) return
    const bag = new Bag(pool, { weightOf: (c) => weightOf(c.id) })
    bagRef.current = bag
    const first = buildQuestion(bag.draw().id)
    setSession({ set, length, index: 0, results: [] })
    setStatus('running')
    setQuestion(first)
    setSelectedId(null)
    setPhase('answering')
    setLastCorrect(null)
  }

  // 复习 = 答错过 ∪ 已收藏
  function startMistakes(length: number) {
    const st = useProgress.getState()
    const ids = new Set<string>([
      ...Object.keys(st.mistakes).filter((id) => st.mistakes[id].wrong > 0 && cardById.has(id)),
      ...Object.keys(st.favorites).filter((id) => cardById.has(id)),
    ])
    const arr = [...ids]
    if (arr.length === 0) return
    startSession({ id: 'review', label: '复习', cardIds: arr }, Math.min(length, arr.length))
  }

  function select(id: string) {
    if (phase === 'answering') setSelectedId(id)
  }

  function recordResult(correct: boolean) {
    if (!question) return
    setPhase('revealed')
    setLastCorrect(correct)
    record(question.card.id, correct)
    setSession((s) =>
      s ? { ...s, results: [...s.results, { cardId: question.card.id, correct }] } : s,
    )
  }

  function confirm() {
    if (!question || phase !== 'answering' || !selectedId) return
    const sel = cardById.get(selectedId)
    if (!sel) return
    recordResult(answerMatches(question, sel, faceValue))
  }

  // 提示：直接揭晓答案，本题判错。
  function hint() {
    if (!question || phase !== 'answering') return
    setSelectedId(null)
    recordResult(false)
  }

  function next() {
    const bag = bagRef.current
    if (!bag || !session) return
    const nextIndex = session.index + 1
    if (nextIndex >= session.length) {
      setStatus('done')
      setQuestion(null)
      return
    }
    setSession((s) => (s ? { ...s, index: nextIndex } : s))
    setQuestion(buildQuestion(bag.draw().id))
    setSelectedId(null)
    setPhase('answering')
    setLastCorrect(null)
  }

  function retry() {
    if (session) startSession(session.set, session.length)
  }

  function exit() {
    bagRef.current = null
    setSession(null)
    setQuestion(null)
    setStatus('idle')
  }

  const correctCount = session ? session.results.filter((r) => r.correct).length : 0
  const answered = session ? session.results.length : 0

  return {
    status,
    session,
    question,
    selectedId,
    phase,
    lastCorrect,
    faceValue,
    current: session ? session.index + 1 : 0,
    total: session ? session.length : 0,
    correctCount,
    answered,
    startSession,
    startMistakes,
    select,
    confirm,
    hint,
    next,
    retry,
    exit,
  }
}
