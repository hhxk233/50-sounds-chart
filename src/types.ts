/* ============================================================
   类型定义
   - 题面/选项有四种「表示」(face)：平假名 / 片假名 / 罗马音 / 读音(audio)。
   - 罗马音有两种拼写样式：Hepburn 平文式 / Kunrei 训令式。
   - 引擎不直接读字段，而是通过注入的 faceValue 解析器取值，
     这样换数据(以后背单词)只要换解析器与数据即可复用引擎。
   ============================================================ */

export type KanaType =
  | 'seion'
  | 'dakuon'
  | 'handakuon'
  | 'yoon'
  | 'choon'
  | 'sokuon'

/** 罗马音样式。 */
export type RomajiStyle = 'hepburn' | 'kunrei'

/** 一个音的两种罗马音拼写。 */
export interface RomajiForms {
  hepburn: string
  kunrei: string
}

export interface KanaItem {
  id: string
  hiragana: string
  katakana: string
  romaji: RomajiForms
  type: KanaType
  row: string
}

/** 四种表示。 */
export type FaceKey = 'hiragana' | 'katakana' | 'romaji' | 'audio'
export type FaceKind = 'text' | 'audio'

export interface FaceMeta {
  key: FaceKey
  label: string
  kind: FaceKind
  jp?: boolean
  mono?: boolean
}

export interface CategoryMeta {
  key: string
  label: string
}

export interface Deck {
  id: string
  name: string
  faces: FaceMeta[]
  categories: CategoryMeta[]
}

/** 通用答题卡（当前为假名领域；以后背单词可另写一份卡 + 解析器）。 */
export interface QuizCard {
  id: string
  category: string // KanaType
  group?: string // 「行」，智能干扰项用
  hiragana: string
  katakana: string
  romaji: RomajiForms
  audioText: string // 喂给 TTS
}

/** 取某卡某表示的值（罗马音样式已在外部绑定）。audio 返回同音判定键。 */
export type FaceValue = (card: QuizCard, face: FaceKey) => string

/** 一道题：题面一种表示，选项是另一种表示的若干候选。 */
export interface Question {
  card: QuizCard
  promptFace: FaceKey
  targetFace: FaceKey
  optionIds: string[] // 候选卡 id，含正确卡，已打乱
}

/** 一次定长练习里单题的结果。 */
export interface AnswerResult {
  cardId: string
  correct: boolean
}
