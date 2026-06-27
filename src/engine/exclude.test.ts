import { describe, it, expect } from 'vitest'
import { cardById, kanaCards, makeFaceValue } from '../data/decks'
import type { FaceKey } from '../types'
import { generateQuestion, type FacePair } from './question'
import { seededRng } from './random'

const fv = makeFaceValue('hepburn')
const byId = (id: string) => cardById.get(id)!
const ALL: FaceKey[] = ['hiragana', 'katakana', 'romaji', 'audio']
const EXCLUDE: readonly FacePair[] = [['romaji', 'audio']]

describe('题型排除：罗马音 ↔ 读音 不出现', () => {
  it('大量随机出题里从不出现 romaji↔audio 配对', () => {
    const card = byId('seion:か')
    for (let s = 0; s < 1500; s++) {
      const q = generateQuestion(card, kanaCards, {
        faceValue: fv,
        allowedFaces: ALL,
        optionCount: 5,
        rng: seededRng(s),
        excludePairs: EXCLUDE,
      })
      const pair = new Set([q.promptFace, q.targetFace])
      expect(pair.has('romaji') && pair.has('audio')).toBe(false)
      expect(q.promptFace).not.toBe(q.targetFace)
    }
  })

  it('读音题与罗马音题仍然各自存在（只是不互相配）', () => {
    const card = byId('seion:か')
    const combos = new Set<string>()
    for (let s = 0; s < 600; s++) {
      const q = generateQuestion(card, kanaCards, {
        faceValue: fv,
        allowedFaces: ALL,
        optionCount: 5,
        rng: seededRng(s),
        excludePairs: EXCLUDE,
      })
      combos.add(`${q.promptFace}->${q.targetFace}`)
    }
    expect([...combos].some((c) => c.includes('audio'))).toBe(true)
    expect([...combos].some((c) => c.includes('romaji'))).toBe(true)
    // 确认确实没有这两条
    expect(combos.has('romaji->audio')).toBe(false)
    expect(combos.has('audio->romaji')).toBe(false)
  })
})
