import { cardById } from '../data/decks'
import { useQuiz } from '../hooks/useQuiz'
import { playCard } from '../audio'
import s from './Quiz.module.css'

export default function SessionSummary({ quiz }: { quiz: ReturnType<typeof useQuiz> }) {
  const { session, correctCount, total, faceValue } = quiz
  if (!session) return null

  const pct = total ? Math.round((correctCount / total) * 100) : 0
  const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '💪' : '📚'
  const wrongIds = Array.from(new Set(session.results.filter((r) => !r.correct).map((r) => r.cardId)))

  return (
    <div className={s.summaryWrap}>
      <div className={s.scoreCard}>
        <span className={s.scoreEmoji}>{emoji}</span>
        <div className={s.scoreBig}>
          {correctCount}
          <small>/{total}</small>
        </div>
        <div className={s.scoreLabel}>
          {session.set.label} · 正确率 {pct}%
        </div>
      </div>

      {wrongIds.length > 0 && (
        <div className={s.missed}>
          <div className={s.missedTitle}>答错的（{wrongIds.length}）</div>
          {wrongIds.map((id) => {
            const c = cardById.get(id)
            if (!c) return null
            return (
              <div key={id} className={s.missedItem}>
                <span className={`${s.missedKana} jp`}>{c.hiragana}</span>
                <span className={s.missedInfo}>
                  <span className="jp">{c.katakana}</span>
                  <span className={`${s.missedRomaji} mono`}>{faceValue(c, 'romaji')}</span>
                </span>
                <button className={s.soundBtn} onClick={() => playCard(c)}>
                  🔊
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className={s.summaryActions}>
        <button className={s.primary} onClick={() => quiz.retry()}>
          再来一组
        </button>
        <button className={s.secondary} onClick={() => quiz.exit()}>
          换一套
        </button>
      </div>
    </div>
  )
}
