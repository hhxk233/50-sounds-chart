import type {
  CategoryMeta,
  Deck,
  FaceKey,
  FaceMeta,
  KanaItem,
  QuizCard,
  RomajiStyle,
} from '../types'
import { kanaItems } from './kana'

/* ============================================================
   把领域数据(kana)适配成引擎用的卡 + 表示元信息 + 解析器。
   这是「换数据即换题库」的接缝。
   ============================================================ */

export const KANA_FACES: FaceMeta[] = [
  { key: 'hiragana', label: '平假名', kind: 'text', jp: true },
  { key: 'katakana', label: '片假名', kind: 'text', jp: true },
  { key: 'romaji', label: '罗马音', kind: 'text', mono: true },
  { key: 'audio', label: '读音', kind: 'audio' },
]

export const KANA_CATEGORIES: CategoryMeta[] = [
  { key: 'seion', label: '清音' },
  { key: 'dakuon', label: '浊音' },
  { key: 'handakuon', label: '半浊音' },
  { key: 'yoon', label: '拗音' },
  { key: 'choon', label: '长音' },
  { key: 'sokuon', label: '促音' },
]

export const kanaDeck: Deck = {
  id: 'kana',
  name: '五十音',
  faces: KANA_FACES,
  categories: KANA_CATEGORIES,
}

function toCard(k: KanaItem): QuizCard {
  return {
    id: k.id,
    category: k.type,
    group: k.row,
    hiragana: k.hiragana,
    katakana: k.katakana,
    romaji: k.romaji,
    audioText: k.hiragana,
  }
}

export const kanaCards: QuizCard[] = kanaItems.map(toCard)
export const cardById: Map<string, QuizCard> = new Map(kanaCards.map((c) => [c.id, c]))

export function getCard(id: string): QuizCard | undefined {
  return cardById.get(id)
}

/**
 * 取某卡某表示用于「显示/比较」的值。
 * - 文本面返回对应字符串(罗马音按样式)。
 * - audio 面返回 Hepburn 作为「同音判定键」：ず/づ 都是 zu、じ/ぢ 都是 ji，
 *   保证读音题里同音卡被当作一个，不出现歧义。
 */
export function faceValue(card: QuizCard, face: FaceKey, style: RomajiStyle): string {
  switch (face) {
    case 'hiragana':
      return card.hiragana
    case 'katakana':
      return card.katakana
    case 'romaji':
      return card.romaji[style]
    case 'audio':
      return card.romaji.hepburn
    default:
      return ''
  }
}

/** 绑定罗马音样式，得到引擎用的 faceValue。 */
export function makeFaceValue(style: RomajiStyle) {
  return (card: QuizCard, face: FaceKey): string => faceValue(card, face, style)
}

export function audioTextOf(card: QuizCard): string {
  return card.audioText
}
