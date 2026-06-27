import { Fragment } from 'react'
import { kanaItems } from '../data/kana'
import { useSettings } from '../store/settings'
import { useSpeech } from '../hooks/useSpeech'
import type { KanaItem, KanaType } from '../types'
import s from './Chart.module.css'

type Row = { label: string; cells: (KanaItem | null)[] }
type Section = { type: KanaType; label: string; cols: number; heads: string[]; rows: Row[] }

const VOWEL5: Record<string, number> = { a: 0, i: 1, u: 2, e: 3, o: 4 }

// 按罗马音末位元音定位列；ん(末位 n) 归到「特殊行」。
function colOf(hepburn: string, cols: number): number {
  const v = hepburn[hepburn.length - 1]
  if (cols === 5) return v in VOWEL5 ? VOWEL5[v] : -1
  return v === 'a' ? 0 : v === 'u' ? 1 : v === 'o' ? 2 : -1
}

function buildRows(type: KanaType, cols: number): Row[] {
  const items = kanaItems.filter((k) => k.type === type)
  const order: string[] = []
  const map = new Map<string, KanaItem[]>()
  for (const k of items) {
    if (!map.has(k.row)) {
      map.set(k.row, [])
      order.push(k.row)
    }
    map.get(k.row)!.push(k)
  }
  const rows: Row[] = []
  const specials: KanaItem[] = []
  for (const r of order) {
    const cells: (KanaItem | null)[] = new Array(cols).fill(null)
    for (const k of map.get(r)!) {
      const ci = colOf(k.romaji.hepburn, cols)
      if (ci >= 0 && ci < cols && !cells[ci]) cells[ci] = k
      else specials.push(k) // ん
    }
    rows.push({ label: r.replace('行', ''), cells })
  }
  if (specials.length) {
    const cells: (KanaItem | null)[] = new Array(cols).fill(null)
    specials.forEach((k, i) => {
      if (i < cols) cells[i] = k
    })
    rows.push({ label: '', cells })
  }
  return rows
}

const HEAD5 = ['あ', 'い', 'う', 'え', 'お']
const HEAD3 = ['ゃ', 'ゅ', 'ょ']

const SECTIONS: Section[] = [
  { type: 'seion', label: '清音', cols: 5, heads: HEAD5, rows: buildRows('seion', 5) },
  { type: 'dakuon', label: '浊音', cols: 5, heads: HEAD5, rows: buildRows('dakuon', 5) },
  { type: 'handakuon', label: '半浊音', cols: 5, heads: HEAD5, rows: buildRows('handakuon', 5) },
  { type: 'yoon', label: '拗音', cols: 3, heads: HEAD3, rows: buildRows('yoon', 3) },
]

export default function Chart() {
  const style = useSettings((st) => st.romajiStyle)
  const { speak, supported } = useSpeech()

  return (
    <div className={s.wrap}>
      <p className={s.intro}>
        完整五十音图{supported ? '，点任意假名听发音' : ''}。罗马音按当前设置（
        {style === 'hepburn' ? 'Hepburn 平文式' : '训令式'}）显示。
      </p>

      {SECTIONS.map((sec) => (
        <section key={sec.type} className={s.section}>
          <h3 className={s.sectionTitle}>{sec.label}</h3>
          <div
            className={s.grid}
            style={{ gridTemplateColumns: `30px repeat(${sec.cols}, 1fr)` }}
          >
            <div className={s.corner} />
            {sec.heads.map((h) => (
              <div key={h} className={`${s.head} jp`}>
                {h}
              </div>
            ))}
            {sec.rows.map((row, ri) => (
              <Fragment key={ri}>
                <div className={`${s.rowLabel} jp`}>{row.label}</div>
                {row.cells.map((k, ci) =>
                  k ? (
                    <button
                      key={ci}
                      className={s.cell}
                      onClick={() => speak(k.hiragana)}
                      title={supported ? '点击发音' : undefined}
                    >
                      <span className={`${s.hira} jp`}>{k.hiragana}</span>
                      <span className={`${s.kata} jp`}>{k.katakana}</span>
                      <span className={`${s.romaji} mono`}>{k.romaji[style]}</span>
                    </button>
                  ) : (
                    <div key={ci} className={s.cellEmpty} />
                  ),
                )}
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
