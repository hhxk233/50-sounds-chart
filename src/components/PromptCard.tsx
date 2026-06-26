import type { FaceMeta } from '../types'
import s from './Quiz.module.css'

export default function PromptCard({ meta, value }: { meta: FaceMeta; value: string }) {
  return (
    <div className={s.prompt}>
      <span className={s.promptTag}>{meta.label}</span>
      <span className={`${s.promptValue} ${meta.jp ? 'jp' : ''} ${meta.mono ? 'mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}
