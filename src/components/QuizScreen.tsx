import { useEffect } from 'react'
import { useQuiz } from '../hooks/useQuiz'
import { useSettings } from '../store/settings'
import { useSpeech } from '../hooks/useSpeech'
import PromptCard from './PromptCard'
import OptionGroupView from './OptionGroup'
import FeedbackBar from './FeedbackBar'
import s from './Quiz.module.css'

export default function QuizScreen({ quiz }: { quiz: ReturnType<typeof useQuiz> }) {
  const {
    deck,
    question,
    selections,
    phase,
    lastCorrect,
    stats,
    progress,
    canConfirm,
    source,
    activeCount,
  } = quiz
  const sound = useSettings((st) => st.sound)
  const { speak, supported } = useSpeech()

  // 揭晓时自动发音
  useEffect(() => {
    if (phase === 'revealed' && question && sound && supported) speak(question.card.audioText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question])

  // 键盘：Enter 确定 / 下一题；空格 重听
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (phase === 'answering' && canConfirm) {
          e.preventDefault()
          quiz.confirm()
        } else if (phase === 'revealed') {
          e.preventDefault()
          quiz.next()
        }
      } else if (e.key === ' ' && phase === 'revealed' && question) {
        e.preventDefault()
        speak(question.card.audioText)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, canConfirm, question, quiz, speak])

  if (activeCount === 0) {
    return (
      <div className={s.empty}>
        <p className={s.emptyTitle}>{source === 'mistakes' ? '🎉 没有错题啦' : '没有可练的内容'}</p>
        <p className={s.emptyHint}>
          {source === 'mistakes'
            ? '错题都清光了，回到全部继续练吧。'
            : '请到「设置」里至少启用一类音。'}
        </p>
        {source === 'mistakes' && (
          <button className={s.primary} onClick={() => quiz.start('all')}>
            练习全部
          </button>
        )}
      </div>
    )
  }
  if (!question) return null

  const promptMeta = deck.faces.find((f) => f.key === question.promptFace)!
  const targetLabels = question.groups
    .map((g) => deck.faces.find((f) => f.key === g.face)!.label)
    .join(' + ')
  const acc = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0

  return (
    <div className={s.screen}>
      <div className={s.statsRow}>
        <div className={s.stat}>
          <span className={s.statNum}>第 {progress.round} 轮</span>
          <span className={s.statLabel}>
            {progress.seen}/{progress.total}
          </span>
        </div>
        <div className={s.progressTrack}>
          <div
            className={s.progressFill}
            style={{ width: `${progress.total ? (progress.seen / progress.total) * 100 : 0}%` }}
          />
        </div>
        <div className={`${s.stat} ${s.statRight}`}>
          <span className={s.statNum}>
            {stats.correct}/{stats.answered}
          </span>
          <span className={s.statLabel}>
            {acc}% · 连对 {stats.streak}
          </span>
        </div>
      </div>

      {source === 'mistakes' && (
        <div className={s.sourceChip}>
          错题复习 · {activeCount} 张
          <button className={s.linkBtn} onClick={() => quiz.start('all')}>
            返回全部
          </button>
        </div>
      )}

      <p className={s.hint}>
        看 <b>{promptMeta.label}</b>，选 <b>{targetLabels}</b>
      </p>

      <PromptCard meta={promptMeta} value={question.card.faces[question.promptFace]} />

      <div className={s.groups}>
        {question.groups.map((g) => {
          const meta = deck.faces.find((f) => f.key === g.face)!
          return (
            <OptionGroupView
              key={g.face}
              meta={meta}
              group={g}
              selected={selections[g.face] ?? null}
              phase={phase}
              onSelect={(v) => quiz.select(g.face, v)}
            />
          )
        })}
      </div>

      {phase === 'answering' ? (
        <button className={s.primary} disabled={!canConfirm} onClick={() => quiz.confirm()}>
          确定<span className={s.kbd}>Enter</span>
        </button>
      ) : (
        <FeedbackBar
          correct={lastCorrect === true}
          question={question}
          deck={deck}
          onNext={() => quiz.next()}
          onReplay={() => speak(question.card.audioText)}
          soundSupported={supported}
        />
      )}
    </div>
  )
}
