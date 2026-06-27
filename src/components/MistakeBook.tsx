import { selectReviewList, useProgress } from '../store/progress'
import { cardById } from '../data/decks'
import { playCard } from '../audio'
import s from './Mistakes.module.css'
import x from './Extras.module.css'

function timeAgo(ts: number): string {
  if (!ts) return ''
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

export default function MistakeBook({
  onPracticeMistakes,
}: {
  onPracticeMistakes: (length: number) => void
}) {
  const list = useProgress(selectReviewList)
  const toggleFavorite = useProgress((st) => st.toggleFavorite)
  const clearCard = useProgress((st) => st.clearCard)
  const resetAll = useProgress((st) => st.resetAll)

  if (list.length === 0) {
    return (
      <div className={s.empty}>
        <p className={s.emptyTitle}>还没有复习内容 🎴</p>
        <p className={s.emptyHint}>答错的音会自动收进来；答题时点 ☆ 也能把任意音收藏进来复习。</p>
      </div>
    )
  }

  const counts = Array.from(new Set([10, 20, list.length]))
    .filter((n) => n > 0 && n <= list.length)
    .sort((a, b) => a - b)

  return (
    <div className={s.wrap}>
      <div className={s.toolbar}>
        <div>
          <div className={s.count}>{list.length} 个待复习</div>
          <div className={s.sub}>答错的 + 收藏的，按错误次数排序</div>
        </div>
        <button
          className={s.ghost}
          onClick={() => {
            if (confirm('确定清空全部复习内容（错题 + 收藏）？此操作不可撤销。')) resetAll()
          }}
        >
          清空
        </button>
      </div>

      <div className={s.practiceRow}>
        <span className={s.practiceLabel}>开始复习：</span>
        {counts.map((c) => (
          <button key={c} className={s.pchip} onClick={() => onPracticeMistakes(c)}>
            {c} 题
          </button>
        ))}
      </div>

      <div className={s.list}>
        {list.map((m) => {
          const card = cardById.get(m.id)
          if (!card) return null
          const acc = m.total ? Math.round(((m.total - m.wrong) / m.total) * 100) : 0
          return (
            <div key={m.id} className={s.item}>
              <span className={`${s.kana} jp`}>{card.hiragana}</span>
              <div className={s.info}>
                <div className={s.line1}>
                  <span className="jp">{card.katakana}</span>
                  <span className={`${s.romaji} mono`}>{card.romaji.hepburn}</span>
                  {m.favorited && <span className={x.favTag}>★ 收藏</span>}
                </div>
                <div className={s.line2}>
                  {m.wrong > 0
                    ? `错 ${m.wrong} 次 · 共 ${m.total} 次 · 正确率 ${acc}%${m.lastSeen ? ` · ${timeAgo(m.lastSeen)}` : ''}`
                    : '已收藏，复习用'}
                </div>
              </div>
              <div className={s.itemActions}>
                <button
                  className={`${x.favStar} ${m.favorited ? x.favStarOn : ''}`}
                  title={m.favorited ? '取消收藏' : '收藏'}
                  onClick={() => toggleFavorite(m.id)}
                >
                  {m.favorited ? '★' : '☆'}
                </button>
                <button className={s.iconBtn} title="发音" onClick={() => playCard(card)}>
                  🔊
                </button>
                <button
                  className={s.iconBtn}
                  title="从复习移除（已掌握）"
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
