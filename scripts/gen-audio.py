#!/usr/bin/env python3
"""生成每个假名音的离线发音到 public/audio/<slug>.mp3。

用微软 edge-tts 的日语神经语音（ja-JP-NanamiNeural），离线打包进 app，
桌面 WebView2 / 安卓 WebView 都能稳定播放（不依赖系统是否装了日语 TTS）。

用法：
    pip install edge-tts
    python scripts/gen-audio.py        # 已存在的文件会跳过

slug 规则与前端 src/audio.ts 的 audioSlug 必须一致：长音符双写（かあ→kaa）。
同音（ず/づ→zu、じ/ぢ→ji）共用一个文件。
"""
import asyncio
import os

import edge_tts

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
VOICE = "ja-JP-NanamiNeural"
MACRON = {"ā": "aa", "ī": "ii", "ū": "uu", "ē": "ee", "ō": "oo"}


def slug(hep: str) -> str:
    return "".join(MACRON.get(c, c) for c in hep)


# (假名, Hepburn) —— 与 src/data/kana.ts 对应
PAIRS = [
    ("あ", "a"), ("い", "i"), ("う", "u"), ("え", "e"), ("お", "o"),
    ("か", "ka"), ("き", "ki"), ("く", "ku"), ("け", "ke"), ("こ", "ko"),
    ("さ", "sa"), ("し", "shi"), ("す", "su"), ("せ", "se"), ("そ", "so"),
    ("た", "ta"), ("ち", "chi"), ("つ", "tsu"), ("て", "te"), ("と", "to"),
    ("な", "na"), ("に", "ni"), ("ぬ", "nu"), ("ね", "ne"), ("の", "no"),
    ("は", "ha"), ("ひ", "hi"), ("ふ", "fu"), ("へ", "he"), ("ほ", "ho"),
    ("ま", "ma"), ("み", "mi"), ("む", "mu"), ("め", "me"), ("も", "mo"),
    ("や", "ya"), ("ゆ", "yu"), ("よ", "yo"),
    ("ら", "ra"), ("り", "ri"), ("る", "ru"), ("れ", "re"), ("ろ", "ro"),
    ("わ", "wa"), ("を", "wo"), ("ん", "n"),
    ("が", "ga"), ("ぎ", "gi"), ("ぐ", "gu"), ("げ", "ge"), ("ご", "go"),
    ("ざ", "za"), ("じ", "ji"), ("ず", "zu"), ("ぜ", "ze"), ("ぞ", "zo"),
    ("だ", "da"), ("ぢ", "ji"), ("づ", "zu"), ("で", "de"), ("ど", "do"),
    ("ば", "ba"), ("び", "bi"), ("ぶ", "bu"), ("べ", "be"), ("ぼ", "bo"),
    ("ぱ", "pa"), ("ぴ", "pi"), ("ぷ", "pu"), ("ぺ", "pe"), ("ぽ", "po"),
    ("きゃ", "kya"), ("きゅ", "kyu"), ("きょ", "kyo"),
    ("しゃ", "sha"), ("しゅ", "shu"), ("しょ", "sho"),
    ("ちゃ", "cha"), ("ちゅ", "chu"), ("ちょ", "cho"),
    ("にゃ", "nya"), ("にゅ", "nyu"), ("にょ", "nyo"),
    ("ひゃ", "hya"), ("ひゅ", "hyu"), ("ひょ", "hyo"),
    ("みゃ", "mya"), ("みゅ", "myu"), ("みょ", "myo"),
    ("りゃ", "rya"), ("りゅ", "ryu"), ("りょ", "ryo"),
    ("ぎゃ", "gya"), ("ぎゅ", "gyu"), ("ぎょ", "gyo"),
    ("じゃ", "ja"), ("じゅ", "ju"), ("じょ", "jo"),
    ("びゃ", "bya"), ("びゅ", "byu"), ("びょ", "byo"),
    ("ぴゃ", "pya"), ("ぴゅ", "pyu"), ("ぴょ", "pyo"),
    ("かあ", "kā"), ("いい", "ī"), ("くう", "kū"), ("ねえ", "nē"),
    ("おう", "ō"), ("こう", "kō"), ("すう", "sū"), ("ゆう", "yū"),
    ("きって", "kitte"), ("きっぷ", "kippu"), ("ざっし", "zasshi"),
    ("いっぱい", "ippai"), ("まっちゃ", "matcha"), ("けっこん", "kekkon"),
]


async def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    uniq: dict[str, str] = {}
    for h, hep in PAIRS:
        uniq.setdefault(slug(hep), h)
    todo = [
        (s, h)
        for s, h in uniq.items()
        if not (os.path.exists(f"{OUT}/{s}.mp3") and os.path.getsize(f"{OUT}/{s}.mp3") > 0)
    ]
    print(f"distinct={len(uniq)} todo={len(todo)}")
    sem = asyncio.Semaphore(8)

    async def one(s: str, h: str) -> None:
        async with sem:
            try:
                await edge_tts.Communicate(h, VOICE).save(f"{OUT}/{s}.mp3")
            except Exception as e:  # noqa: BLE001
                print("FAIL", s, h, repr(e)[:80])

    await asyncio.gather(*(one(s, h) for s, h in todo))
    done = sum(1 for s in uniq if os.path.getsize(f"{OUT}/{s}.mp3") > 0)
    print(f"done={done}/{len(uniq)}")


if __name__ == "__main__":
    asyncio.run(main())
