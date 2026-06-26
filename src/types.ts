/* ============================================================
   类型定义
   分两层：
   1) 领域层（kana）—— KanaItem，方便录数据时有自动补全。
   2) 通用层（quiz）—— QuizCard / DeckSource，答题引擎只认这一层，
      与具体领域解耦。以后做「背单词」只要再写一份 DeckSource 即可复用整套引擎、错题本、设置。
   ============================================================ */

/* ---------- 领域层：五十音 ---------- */

export type KanaType =
  | 'seion' // 清音
  | 'dakuon' // 浊音
  | 'handakuon' // 半浊音
  | 'yoon' // 拗音
  | 'choon' // 长音（精选示例）
  | 'sokuon' // 促音（精选示例）

export interface KanaItem {
  id: string
  hiragana: string
  katakana: string
  romaji: string // 统一 Hepburn 平文式
  type: KanaType
  row: string // 「あ行」「が行」等；长/促音用占位标签。用于智能干扰项。
}

/* ---------- 通用层：答题引擎的数据形态 ---------- */

/** 一张卡片「某种表示」的键。kana：'hiragana'|'katakana'|'romaji'；单词可为 'word'|'reading'|'meaning'。 */
export type FaceKey = string

/** 通用答题卡。引擎只依赖这个结构。 */
export interface QuizCard {
  id: string
  /** 各种表示，如 { hiragana, katakana, romaji } */
  faces: Record<FaceKey, string>
  /** 智能干扰项的细分组（kana 用「行」）。 */
  group?: string
  /** 大类（kana 用 KanaType）。用于「启用哪些类」与同类干扰项。 */
  category: string
  /** 喂给 TTS 的文本。 */
  audioText: string
}

/** 一种「表示维度」的元信息，用于 UI 标签和模式名。 */
export interface FaceMeta {
  key: FaceKey
  label: string
  /** 是否用日文字体渲染。 */
  jp?: boolean
  /** 是否等宽（罗马音）。 */
  mono?: boolean
}

/** 一个大类的元信息，用于设置开关与错题本分组标签。 */
export interface CategoryMeta {
  key: string
  label: string
}

/** 一个「牌组来源」：把某领域的数据打包成引擎统一形态。 */
export interface DeckSource {
  id: string
  name: string
  faces: FaceMeta[]
  categories: CategoryMeta[]
  cards: QuizCard[]
}

/* ---------- 答题过程 ---------- */

/** 题面显示哪种表示；'random' = 每题随机。 */
export type QuizMode = string // FaceKey 之一，或 'random'

/** 一组选项（对应某一种「目标表示」）。 */
export interface OptionGroup {
  face: FaceKey
  correct: string
  options: string[] // 含正确答案，已打乱
}

/** 一道题。 */
export interface Question {
  card: QuizCard
  promptFace: FaceKey // 题面显示的表示
  groups: OptionGroup[] // 其余每种表示各一组选项
}

/** 用户在各组里的选择：face -> 选中的值（未选为 null）。 */
export type Selections = Record<FaceKey, string | null>
