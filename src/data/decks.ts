import type { CategoryMeta, DeckSource, FaceMeta, KanaItem, QuizCard } from '../types'
import { kanaItems } from './kana'

/* ============================================================
   把领域数据（kana）适配成通用 DeckSource。
   这是「换数据即换题库」的接缝：以后加 vocabDeck 只要再 push 一个 DeckSource。
   ============================================================ */

export const KANA_FACES: FaceMeta[] = [
  { key: 'hiragana', label: '平假名', jp: true },
  { key: 'katakana', label: '片假名', jp: true },
  { key: 'romaji', label: '罗马音', mono: true },
]

export const KANA_CATEGORIES: CategoryMeta[] = [
  { key: 'seion', label: '清音' },
  { key: 'dakuon', label: '浊音' },
  { key: 'handakuon', label: '半浊音' },
  { key: 'yoon', label: '拗音' },
  { key: 'choon', label: '长音' },
  { key: 'sokuon', label: '促音' },
]

function kanaToCard(k: KanaItem): QuizCard {
  return {
    id: k.id,
    faces: { hiragana: k.hiragana, katakana: k.katakana, romaji: k.romaji },
    group: k.row,
    category: k.type,
    audioText: k.hiragana, // 平假名最适合喂日文 TTS
  }
}

export const kanaDeck: DeckSource = {
  id: 'kana',
  name: '五十音',
  faces: KANA_FACES,
  categories: KANA_CATEGORIES,
  cards: kanaItems.map(kanaToCard),
}

/** 所有可用牌组。以后背单词：实现 vocabDeck 后加进来即可。 */
export const decks: DeckSource[] = [kanaDeck]
export const defaultDeck = kanaDeck

export function getDeck(id: string): DeckSource {
  return decks.find((d) => d.id === id) ?? defaultDeck
}
