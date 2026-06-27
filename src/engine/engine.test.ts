import { describe, it, expect } from 'vitest'
import { kanaItems } from '../data/kana'
import { cardById, kanaCards, makeFaceValue } from '../data/decks'
import type { KanaType } from '../types'
import { Bag } from './bag'
import { seededRng, shuffle } from './random'
import { answerMatches, generateQuestion, pickOptionIds } from './question'

const cards = kanaCards
const byId = (id: string) => cardById.get(id)!
const fvHep = makeFaceValue('hepburn')
const fvKun = makeFaceValue('kunrei')
const ALL_FACES = ['hiragana', 'katakana', 'romaji', 'audio'] as const

describe('数据表完整性', () => {
  it('各大类数量正确，总数 118', () => {
    const count = (t: KanaType) => kanaItems.filter((k) => k.type === t).length
    expect(count('seion')).toBe(46)
    expect(count('dakuon')).toBe(20)
    expect(count('handakuon')).toBe(5)
    expect(count('yoon')).toBe(33)
    expect(count('choon')).toBe(8)
    expect(count('sokuon')).toBe(6)
    expect(kanaItems.length).toBe(118)
  })

  it('id 唯一', () => {
    expect(new Set(kanaItems.map((k) => k.id)).size).toBe(kanaItems.length)
  })

  it('同音字成对（hepburn 相同）', () => {
    expect(byId('dakuon:ず').romaji.hepburn).toBe('zu')
    expect(byId('dakuon:づ').romaji.hepburn).toBe('zu')
    expect(byId('dakuon:じ').romaji.hepburn).toBe('ji')
    expect(byId('dakuon:ぢ').romaji.hepburn).toBe('ji')
  })
})

describe('faceValue 解析', () => {
  it('罗马音随样式变化；audio 用 hepburn 作同音键', () => {
    const shi = byId('seion:し')
    expect(fvHep(shi, 'romaji')).toBe('shi')
    expect(fvKun(shi, 'romaji')).toBe('si')
    expect(fvHep(shi, 'audio')).toBe('shi')
    expect(fvKun(shi, 'audio')).toBe('shi') // audio 不随样式变
    expect(fvHep(shi, 'hiragana')).toBe('し')
    expect(fvHep(shi, 'katakana')).toBe('シ')
  })
})

describe('Bag 袋子随机', () => {
  it('一轮覆盖所有卡', () => {
    const bag = new Bag(cards.slice(), { rng: seededRng(1) })
    const seen = new Set<string>()
    for (let i = 0; i < cards.length; i++) seen.add(bag.draw().id)
    expect(seen.size).toBe(cards.length)
  })
  it('不连续重复', () => {
    const bag = new Bag(cards.slice(), { rng: seededRng(3) })
    let prev = ''
    for (let i = 0; i < 400; i++) {
      const id = bag.draw().id
      expect(id).not.toBe(prev)
      prev = id
    }
  })
})

describe('pickOptionIds 选项与去歧义', () => {
  it('含正确卡、数量正确、目标值不重复', () => {
    const card = byId('seion:か')
    const ids = pickOptionIds(card, 'katakana', 'hiragana', cards, 5, fvHep, false, seededRng(10))
    expect(ids).toContain(card.id)
    expect(ids.length).toBe(5)
    const vals = ids.map((id) => fvHep(byId(id), 'katakana'))
    expect(new Set(vals).size).toBe(5)
  })

  it('读音题面 zu：选项不含另一个同音 づ', () => {
    const zu = byId('dakuon:ず')
    for (let s = 0; s < 30; s++) {
      const ids = pickOptionIds(zu, 'hiragana', 'audio', cards, 6, fvHep, false, seededRng(s))
      expect(ids).not.toContain('dakuon:づ')
      expect(ids).toContain('dakuon:ず')
    }
  })

  it('读音为目标：同音 づ 不进选项（音值唯一）', () => {
    const zu = byId('dakuon:ず')
    for (let s = 0; s < 30; s++) {
      const ids = pickOptionIds(zu, 'audio', 'hiragana', cards, 6, fvHep, false, seededRng(s))
      expect(ids).not.toContain('dakuon:づ')
    }
  })

  it('罗马音方向 ji：选项不含 ぢ（两种样式都成立）', () => {
    const ji = byId('dakuon:じ')
    for (const fv of [fvHep, fvKun]) {
      const ids = pickOptionIds(ji, 'hiragana', 'romaji', cards, 6, fv, false, seededRng(5))
      expect(ids).not.toContain('dakuon:ぢ')
    }
  })

  it('智能干扰优先同行', () => {
    const ka = byId('seion:か')
    const ids = pickOptionIds(ka, 'romaji', 'hiragana', cards, 5, fvHep, true, seededRng(8))
    const romaji = ids.map((id) => fvHep(byId(id), 'romaji'))
    const sameRow = ['ki', 'ku', 'ke', 'ko']
    expect(romaji.filter((r) => sameRow.includes(r)).length).toBeGreaterThanOrEqual(1)
  })
})

describe('generateQuestion 整题', () => {
  it('题面与目标不同且都在允许集合内；含正确卡', () => {
    const card = byId('seion:さ')
    for (let s = 0; s < 30; s++) {
      const q = generateQuestion(card, cards, {
        faceValue: fvHep,
        allowedFaces: [...ALL_FACES],
        optionCount: 5,
        rng: seededRng(s),
      })
      expect(ALL_FACES).toContain(q.promptFace)
      expect(ALL_FACES).toContain(q.targetFace)
      expect(q.promptFace).not.toBe(q.targetFace)
      expect(q.optionIds).toContain(card.id)
      expect(q.optionIds.length).toBe(5)
    }
  })

  it('不含读音时只在三种文本面里出题', () => {
    const card = byId('seion:さ')
    const q = generateQuestion(card, cards, {
      faceValue: fvHep,
      allowedFaces: ['hiragana', 'katakana', 'romaji'],
      optionCount: 4,
      rng: seededRng(1),
    })
    expect(q.promptFace).not.toBe('audio')
    expect(q.targetFace).not.toBe('audio')
  })

  it('判题：正确卡判对', () => {
    const card = byId('seion:た')
    const q = generateQuestion(card, cards, {
      faceValue: fvHep,
      allowedFaces: [...ALL_FACES],
      optionCount: 5,
      rng: seededRng(12),
    })
    expect(answerMatches(q, card, fvHep)).toBe(true)
    const wrong = byId(q.optionIds.find((id) => id !== card.id)!)
    expect(answerMatches(q, wrong, fvHep)).toBe(false)
  })
})

describe('shuffle 为排列', () => {
  it('不丢元素', () => {
    const a = Array.from({ length: 40 }, (_, i) => i)
    expect(shuffle(a, seededRng(9)).slice().sort((x, y) => x - y)).toEqual(a)
  })
})
