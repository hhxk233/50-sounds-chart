import type { KanaItem, KanaType } from '../types'
import { romajiForms } from './romaji'

/* ============================================================
   完整五十音数据。三元组里的罗马音写 Hepburn，构建时自动派生训令式。
   id = `${type}:${hiragana}`，全局唯一且稳定（错题本以此为键）。
   长音 / 促音用精选示例三元组表示。
   ============================================================ */

type Triple = readonly [hiragana: string, katakana: string, hepburn: string]

interface RowDef {
  readonly type: KanaType
  readonly row: string
  readonly items: readonly Triple[]
}

const ROWS: readonly RowDef[] = [
  /* ---------------- 清音 seion（46）---------------- */
  { type: 'seion', row: 'あ行', items: [
    ['あ', 'ア', 'a'], ['い', 'イ', 'i'], ['う', 'ウ', 'u'], ['え', 'エ', 'e'], ['お', 'オ', 'o'],
  ] },
  { type: 'seion', row: 'か行', items: [
    ['か', 'カ', 'ka'], ['き', 'キ', 'ki'], ['く', 'ク', 'ku'], ['け', 'ケ', 'ke'], ['こ', 'コ', 'ko'],
  ] },
  { type: 'seion', row: 'さ行', items: [
    ['さ', 'サ', 'sa'], ['し', 'シ', 'shi'], ['す', 'ス', 'su'], ['せ', 'セ', 'se'], ['そ', 'ソ', 'so'],
  ] },
  { type: 'seion', row: 'た行', items: [
    ['た', 'タ', 'ta'], ['ち', 'チ', 'chi'], ['つ', 'ツ', 'tsu'], ['て', 'テ', 'te'], ['と', 'ト', 'to'],
  ] },
  { type: 'seion', row: 'な行', items: [
    ['な', 'ナ', 'na'], ['に', 'ニ', 'ni'], ['ぬ', 'ヌ', 'nu'], ['ね', 'ネ', 'ne'], ['の', 'ノ', 'no'],
  ] },
  { type: 'seion', row: 'は行', items: [
    ['は', 'ハ', 'ha'], ['ひ', 'ヒ', 'hi'], ['ふ', 'フ', 'fu'], ['へ', 'ヘ', 'he'], ['ほ', 'ホ', 'ho'],
  ] },
  { type: 'seion', row: 'ま行', items: [
    ['ま', 'マ', 'ma'], ['み', 'ミ', 'mi'], ['む', 'ム', 'mu'], ['め', 'メ', 'me'], ['も', 'モ', 'mo'],
  ] },
  { type: 'seion', row: 'や行', items: [
    ['や', 'ヤ', 'ya'], ['ゆ', 'ユ', 'yu'], ['よ', 'ヨ', 'yo'],
  ] },
  { type: 'seion', row: 'ら行', items: [
    ['ら', 'ラ', 'ra'], ['り', 'リ', 'ri'], ['る', 'ル', 'ru'], ['れ', 'レ', 're'], ['ろ', 'ロ', 'ro'],
  ] },
  { type: 'seion', row: 'わ行', items: [
    ['わ', 'ワ', 'wa'], ['を', 'ヲ', 'wo'], ['ん', 'ン', 'n'],
  ] },

  /* ---------------- 浊音 dakuon（20）---------------- */
  { type: 'dakuon', row: 'が行', items: [
    ['が', 'ガ', 'ga'], ['ぎ', 'ギ', 'gi'], ['ぐ', 'グ', 'gu'], ['げ', 'ゲ', 'ge'], ['ご', 'ゴ', 'go'],
  ] },
  { type: 'dakuon', row: 'ざ行', items: [
    ['ざ', 'ザ', 'za'], ['じ', 'ジ', 'ji'], ['ず', 'ズ', 'zu'], ['ぜ', 'ゼ', 'ze'], ['ぞ', 'ゾ', 'zo'],
  ] },
  { type: 'dakuon', row: 'だ行', items: [
    ['だ', 'ダ', 'da'], ['ぢ', 'ヂ', 'ji'], ['づ', 'ヅ', 'zu'], ['で', 'デ', 'de'], ['ど', 'ド', 'do'],
  ] },
  { type: 'dakuon', row: 'ば行', items: [
    ['ば', 'バ', 'ba'], ['び', 'ビ', 'bi'], ['ぶ', 'ブ', 'bu'], ['べ', 'ベ', 'be'], ['ぼ', 'ボ', 'bo'],
  ] },

  /* ---------------- 半浊音 handakuon（5）---------------- */
  { type: 'handakuon', row: 'ぱ行', items: [
    ['ぱ', 'パ', 'pa'], ['ぴ', 'ピ', 'pi'], ['ぷ', 'プ', 'pu'], ['ぺ', 'ペ', 'pe'], ['ぽ', 'ポ', 'po'],
  ] },

  /* ---------------- 拗音 yoon（33）---------------- */
  { type: 'yoon', row: 'きゃ行', items: [['きゃ', 'キャ', 'kya'], ['きゅ', 'キュ', 'kyu'], ['きょ', 'キョ', 'kyo']] },
  { type: 'yoon', row: 'しゃ行', items: [['しゃ', 'シャ', 'sha'], ['しゅ', 'シュ', 'shu'], ['しょ', 'ショ', 'sho']] },
  { type: 'yoon', row: 'ちゃ行', items: [['ちゃ', 'チャ', 'cha'], ['ちゅ', 'チュ', 'chu'], ['ちょ', 'チョ', 'cho']] },
  { type: 'yoon', row: 'にゃ行', items: [['にゃ', 'ニャ', 'nya'], ['にゅ', 'ニュ', 'nyu'], ['にょ', 'ニョ', 'nyo']] },
  { type: 'yoon', row: 'ひゃ行', items: [['ひゃ', 'ヒャ', 'hya'], ['ひゅ', 'ヒュ', 'hyu'], ['ひょ', 'ヒョ', 'hyo']] },
  { type: 'yoon', row: 'みゃ行', items: [['みゃ', 'ミャ', 'mya'], ['みゅ', 'ミュ', 'myu'], ['みょ', 'ミョ', 'myo']] },
  { type: 'yoon', row: 'りゃ行', items: [['りゃ', 'リャ', 'rya'], ['りゅ', 'リュ', 'ryu'], ['りょ', 'リョ', 'ryo']] },
  { type: 'yoon', row: 'ぎゃ行', items: [['ぎゃ', 'ギャ', 'gya'], ['ぎゅ', 'ギュ', 'gyu'], ['ぎょ', 'ギョ', 'gyo']] },
  { type: 'yoon', row: 'じゃ行', items: [['じゃ', 'ジャ', 'ja'], ['じゅ', 'ジュ', 'ju'], ['じょ', 'ジョ', 'jo']] },
  { type: 'yoon', row: 'びゃ行', items: [['びゃ', 'ビャ', 'bya'], ['びゅ', 'ビュ', 'byu'], ['びょ', 'ビョ', 'byo']] },
  { type: 'yoon', row: 'ぴゃ行', items: [['ぴゃ', 'ピャ', 'pya'], ['ぴゅ', 'ピュ', 'pyu'], ['ぴょ', 'ピョ', 'pyo']] },

  /* ---------------- 长音 choon（精选示例）---------------- */
  { type: 'choon', row: '長音', items: [
    ['かあ', 'カー', 'kā'], ['いい', 'イー', 'ī'], ['くう', 'クー', 'kū'], ['ねえ', 'ネー', 'nē'],
    ['おう', 'オー', 'ō'], ['こう', 'コー', 'kō'], ['すう', 'スー', 'sū'], ['ゆう', 'ユー', 'yū'],
  ] },

  /* ---------------- 促音 sokuon（精选示例）---------------- */
  { type: 'sokuon', row: '促音', items: [
    ['きって', 'キッテ', 'kitte'], ['きっぷ', 'キップ', 'kippu'], ['ざっし', 'ザッシ', 'zasshi'],
    ['いっぱい', 'イッパイ', 'ippai'], ['まっちゃ', 'マッチャ', 'matcha'], ['けっこん', 'ケッコン', 'kekkon'],
  ] },
]

export const kanaItems: KanaItem[] = ROWS.flatMap(({ type, row, items }) =>
  items.map(
    ([hiragana, katakana, hepburn]): KanaItem => ({
      id: `${type}:${hiragana}`,
      hiragana,
      katakana,
      romaji: romajiForms(hepburn),
      type,
      row,
    }),
  ),
)
