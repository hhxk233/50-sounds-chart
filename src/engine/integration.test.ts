import { describe, it, expect } from 'vitest'
import { kanaDeck } from '../data/decks'
import { Bag } from './bag'
import { seededRng } from './random'
import { generateQuestion, isQuestionCorrect, type OptionOpts } from './question'
import type { Selections } from '../types'

const cards = kanaDeck.cards
const modes = ['hiragana', 'katakana', 'romaji', 'random'] as const

/** 全量扫一遍：每张卡 × 每种模式 × 每种选项数，确保出题永远合法、判题自洽。 */
describe('整库 × 全模式 出题不崩、判题自洽', () => {
  it('每道题都结构合法且正确答案能判对', () => {
    let checked = 0
    for (const card of cards) {
      for (const mode of modes) {
        for (const count of [4, 5, 6]) {
          const opts: OptionOpts = { rng: seededRng(checked + 1), smart: checked % 2 === 0 }
          const q = generateQuestion(card, kanaDeck, mode, count, cards, opts)

          // 题面合法
          expect(['hiragana', 'katakana', 'romaji']).toContain(q.promptFace)
          // 另两种各一组
          expect(q.groups.length).toBe(2)
          expect(q.groups.map((g) => g.face).sort()).toEqual(
            ['hiragana', 'katakana', 'romaji'].filter((f) => f !== q.promptFace),
          )

          const sel: Selections = {}
          for (const g of q.groups) {
            expect(g.options).toContain(g.correct) // 含正确答案
            expect(new Set(g.options).size).toBe(g.options.length) // 无重复
            expect(g.options.length).toBe(count) // 满库一定能凑满
            // 选项里不存在「也能正确回答题面」的同音卡：题面值唯一对应
            sel[g.face] = g.correct
          }
          expect(isQuestionCorrect(q, sel)).toBe(true)
          checked++
        }
      }
    }
    expect(checked).toBe(cards.length * modes.length * 3)
  })
})

describe('长跑一个会话不崩', () => {
  it('连抽 1000 题，round 正常递增，覆盖完整', () => {
    const bag = new Bag(cards.slice(), { rng: seededRng(123) })
    for (let i = 0; i < 1000; i++) {
      const card = bag.draw()
      const q = generateQuestion(card, kanaDeck, 'random', 5, cards, { rng: seededRng(i) })
      expect(q.groups.length).toBe(2)
    }
    // 1000 / 118 ≈ 8.4 轮
    expect(bag.round).toBeGreaterThanOrEqual(8)
  })
})
