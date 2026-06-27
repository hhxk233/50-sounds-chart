import type { ReactNode } from 'react'
import { useSettings, type ThemePref } from '../store/settings'
import type { RomajiStyle } from '../types'
import s from './Settings.module.css'

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

  return (
    <div className={s.wrap}>
      <section className={s.card}>
        <div className={s.rowHead}>
          <h3 className={s.h3}>罗马音形式</h3>
          <span className={s.sub}>shi/si · tsu/tu</span>
        </div>
        <Segmented
          value={st.romajiStyle}
          options={[
            { value: 'hepburn', label: 'Hepburn 平文式' },
            { value: 'kunrei', label: '训令式' },
          ]}
          onChange={(v) => st.setRomajiStyle(v as RomajiStyle)}
        />
      </section>

      <section className={s.card}>
        <div className={s.rowHead}>
          <h3 className={s.h3}>每题选项数量</h3>
          <span className={s.sub}>候选个数</span>
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
        <SwitchRow title="读音题型" sub="出「听发音选假名」「看假名选发音」(需系统有日语语音)">
          <Toggle checked={st.includeAudio} onChange={st.setIncludeAudio} />
        </SwitchRow>
        <div className={s.divider} />
        <SwitchRow title="智能干扰项" sub="相近的同行/同类项优先，练得更狠">
          <Toggle checked={st.smartDistractors} onChange={st.setSmart} />
        </SwitchRow>
        <div className={s.divider} />
        <SwitchRow title="错题加权抽题" sub="错得多的音更常出现">
          <Toggle checked={st.weightMistakes} onChange={st.setWeightMistakes} />
        </SwitchRow>
        <div className={s.divider} />
        <SwitchRow title="自动发音" sub="揭晓答案时自动朗读">
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
