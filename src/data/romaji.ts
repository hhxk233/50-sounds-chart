import type { RomajiForms } from '../types'

/* ============================================================
   罗马音：Hepburn 平文式 → Kunrei 训令式 转换
   训令式差异（整音节）：
     shi→si  chi→ti  tsu→tu  fu→hu
     sha→sya shu→syu sho→syo
     cha→tya chu→tyu cho→tyo
     ja→zya  ju→zyu  jo→zyo  ji→zi
   长音符 ā/ī/ū/ē/ō → 训令式用抑扬符 â/î/û/ê/ô。
   （づ/ぢ 在训令式里仍写 zu/zi，与 Hepburn 同，无需特殊处理。）
   ============================================================ */

const KUNREI: Record<string, string> = {
  sha: 'sya',
  shu: 'syu',
  sho: 'syo',
  shi: 'si',
  cha: 'tya',
  chu: 'tyu',
  cho: 'tyo',
  chi: 'ti',
  tsu: 'tu',
  ja: 'zya',
  ju: 'zyu',
  jo: 'zyo',
  ji: 'zi',
  fu: 'hu',
}

// 长音节优先，避免 'shi' 被 's' 之类截断；正则从左到右逐个匹配，匹配过的不再处理。
const SYLLABLE_RE = /sha|shu|sho|shi|cha|chu|cho|chi|tsu|ja|ju|jo|ji|fu/g

const MACRON_TO_CIRCUMFLEX: Record<string, string> = {
  ā: 'â',
  ī: 'î',
  ū: 'û',
  ē: 'ê',
  ō: 'ô',
}

export function toKunrei(hepburn: string): string {
  const swapped = hepburn.replace(SYLLABLE_RE, (m) => KUNREI[m] ?? m)
  return swapped.replace(/[āīūēō]/g, (m) => MACRON_TO_CIRCUMFLEX[m] ?? m)
}

export function romajiForms(hepburn: string): RomajiForms {
  return { hepburn, kunrei: toKunrei(hepburn) }
}
