import { allSet, categorySets, rowSetsByCategory, type PracticeSet } from '../data/sets'
import { useProgress } from '../store/progress'
import type { ActiveSet } from '../hooks/useQuiz'
import s from './Menu.module.css'

function toActive(set: PracticeSet): ActiveSet {
  return { id: set.id, label: set.label, cardIds: set.cardIds }
}

function SetCard({
  label,
  sample,
  counts,
  accent,
  onPick,
}: {
  label: string
  sample: string
  counts: number[]
  accent?: boolean
  onPick: (count: number) => void
}) {
  return (
    <div className={`${s.card} ${accent ? s.cardAccent : ''}`}>
      <div className={s.cardMain}>
        <div className={s.cardLabel}>{label}</div>
        <div className={`${s.cardSample} jp`}>{sample}</div>
      </div>
      <div className={s.chips}>
        {counts.map((c) => (
          <button key={c} className={s.chip} onClick={() => onPick(c)}>
            {c} 题
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PracticeMenu({
  onStart,
  onStartMistakes,
}: {
  onStart: (set: ActiveSet, length: number) => void
  onStartMistakes: (length: number) => void
}) {
  const mistakeCount = useProgress(
    (st) => Object.values(st.mistakes).filter((r) => r.wrong > 0).length,
  )
  const rowsByCat = rowSetsByCategory()
  const mistakeCounts = Array.from(new Set([10, 20, mistakeCount]))
    .filter((n) => n > 0 && n <= mistakeCount)
    .sort((a, b) => a - b)

  return (
    <div className={s.wrap}>
      <p className={s.intro}>
        选一个范围和题量开始。每题随机考平假名 / 片假名 / 罗马音 / 读音其中一种。
      </p>

      {mistakeCount > 0 && (
        <section className={s.section}>
          <h3 className={s.sectionTitle}>错题复习</h3>
          <SetCard
            label="错题复习"
            sample={`${mistakeCount} 个易错音 · 优先攻克`}
            counts={mistakeCounts.length ? mistakeCounts : [mistakeCount]}
            accent
            onPick={(c) => onStartMistakes(c)}
          />
        </section>
      )}

      <section className={s.section}>
        <h3 className={s.sectionTitle}>综合练习</h3>
        <SetCard
          label={allSet.label}
          sample={allSet.sample}
          counts={allSet.counts}
          accent
          onPick={(c) => onStart(toActive(allSet), c)}
        />
        <div className={s.grid}>
          {categorySets.map((set) => (
            <SetCard
              key={set.id}
              label={set.label}
              sample={set.sample}
              counts={set.counts}
              onPick={(c) => onStart(toActive(set), c)}
            />
          ))}
        </div>
      </section>

      <section className={s.section}>
        <h3 className={s.sectionTitle}>分行精练</h3>
        {rowsByCat.map((group) => (
          <details key={group.category} className={s.details}>
            <summary className={s.summary}>
              <span>{group.label}</span>
              <span className={s.summaryCount}>{group.rows.length} 行</span>
            </summary>
            <div className={s.grid}>
              {group.rows.map((set) => (
                <SetCard
                  key={set.id}
                  label={set.label}
                  sample={set.sample}
                  counts={set.counts}
                  onPick={(c) => onStart(toActive(set), c)}
                />
              ))}
            </div>
          </details>
        ))}
      </section>
    </div>
  )
}
