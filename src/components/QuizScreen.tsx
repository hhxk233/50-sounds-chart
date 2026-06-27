import { useEffect } from 'react'
import { KANA_FACES, cardById } from '../data/decks'
import { useQuiz } from '../hooks/useQuiz'
import { useSettings } from '../store/settings'
import { useSpeech } from '../hooks/useSpeech'
import type { FaceKey, FaceMeta } from '../types'
import s from './Quiz.module.css'

const faceMeta = (k: FaceKey): FaceMeta => KANA_FACES.find((f) => f.key === k)!

function fontClass(meta: FaceMeta): string {
  return `${meta.jp ? 'jp' : ''} ${meta.mono ? 'mono' : ''}`
}

export default function QuizScreen({ quiz }: { quiz: ReturnType<typeof useQuiz> }) {
  const { question, selectedId, phase, lastCorrect, faceValue, current, total, correctCount, answered } =
    quiz
  const sound = useSettings((st) => st.sound)
  const { speak, supported } = useSpeech()

  // 新题：题面是读音则自动播放
  useEffect(() => {
    if (question && sound && supported && phase === 'answering' && question.promptFace === 'audio') {
      speak(question.card.audioText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question])

  // 揭晓：自动播放正确音
  useEffect(() => {
    if (phase === 'revealed' && question && sound && supported) speak(question.card.audioText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // 键盘：数字选项、Enter 确定/下一题、空格重听
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!question) return
      if (e.key === 'Enter') {
        if (phase === 'answering' && selectedId) {
          e.preventDefault()
          quiz.confirm()
        } else if (phase === 'revealed') {
          e.preventDefault()
          quiz.next()
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        speak(question.card.audioText)
      } else if (/^[1-9]$/.test(e.key) && phase === 'answering') {
        const i = Number(e.key) - 1
        if (i < question.optionIds.length) {
          e.preventDefault()
          quiz.select(question.optionIds[i])
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, selectedId, question, quiz, speak])

  if (!question) return null

  const promptMeta = faceMeta(question.promptFace)
  const targetMeta = faceMeta(question.targetFace)
  const correctId = question.card.id
  const progressPct = total ? (answered / total) * 100 : 0
  const promptIsAudio = promptMeta.kind === 'audio'
  const targetIsAudio = targetMeta.kind === 'audio'

  return (
    <div className={s.screen}>
      <div className={s.topbar}>
        <button className={s.exitBtn} onClick={() => quiz.exit()} title="退出本组">
          ✕
        </button>
        <div className={s.progressTrack}>
          <div className={s.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <div className={s.counter}>
          <span className={s.counterNum}>
            {current}/{total}
          </span>
          <span className={s.counterSub}>✓ {correctCount}</span>
        </div>
      </div>

      <p className={s.hint}>
        {promptIsAudio ? '听发音' : <>看 <b>{promptMeta.label}</b></>}，选 <b>{targetMeta.label}</b>
        {targetIsAudio && <span className={s.hintDim}>（点喇叭试听）</span>}
      </p>

      {promptIsAudio ? (
        <div className={s.prompt}>
          <button
            className={s.audioBig}
            onClick={() => speak(question.card.audioText)}
            title="播放发音（空格重听）"
          >
            <span className={s.audioBigIcon}>🔊</span>
            <span className={s.audioBigText}>点击播放</span>
          </button>
        </div>
      ) : (
        <div className={s.prompt}>
          <span className={s.promptTag}>{promptMeta.label}</span>
          <span className={`${s.promptValue} ${fontClass(promptMeta)}`}>
            {faceValue(question.card, question.promptFace)}
          </span>
        </div>
      )}

      <div className={s.options}>
        {question.optionIds.map((id, i) => {
          const c = cardById.get(id)!
          const isSel = selectedId === id
          const isCorrect = id === correctId
          let cls = s.option
          if (phase === 'answering') {
            if (isSel) cls += ` ${s.selected}`
          } else if (isCorrect) {
            cls += ` ${s.correct}`
          } else if (isSel) {
            cls += ` ${s.wrong}`
          } else {
            cls += ` ${s.dim}`
          }
          const textDisabled = phase === 'revealed' && !targetIsAudio
          return (
            <button
              key={id}
              className={`${cls} ${targetIsAudio ? s.optAudio : ''}`}
              disabled={textDisabled}
              onClick={() => {
                if (targetIsAudio) speak(c.audioText)
                if (phase === 'answering') quiz.select(id)
              }}
            >
              <span className={s.optNum}>{i + 1}</span>
              {targetIsAudio ? (
                <span className={s.optSpeaker}>🔊</span>
              ) : (
                <span className={fontClass(targetMeta)}>{faceValue(c, question.targetFace)}</span>
              )}
              {targetIsAudio && phase === 'revealed' && (
                <span className={`${s.optReveal} jp`}>
                  {c.hiragana}
                  <span className="mono"> {faceValue(c, 'romaji')}</span>
                </span>
              )}
              {phase === 'revealed' && isCorrect && <span className={s.mark}>✓</span>}
              {phase === 'revealed' && isSel && !isCorrect && <span className={s.mark}>✗</span>}
            </button>
          )
        })}
      </div>

      {phase === 'answering' ? (
        <button className={s.primary} disabled={!selectedId} onClick={() => quiz.confirm()}>
          确定<span className={s.kbd}>Enter</span>
        </button>
      ) : (
        <div className={`${s.feedback} ${lastCorrect ? s.fbCorrect : s.fbWrong}`}>
          <div className={s.fbHead}>
            <span className={s.fbIcon}>{lastCorrect ? '✓' : '✗'}</span>
            <span className={s.fbText}>{lastCorrect ? '正确！' : '记一下，下次就对了'}</span>
            {supported && (
              <button className={s.soundBtn} onClick={() => speak(question.card.audioText)}>
                🔊 发音
              </button>
            )}
          </div>
          <div className={s.answer}>
            {KANA_FACES.filter((f) => f.kind === 'text').map((f) => (
              <span key={f.key} className={s.answerCell}>
                <span className={s.answerLabel}>{f.label}</span>
                <span className={`${s.ansVal} ${fontClass(f)}`}>
                  {faceValue(question.card, f.key)}
                </span>
              </span>
            ))}
          </div>
          <button className={s.primary} onClick={() => quiz.next()}>
            {current >= total ? '看结果' : '下一题'}
            <span className={s.kbd}>Enter</span>
          </button>
        </div>
      )}
    </div>
  )
}
