import type { FaceMeta, OptionGroup } from '../types'
import type { Phase } from '../hooks/useQuiz'
import s from './Quiz.module.css'

// 类型 OptionGroup 来自 ../types；本组件默认导出名为 OptionGroupView 以免同名冲突。
type Props = {
  meta: FaceMeta
  group: OptionGroup
  selected: string | null
  phase: Phase
  onSelect: (value: string) => void
}

export default function OptionGroupView({ meta, group, selected, phase, onSelect }: Props) {
  const fontCls = `${meta.jp ? 'jp' : ''} ${meta.mono ? 'mono' : ''}`
  return (
    <div className={s.group}>
      <div className={s.groupLabel}>{meta.label}</div>
      <div className={s.options}>
        {group.options.map((opt) => {
          const isSelected = selected === opt
          const isCorrect = opt === group.correct
          let cls = s.option
          if (phase === 'answering') {
            if (isSelected) cls += ` ${s.selected}`
          } else if (isCorrect) {
            cls += ` ${s.correct}`
          } else if (isSelected) {
            cls += ` ${s.wrong}`
          } else {
            cls += ` ${s.dim}`
          }
          return (
            <button
              key={opt}
              className={`${cls} ${fontCls}`}
              onClick={() => onSelect(opt)}
              disabled={phase === 'revealed'}
            >
              {opt}
              {phase === 'revealed' && isCorrect && <span className={s.mark}>✓</span>}
              {phase === 'revealed' && isSelected && !isCorrect && <span className={s.mark}>✗</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
