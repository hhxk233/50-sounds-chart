# 五十音特訓 · 50音 Trainer

辅助背五十音图的小网页：每题随机抽一个音，显示「平假名 / 片假名 / 罗马音」其中一种，让你从另两种里各选一个，确定后判对错并发音。带错题本、袋子随机大循环、多种显示模式。

> 架构刻意把「答题引擎」与「数据」解耦，以后想拿来**背单词**，只要再写一份数据（`DeckSource`），整套引擎、错题本、设置都能复用。

## 运行

需要 Node 18+（开发时用的是 Node 22）。

```bash
npm install      # 首次安装依赖
npm run dev      # 本地开发，打开终端里给出的 http://localhost:5173
```

打包 / 预览：

```bash
npm run build    # 类型检查 + 产物输出到 dist/
npm run preview  # 本地预览打包结果
npm test         # 跑引擎单测（vitest）
```

部署：`npm run build` 后把 `dist/` 丢到任意静态托管即可（已设 `base: './'`，也能直接 `file://` 打开 `dist/index.html`）。

## 玩法

- **题面模式**（设置里切换）：固定只看平假名 / 片假名 / 罗马音，或纯随机。
- **双组选项**：题面是平假名时，下面给一组片假名 + 一组罗马音，各选一个，点「确定」一起判。
- **发音**：答完出现 🔊，用浏览器自带 Web Speech 朗读（`ja-JP`），可在设置里关自动发音。
- **错题本**：每个音记错误次数，按错得多少排序；可「只练错题」单独刷，掌握了就 ✓ 移出。
- **袋子随机大循环**：一轮里每个启用的音至少出现一次；开「错题加权」后错得多的音更常出现，但每轮仍至少一次。
- **快捷键**：`Enter` 确定 / 下一题，`空格` 重听发音。
- 进度、设置、错题全部存在浏览器 `localStorage`，换设备不同步。

## 几个设计取舍

- **罗马音用 Hepburn 平文式**：`shi / chi / tsu / fu / ji / sha / cha / ja …`。
- **长音 / 促音用精选示例**：这两类没有单字符三元组，挑了代表性的长元音（かあ・いい・おう…）和含「っ」的常见词（きって・まっちゃ…）当卡片，照走同一套机制。
- **同音字去歧义**：`ず/づ` 罗马音都是 `zu`，`じ/ぢ` 都是 `ji`。生成选项时，凡是「题面值相同」的另一张卡都不会进选项池，保证每题只有一个可选的正确答案。

## 目录结构

```
src/
├─ types.ts              领域层(KanaItem) + 通用层(QuizCard / DeckSource)
├─ data/
│  ├─ kana.ts            完整五十音数据（按行展开，Hepburn）
│  └─ decks.ts           kana → 通用 DeckSource 适配 + 牌组注册表  ← 加单词从这扩展
├─ engine/               纯逻辑，无 React，可单测、可复用
│  ├─ random.ts          洗牌 / 可种子 RNG
│  ├─ bag.ts             袋子随机大循环（+ 错题加权）
│  ├─ question.ts        出题 / 干扰项 / 同音去歧义 / 判题
│  └─ engine.test.ts     20 条单测
├─ store/                Zustand + localStorage 持久化
│  ├─ settings.ts        选项数 / 模式 / 启用音类 / 各开关 / 主题
│  └─ progress.ts        错题本 + 累计统计
├─ hooks/
│  ├─ useSpeech.ts       Web Speech 封装
│  └─ useQuiz.ts         题目状态机：出题→选择→确定→反馈→下一题
└─ components/           界面（CSS Modules）
```

## 以后扩展成「背单词」

1. 在 `src/data/` 加 `vocab.ts`，把单词写成 `QuizCard`：`faces` 用 `{ word, reading, meaning }`，`category` 用词表/词性，`audioText` 用单词。
2. 在 `decks.ts` 里建一个 `vocabDeck: DeckSource`（给它自己的 `faces` 和 `categories`）并 push 进 `decks`。
3. 引擎、错题本、设置、判题逻辑都不用动——题面模式会自动按新 `faces` 生成。
