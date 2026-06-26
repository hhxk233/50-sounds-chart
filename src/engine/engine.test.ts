import { describe, it, expect } from 'vitest'
import { kanaItems } from '../data/kana'
import { kanaDeck } from '../data/decks'
import type { KanaType } from '../types'
import { Bag } from './bag'
import { seededRng, shuffle } from './random'
import {
  allSelected,
  emptySelections,
  generateQuestion,
  isQuestionCorrect,
  pickOptions,
} from './question'

const cards = kanaDeck.cards
const byId = (id: string) => cards.find((c) => c.id === id)!

describe('数据表完整性', () => {
  it('各大类数量正确', () => {
    const count = (t: KanaType) => kanaItems.filter((k) => k.type === t).length
    expect(count('seion')).toBe(46)
    expect(count('dakuon')).toBe(20)
    expect(count('handakuon')).toBe(5)
    expect(count('yoon')).toBe(33)
    expect(count('choon')).toBe(8)
    expect(count('sokuon')).toBe(6)
    expect(kanaItems.length).toBe(118)
  })

  it('id 全局唯一', () => {
    const ids = new Set(kanaItems.map((k) => k.id))
    expect(ids.size).toBe(kanaItems.length)
  })

  it('三种表示均非空', () => {
    for (const k of kanaItems) {
      expect(k.hiragana.length).toBeGreaterThan(0)
      expect(k.katakana.length).toBeGreaterThan(0)
      expect(k.romaji.length).toBeGreaterThan(0)
    }
  })

  it('基础假名罗马音为小写 ASCII；长音用长音符', () => {
    for (const k of kanaItems) {
      if (k.type === 'choon') {
        expect(k.romaji).toMatch(/[āīūēō]/)
      } else {
        expect(k.romaji).toMatch(/^[a-z]+$/)
      }
    }
  })

  it('Hepburn 关键拼写正确', () => {
    const r = (id: string) => byId(id).faces.romaji
    expect(r('seion:し')).toBe('shi')
    expect(r('seion:ち')).toBe('chi')
    expect(r('seion:つ')).toBe('tsu')
    expect(r('seion:ふ')).toBe('fu')
    expect(r('yoon:しゃ')).toBe('sha')
    expect(r('yoon:じゃ')).toBe('ja')
    expect(r('sokuon:まっちゃ')).toBe('matcha') // っ+ち系 → tch
  })

  it('同音字成对存在（ず/づ、じ/ぢ 罗马音相同）', () => {
    expect(byId('dakuon:ず').faces.romaji).toBe('zu')
    expect(byId('dakuon:づ').faces.romaji).toBe('zu')
    expect(byId('dakuon:じ').faces.romaji).toBe('ji')
    expect(byId('dakuon:ぢ').faces.romaji).toBe('ji')
  })
})

describe('Bag 袋子随机', () => {
  it('一轮内每张卡恰好都被覆盖', () => {
    const bag = new Bag(cards.slice(), { rng: seededRng(1) })
    const seen = new Set<string>()
    for (let i = 0; i < cards.length; i++) seen.add(bag.draw().id)
    expect(seen.size).toBe(cards.length)
    expect(bag.round).toBe(1)
  })

  it('抽满一轮后自动重填，round 递增', () => {
    const bag = new Bag(cards.slice(), { rng: seededRng(2) })
    for (let i = 0; i < cards.length; i++) bag.draw()
    expect(bag.seenCount).toBe(cards.length)
    bag.draw() // 触发重填
    expect(bag.round).toBe(2)
    expect(bag.seenCount).toBe(1)
  })

  it('不连续出现同一张卡', () => {
    const bag = new Bag(cards.slice(), { rng: seededRng(3) })
    let prev = ''
    for (let i = 0; i < 500; i++) {
      const id = bag.draw().id
      expect(id).not.toBe(prev)
      prev = id
    }
  })

  it('加权使目标卡出现更频繁，但每张仍至少一次', () => {
    const target = cards[0]
    const bag = new Bag(cards.slice(), {
      rng: seededRng(4),
      weightOf: (c) => (c.id === target.id ? 5 : 0),
    })
    const seen = new Set<string>()
    let targetCount = 0
    const draws = cards.length + 5
    for (let i = 0; i < draws; i++) {
      const c = bag.draw()
      seen.add(c.id)
      if (c.id === target.id) targetCount++
    }
    expect(seen.size).toBe(cards.length) // 覆盖性保持
    expect(targetCount).toBeGreaterThan(1) // 确实更频繁
  })
})

describe('pickOptions 选项与去歧义', () => {
  it('选项含正确答案、数量正确、无重复', () => {
    const card = byId('seion:か')
    const g = pickOptions(card, 'katakana', 'hiragana', cards, 5, { rng: seededRng(10) })
    expect(g.options).toContain(g.correct)
    expect(g.options.length).toBe(5)
    expect(new Set(g.options).size).toBe(5)
  })

  it('题面=罗马音 zu 时，づ 不出现在 ず 的假名选项里', () => {
    const zu = byId('dakuon:ず') // 正确答案
    const other = byId('dakuon:づ')
    for (let s = 0; s < 30; s++) {
      const gH = pickOptions(zu, 'hiragana', 'romaji', cards, 6, { rng: seededRng(s) })
      const gK = pickOptions(zu, 'katakana', 'romaji', cards, 6, { rng: seededRng(s) })
      expect(gH.options).not.toContain(other.faces.hiragana) // づ
      expect(gK.options).not.toContain(other.faces.katakana) // ヅ
    }
  })

  it('题面=罗马音 ji 时，ぢ 不出现在 じ 的假名选项里', () => {
    const ji = byId('dakuon:じ')
    const other = byId('dakuon:ぢ')
    for (let s = 0; s < 30; s++) {
      const g = pickOptions(ji, 'hiragana', 'romaji', cards, 6, { rng: seededRng(s) })
      expect(g.options).not.toContain(other.faces.hiragana) // ぢ
    }
  })

  it('题面=平假名 づ、目标罗马音时，zu 只出现一次', () => {
    const card = byId('dakuon:づ')
    const g = pickOptions(card, 'romaji', 'hiragana', cards, 6, { rng: seededRng(7) })
    expect(g.options.filter((o) => o === 'zu').length).toBe(1)
  })

  it('智能干扰优先同行', () => {
    const card = byId('seion:か') // か行
    const g = pickOptions(card, 'romaji', 'hiragana', cards, 5, {
      smart: true,
      rng: seededRng(8),
    })
    const sameRowRomaji = ['ki', 'ku', 'ke', 'ko']
    const overlap = g.options.filter((o) => sameRowRomaji.includes(o)).length
    expect(overlap).toBeGreaterThanOrEqual(1)
  })

  it('候选不足时优雅降级（不报错、不重复）', () => {
    const tiny = [byId('seion:あ'), byId('seion:い')]
    const g = pickOptions(tiny[0], 'romaji', 'hiragana', tiny, 6, { rng: seededRng(9) })
    expect(g.options).toContain('a')
    expect(new Set(g.options).size).toBe(g.options.length)
    expect(g.options.length).toBeLessThanOrEqual(2)
  })
})

describe('generateQuestion 整题', () => {
  it('固定模式：题面为指定表示，另两种各一组', () => {
    const card = byId('seion:さ')
    const q = generateQuestion(card, kanaDeck, 'hiragana', 5, cards, { rng: seededRng(11) })
    expect(q.promptFace).toBe('hiragana')
    expect(q.groups.map((g) => g.face).sort()).toEqual(['katakana', 'romaji'])
  })

  it('随机模式：题面落在该牌组的表示集合内', () => {
    const card = byId('seion:さ')
    for (let s = 0; s < 20; s++) {
      const q = generateQuestion(card, kanaDeck, 'random', 4, cards, { rng: seededRng(s) })
      expect(['hiragana', 'katakana', 'romaji']).toContain(q.promptFace)
      expect(q.groups.length).toBe(2)
    }
  })

  it('判题：全对才算对', () => {
    const card = byId('seion:た')
    const q = generateQuestion(card, kanaDeck, 'romaji', 5, cards, { rng: seededRng(12) })
    const sel = emptySelections(q)
    expect(allSelected(q, sel)).toBe(false)
    for (const g of q.groups) sel[g.face] = g.correct
    expect(allSelected(q, sel)).toBe(true)
    expect(isQuestionCorrect(q, sel)).toBe(true)
    // 改错一组
    const first = q.groups[0]
    sel[first.face] = first.options.find((o) => o !== first.correct) ?? first.correct
    expect(isQuestionCorrect(q, sel)).toBe(false)
  })
})

describe('shuffle 不丢元素', () => {
  it('洗牌为排列', () => {
    const a = Array.from({ length: 50 }, (_, i) => i)
    const b = shuffle(a, seededRng(99))
    expect(b.slice().sort((x, y) => x - y)).toEqual(a)
  })
})
