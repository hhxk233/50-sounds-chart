import { describe, it, expect } from 'vitest'
import { toKunrei } from './romaji'
import { kanaItems } from './kana'

describe('Hepburn → 训令式转换', () => {
  it('单音节差异正确', () => {
    const cases: [string, string][] = [
      ['shi', 'si'],
      ['chi', 'ti'],
      ['tsu', 'tu'],
      ['fu', 'hu'],
      ['ji', 'zi'],
      ['sha', 'sya'],
      ['shu', 'syu'],
      ['sho', 'syo'],
      ['cha', 'tya'],
      ['chu', 'tyu'],
      ['cho', 'tyo'],
      ['ja', 'zya'],
      ['ju', 'zyu'],
      ['jo', 'zyo'],
    ]
    for (const [h, k] of cases) expect(toKunrei(h)).toBe(k)
  })

  it('无差异的音保持不变', () => {
    for (const r of ['ka', 'a', 'n', 'wo', 'kya', 'ryo']) expect(toKunrei(r)).toBe(r)
  })

  it('促音词的双辅音正确', () => {
    expect(toKunrei('matcha')).toBe('mattya') // っ+ちゃ
    expect(toKunrei('zasshi')).toBe('zassi')
    expect(toKunrei('kitte')).toBe('kitte')
    expect(toKunrei('kippu')).toBe('kippu')
  })

  it('长音符 → 抑扬符', () => {
    expect(toKunrei('kā')).toBe('kâ')
    expect(toKunrei('ō')).toBe('ô')
    expect(toKunrei('ī')).toBe('î')
  })
})

describe('数据两种罗马音齐全', () => {
  it('每条都有 hepburn 与 kunrei', () => {
    for (const k of kanaItems) {
      expect(k.romaji.hepburn.length).toBeGreaterThan(0)
      expect(k.romaji.kunrei.length).toBeGreaterThan(0)
    }
  })
  it('抽样核对', () => {
    const find = (id: string) => kanaItems.find((k) => k.id === id)!
    expect(find('seion:し').romaji).toEqual({ hepburn: 'shi', kunrei: 'si' })
    expect(find('seion:つ').romaji).toEqual({ hepburn: 'tsu', kunrei: 'tu' })
    expect(find('yoon:じゃ').romaji).toEqual({ hepburn: 'ja', kunrei: 'zya' })
  })
})
