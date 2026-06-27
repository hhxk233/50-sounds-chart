# 五十音特訓 · 50音 Trainer

因为不知道为什么完全找不到辅助背50音图好用的小程序所以就自己做了一个!

辅助背五十音图的小应用：每题随机抽一个音，随机用「平假名 / 片假名 / 罗马音 / 读音」其中一种当题面，下面给 4–6 个「另一种表示」的选项，选一个确定判分——有点像百词斩。带 50音图速查表、错题本、按行/分类的定量练习、离线发音。

> 架构刻意把「答题引擎」与「数据」解耦，以后想拿来**背单词**，只要再写一份数据 + 一个 `faceValue` 解析器，整套引擎、错题本、设置都能复用。

## 玩法

- **题型完全随机**：题面是平/片/罗/读音之一，选项是另一种（罗马音↔读音太直白，已排除）。读音题——题面是喇叭（可反复点听）、或选项是一排喇叭让你选出对应的音。
- **按范围 + 题量练**：分行精练（あ行、か行…、浊音 が行…、拗音/长音/促音各行）、各类综合、全部综合、错题复习。做完一组出成绩 + 答错回顾。
- **50音图速查表**：完整清/浊/半浊/拗音对照表，点任意假名听发音。
- **错题本**：按错误次数排序，可「只练错题」，掌握了就 ✓ 移出。
- **快捷键**：数字键选项、`Enter` 确定 / 下一题、`空格` 重听。
- 进度、设置、错题全部存在浏览器 / app 本地。

## 发音

发音用**内置离线音频**：`public/audio/<slug>.mp3`，由微软 `edge-tts` 的日语神经语音（Nanami）预先生成。这样打包成桌面 / 安卓 app 后**不依赖系统是否装了日语 TTS**，离线也能播；万一音频缺失才回退系统 Web Speech。

重新生成音频（改了数据后）：

```bash
pip install edge-tts
python scripts/gen-audio.py     # 已有的会跳过
```

## 设置

- **罗马音形式**：Hepburn 平文式（shi/chi/tsu）↔ 训令式（si/ti/tu）。
- 每题选项数量 4–6、读音题型开关、智能干扰项、错题加权抽题、自动发音、主题。

## 网页方式运行

需要 Node 18+。

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 类型检查 + 打包到 dist/
npm test         # 引擎单测
```

## 打包成桌面 / 安卓 app（Tauri v2 + GitHub Actions）

不需要本机装安卓环境——交给云端 CI 构建。**推一个 `v` 开头的 tag 即可自动出 Release：**

```bash
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` 会在 `windows-latest` 构建 **Windows 安装包（.exe / NSIS）**、在 `ubuntu-latest` 构建 **Android APK**（debug 签名，可直接装），都上传到同一个 Release。也可在 Actions 页面手动触发。

本地跑桌面版（需先装 [Rust]，Windows 一般自带 WebView2）：

```bash
npm run tauri dev      # 开发
npm run tauri build    # 本地出桌面安装包
```

> 说明：桌面构建很稳；安卓是实验性的，首次 CI 若失败多半是 NDK / Tauri CLI 版本要微调。若 Release 创建报 `Resource not accessible by integration`，确认 `release.yml` 顶部有 `permissions: contents: write`，必要时到仓库 Settings → Actions → General 把 Workflow 权限设为 Read and write。

## 目录结构

```
public/audio/           116 个离线发音 mp3
scripts/gen-audio.py    重新生成发音的脚本（edge-tts）
src/
├─ types.ts             领域(KanaItem) + 通用(QuizCard) 类型
├─ audio.ts             打包音频播放（失败回退 TTS）
├─ data/                kana / romaji(双形式) / decks(解析器) / sets(练习集合)
├─ engine/              纯逻辑：random / bag / question(+ 单测)
├─ store/               Zustand 持久化（设置 / 错题本）
├─ hooks/useQuiz.ts     会话状态机
└─ components/          练习菜单 / 答题 / 成绩 / 50音图 / 设置 / 错题本

src-tauri/              Tauri v2 桌面+安卓壳
.github/workflows/      打 tag 自动发布 Release
```

[Rust]: https://www.rust-lang.org/tools/install
