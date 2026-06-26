import type { DeckSource, Question } from '../types'
import s from './Quiz.module.css'

type Props = {
  correct: boolean
  question: Question
  deck: DeckSource
  onNext: () => void
  onReplay: () => void
  soundSupported: boolean
}

export default function FeedbackBar({
  correct,
  question,
  deck,
  onNext,
  onReplay,
  soundSupported,
}: Props) {
  const card = question.card
  return (
    <div className={`${s.feedback} ${correct ? s.fbCorrect : s.fbWrong}`}>
      <div className={s.fbHead}>
        <span className={s.fbIcon}>{correct ? '✓' : '✗'}</span>
        <span className={s.fbText}>{correct ? '正确！' : '记一下，下次就对了'}</span>
        {soundSupported && (
          <button className={s.soundBtn} onClick={onReplay} title="听发音（空格）">
            🔊 发音
          </button>
        )}
      </div>
      <div className={s.answer}>
        {deck.faces.map((f) => (
          <span key={f.key} className={s.answerCell}>
            <span className={s.answerLabel}>{f.label}</span>
            <span className={`${f.jp ? 'jp' : ''} ${f.mono ? 'mono' : ''}`}>{card.faces[f.key]}</span>
          </span>
        ))}
      </div>
      <button className={s.primary} onClick={onNext}>
        下一题<span className={s.kbd}>Enter</span>
      </button>
    </div>
  )
}
