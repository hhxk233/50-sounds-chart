# 五十音特訓 · 50音 Trainer

因为不知道为什么完全找不到辅助背50音图好用的小程序所以就自己做了一个!

辅助背五十音图的小应用：每题随机抽一个音，随机用「平假名 / 片假名 / 罗马音 / 读音」其中一种当题面，下面给 4–6 个「另一种表示」的选项，选一个确定判分——有点像百词斩。带错题本、按行/分类的定量练习、发音。

> 架构刻意把「答题引擎」与「数据」解耦，以后想拿来**背单词**，只要再写一份数据 + 一个 `faceValue` 解析器，整套引擎、错题本、设置都能复用。

## 玩法

- **题型完全随机**：题面是平/片/罗/读音之一，选项是另一种。读音题——题面是喇叭（可反复点听）、或选项是一排喇叭让你选出对应的音。
- **按范围 + 题量练**：
  - 分行精练：あ行、か行…，浊音 が行…，拗音、长音、促音每行都能单独练；
  - 综合：清音综合 / 浊音综合 / … / 全部综合；
  - 错题复习：把错题本里的音拎出来定量刷。
  每个范围给几个合理题量（行 10/15/20，综合按规模递增），做完一组出成绩 + 答错回顾。
- **错题本**：每个音记错误次数，按错得多少排序；可「只练错题」，掌握了就 ✓ 移出。
- **发音**：浏览器内置 Web Speech（`ja-JP`）。
- **快捷键**：数字键选项、`Enter` 确定 / 下一题、`空格` 重听。
- 进度、设置、错题全部存在浏览器 `localStorage`。

## 设置

- **罗马音形式**：Hepburn 平文式（shi/chi/tsu）↔ 训令式（si/ti/tu）切换。
- 每题选项数量 4–6、读音题型开关、智能干扰项、错题加权抽题、自动发音、主题（跟随系统/浅/深）。

## 网页方式运行

需要 Node 18+（开发用的是 Node 22）。

```bash
npm install      # 首次安装依赖
npm run dev      # 打开终端给出的 http://localhost:5173
npm run build    # 类型检查 + 打包到 dist/
npm test         # 引擎单测（vitest）
```

## 打包成桌面 / 安卓 app（Tauri v2 + GitHub Actions）

不需要本机装安卓环境——交给云端 CI 构建。**推一个 `v` 开头的 tag 即可自动出 Release：**

```bash
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` 会：

- 在 `windows-latest` 上用 [tauri-action] 构建 **Windows 安装包（.msi / .exe）** 并创建 Release；
- 在 `ubuntu-latest` 上构建 **Android APK**（debug 签名，可直接装到手机）并上传到同一个 Release。

也可以在仓库 **Actions** 页面手动运行（workflow_dispatch）。

本地跑桌面版（需先装 [Rust] 和系统 WebView，Windows 一般自带 WebView2）：

```bash
npm run tauri dev      # 开发
npm run tauri build    # 本地出桌面安装包
```

> 说明：**桌面构建很稳**；**安卓是实验性的**——Tauri 移动端较新，首次 CI 若失败，多半是 NDK 版本（`release.yml` 里的 `NDK_VERSION`）或 Tauri CLI 版本要微调。要做正式签名的 release apk（而非 debug），需生成 keystore 并把它和口令存成仓库 Secrets，再把构建命令换成 `--apk` + 签名配置。

## 目录结构

```
src/
├─ types.ts              领域(KanaItem) + 通用(QuizCard) 类型
├─ data/
│  ├─ kana.ts            完整五十音（按行展开）
│  ├─ romaji.ts          Hepburn → 训令式 转换
│  ├─ decks.ts           卡 + 表示元信息 + faceValue 解析器  ← 扩展背单词从这入手
│  └─ sets.ts            练习集合（行 / 综合 / 全部）与题量
├─ engine/               纯逻辑，无 React，可单测
│  ├─ random.ts  bag.ts  question.ts
│  └─ *.test.ts          单测（含全量出题扫描、同音去歧义）
├─ store/                Zustand + localStorage（设置 / 错题本）
├─ hooks/                useSpeech（发音）· useQuiz（会话状态机）
└─ components/           界面（练习菜单 / 答题 / 成绩 / 设置 / 错题本）

src-tauri/               Tauri v2 桌面+安卓壳
.github/workflows/       打 tag 自动发布 Release
```

[tauri-action]: https://github.com/tauri-apps/tauri-action
[Rust]: https://www.rust-lang.org/tools/install
