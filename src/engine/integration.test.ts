import { describe, it, expect } from 'vitest'
import { cardById, kanaCards, makeFaceValue } from '../data/decks'
import type { FaceKey } from '../types'
import { Bag } from './bag'
import { seededRng } from './random'
import { answerMatches, generateQuestion, pickOptionIds } from './question'

const cards = kanaCards
const byId = (id: string) => cardById.get(id)!
const FACES: FaceKey[] = ['hiragana', 'katakana', 'romaji', 'audio']

describe('整库 × 全 题面/目标组合 × 全样式 出题自洽', () => {
  it('每种组合都合法、唯一、正确卡可判对', () => {
    let checked = 0
    for (const style of ['hepburn', 'kunrei'] as const) {
      const fv = makeFaceValue(style)
      for (const card of cards) {
        for (const prompt of FACES) {
          for (const target of FACES) {
            if (prompt === target) continue
            for (const count of [4, 6]) {
              const ids = pickOptionIds(
                card,
                target,
                prompt,
                cards,
                count,
                fv,
                checked % 2 === 0,
                seededRng(checked + 1),
              )
              expect(ids).toContain(card.id) // 含正确
              expect(ids.length).toBe(count) // 满库凑得满
              const vals = ids.map((id) => fv(byId(id), target))
              expect(new Set(vals).size).toBe(count) // 目标值互不相同
              // 正确卡判对，且不存在第二个"也对"的选项
              const correctCount = ids.filter((id) => answerMatches(
                { card, promptFace: prompt, targetFace: target, optionIds: ids },
                byId(id),
                fv,
              )).length
              expect(correctCount).toBe(1)
              checked++
            }
          }
        }
      }
    }
    // 118 卡 × 12 组合 × 2 count × 2 样式
    expect(checked).toBe(cards.length * 12 * 2 * 2)
  })
})

describe('长跑一个会话不崩', () => {
  it('连抽 800 题随机题面/目标都合法', () => {
    const fv = makeFaceValue('hepburn')
    const bag = new Bag(cards.slice(), { rng: seededRng(123) })
    for (let i = 0; i < 800; i++) {
      const q = generateQuestion(bag.draw(), cards, {
        faceValue: fv,
        allowedFaces: FACES,
        optionCount: 5,
        rng: seededRng(i),
      })
      expect(q.optionIds.length).toBe(5)
      expect(q.promptFace).not.toBe(q.targetFace)
    }
    expect(bag.round).toBeGreaterThanOrEqual(6)
  })
})
