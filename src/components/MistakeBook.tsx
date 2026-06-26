import { selectMistakeList, useProgress } from '../store/progress'
import { kanaDeck } from '../data/decks'
import { useSpeech } from '../hooks/useSpeech'
import s from './Mistakes.module.css'

const cardMap = new Map(kanaDeck.cards.map((c) => [c.id, c]))

function timeAgo(ts: number): string {
  if (!ts) return ''
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

export default function MistakeBook({ onPracticeMistakes }: { onPracticeMistakes: () => void }) {
  const list = useProgress(selectMistakeList)
  const clearCard = useProgress((st) => st.clearCard)
  const resetAll = useProgress((st) => st.resetAll)
  const { speak, supported } = useSpeech()

  if (list.length === 0) {
    return (
      <div className={s.empty}>
        <p className={s.emptyTitle}>还没有错题 🎴</p>
        <p className={s.emptyHint}>练习时答错的音会自动收进这里，按错误次数排序，方便集中攻克。</p>
      </div>
    )
  }

  return (
    <div className={s.wrap}>
      <div className={s.toolbar}>
        <div>
          <div className={s.count}>{list.length} 个易错音</div>
          <div className={s.sub}>按错误次数排序</div>
        </div>
        <div className={s.actions}>
          <button className={s.primary} onClick={onPracticeMistakes}>
            只练错题
          </button>
          <button
            className={s.ghost}
            onClick={() => {
              if (confirm('确定清空整个错题本？此操作不可撤销。')) resetAll()
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div className={s.list}>
        {list.map((m) => {
          const card = cardMap.get(m.id)
          if (!card) return null
          const acc = m.total ? Math.round(((m.total - m.wrong) / m.total) * 100) : 0
          return (
            <div key={m.id} className={s.item}>
              <span className={`${s.kana} jp`}>{card.faces.hiragana}</span>
              <div className={s.info}>
                <div className={s.line1}>
                  <span className="jp">{card.faces.katakana}</span>
                  <span className={`${s.romaji} mono`}>{card.faces.romaji}</span>
                </div>
                <div className={s.line2}>
                  错 {m.wrong} 次 · 共 {m.total} 次 · 正确率 {acc}%
                  {m.lastSeen ? ` · ${timeAgo(m.lastSeen)}` : ''}
                </div>
              </div>
              <div className={s.itemActions}>
                {supported && (
                  <button className={s.iconBtn} title="发音" onClick={() => speak(card.audioText)}>
                    🔊
                  </button>
                )}
                <button
                  className={s.iconBtn}
                  title="标记为已掌握（移出错题本）"
                  onClick={() => clearCard(m.id)}
                >
                  ✓
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
