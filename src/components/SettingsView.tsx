import type { ReactNode } from 'react'
import { KANA_CATEGORIES, kanaDeck } from '../data/decks'
import { useSettings, type ThemePref } from '../store/settings'
import s from './Settings.module.css'

const categoryCounts: Record<string, number> = kanaDeck.cards.reduce(
  (acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1
    return acc
  },
  {} as Record<string, number>,
)

const modeOptions = [
  ...kanaDeck.faces.map((f) => ({ value: f.key, label: f.label })),
  { value: 'random', label: '随机' },
]

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className={s.segmented}>
      {options.map((o) => (
        <button
          key={o.value}
          className={value === o.value ? s.segActive : s.seg}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`${s.toggle} ${checked ? s.toggleOn : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className={s.knob} />
    </button>
  )
}

function SwitchRow({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className={s.switchRow}>
      <div>
        <div className={s.switchTitle}>{title}</div>
        {sub && <div className={s.switchSub}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsView() {
  const st = useSettings()
  const activeTotal = kanaDeck.cards.filter((c) => st.enabledCategories.includes(c.category)).length

  return (
    <div className={s.wrap}>
      <section className={s.card}>
        <div className={s.rowHead}>
          <h3 className={s.h3}>题面显示</h3>
          <span className={s.sub}>固定一种 / 纯随机</span>
        </div>
        <Segmented value={st.mode} options={modeOptions} onChange={st.setMode} />
      </section>

      <section className={s.card}>
        <div className={s.rowHead}>
          <h3 className={s.h3}>每组选项数量</h3>
          <span className={s.sub}>每种表示给几个候选</span>
        </div>
        <Segmented
          value={String(st.optionCount)}
          options={[
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' },
          ]}
          onChange={(v) => st.setOptionCount(Number(v))}
        />
      </section>

      <section className={s.card}>
        <div className={s.rowHead}>
          <h3 className={s.h3}>练习范围</h3>
          <span className={s.sub}>当前 {activeTotal} 张</span>
        </div>
        <div className={s.cats}>
          {KANA_CATEGORIES.map((c) => {
            const on = st.enabledCategories.includes(c.key)
            return (
              <button
                key={c.key}
                className={`${s.cat} ${on ? s.catOn : ''}`}
                onClick={() => st.toggleCategory(c.key)}
                aria-pressed={on}
              >
                <span>{c.label}</span>
                <span className={s.catCount}>{categoryCounts[c.key]}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className={s.card}>
        <SwitchRow title="智能干扰项" sub="相近的同行/同类项优先，练得更狠">
          <Toggle checked={st.smartDistractors} onChange={st.setSmart} />
        </SwitchRow>
        <div className={s.divider} />
        <SwitchRow title="错题加权抽题" sub="错得多的音更常出现，每轮仍至少一次">
          <Toggle checked={st.weightMistakes} onChange={st.setWeightMistakes} />
        </SwitchRow>
        <div className={s.divider} />
        <SwitchRow title="自动发音" sub="答完自动朗读（浏览器 Web Speech）">
          <Toggle checked={st.sound} onChange={st.setSound} />
        </SwitchRow>
      </section>

      <section className={s.card}>
        <div className={s.rowHead}>
          <h3 className={s.h3}>主题</h3>
        </div>
        <Segmented
          value={st.theme}
          options={[
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
          ]}
          onChange={(v) => st.setTheme(v as ThemePref)}
        />
      </section>

      <button className={s.reset} onClick={() => st.reset()}>
        恢复默认设置
      </button>
    </div>
  )
}
