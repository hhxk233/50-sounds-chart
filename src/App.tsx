import { useEffect, useState } from 'react'
import styles from './App.module.css'
import { useSettings } from './store/settings'
import { selectReviewCount, useProgress } from './store/progress'
import { useQuiz } from './hooks/useQuiz'
import PracticeMenu from './components/PracticeMenu'
import QuizScreen from './components/QuizScreen'
import SessionSummary from './components/SessionSummary'
import SettingsView from './components/SettingsView'
import MistakeBook from './components/MistakeBook'
import Chart from './components/Chart'

type Tab = 'practice' | 'chart' | 'mistakes' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('practice')
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  const sound = useSettings((s) => s.sound)
  const setSound = useSettings((s) => s.setSound)
  const reviewCount = useProgress(selectReviewCount)

  // 会话提升到顶层：切到别的标签页再回来不丢进度。
  const quiz = useQuiz()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])

  const cycleTheme = () =>
    setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')
  const themeIcon = theme === 'system' ? '◐' : theme === 'light' ? '☀' : '☾'

  const practiceMistakes = (len: number) => {
    quiz.startMistakes(len)
    setTab('practice')
  }

  const tabClass = (t: Tab) => (tab === t ? styles.tabActive : styles.tab)

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={`${styles.logo} jp`}>あ</span>
          <div>
            <h1 className={styles.title}>五十音特訓</h1>
            <p className={styles.subtitle}>平 · 片 · 罗 · 音 随机互测</p>
          </div>
        </div>
        <div className={styles.tools}>
          <button
            className={styles.iconBtn}
            onClick={() => setSound(!sound)}
            title={sound ? '发音：开' : '发音：关'}
            aria-pressed={sound}
          >
            {sound ? '🔊' : '🔇'}
          </button>
          <button className={styles.iconBtn} onClick={cycleTheme} title={`主题：${theme}`}>
            {themeIcon}
          </button>
        </div>
      </header>

      <nav className={styles.nav}>
        <button className={tabClass('practice')} onClick={() => setTab('practice')}>
          练习
        </button>
        <button className={tabClass('chart')} onClick={() => setTab('chart')}>
          50音图
        </button>
        <button className={tabClass('mistakes')} onClick={() => setTab('mistakes')}>
          错题本
          {reviewCount > 0 && <span className={styles.badge}>{reviewCount}</span>}
        </button>
        <button className={tabClass('settings')} onClick={() => setTab('settings')}>
          设置
        </button>
      </nav>

      <main className={styles.main}>
        {tab === 'practice' && quiz.status === 'idle' && (
          <PracticeMenu
            onStart={quiz.startSession}
            onStartMistakes={(len) => quiz.startMistakes(len)}
            onOpenChart={() => setTab('chart')}
          />
        )}
        {tab === 'practice' && quiz.status === 'running' && <QuizScreen quiz={quiz} />}
        {tab === 'practice' && quiz.status === 'done' && <SessionSummary quiz={quiz} />}
        {tab === 'chart' && <Chart />}
        {tab === 'mistakes' && <MistakeBook onPracticeMistakes={practiceMistakes} />}
        {tab === 'settings' && <SettingsView />}
      </main>

      <footer className={styles.footer}>本地存档 · 内置离线发音 · Hepburn / 训令式</footer>
    </div>
  )
}
