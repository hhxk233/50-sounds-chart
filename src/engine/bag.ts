import type { QuizCard } from '../types'
import { shuffle, type Rng } from './random'

/** 返回某张卡的「额外副本数」（>=0）。用于错题加权。 */
export type WeightFn = (card: QuizCard) => number

export interface BagOptions {
  rng?: Rng
  weightOf?: WeightFn
  /** 避免相邻两题为同一张卡，默认 true。 */
  avoidImmediateRepeat?: boolean
}

/**
 * 袋子随机（bag randomizer）：把全集塞进袋子无放回抽取，抽空再重填。
 * 天然保证「每一大轮里每张卡至少出现一次」，比纯随机更符合背诵的循环语义。
 * 加权：给卡额外副本（错题加权），仍保证每张至少一次 —— 覆盖性不破。
 */
export class Bag {
  private pool: QuizCard[]
  private queue: QuizCard[] = []
  private seen = new Set<string>()
  private lastId: string | null = null
  private rng: Rng
  private weightOf: WeightFn
  private avoidRepeat: boolean
  round = 0

  constructor(pool: QuizCard[], opts: BagOptions = {}) {
    this.pool = pool
    this.rng = opts.rng ?? Math.random
    this.weightOf = opts.weightOf ?? (() => 0)
    this.avoidRepeat = opts.avoidImmediateRepeat ?? true
    this.refill()
  }

  private refill(): void {
    const items: QuizCard[] = []
    for (const c of this.pool) {
      items.push(c)
      const extra = Math.max(0, Math.floor(this.weightOf(c)))
      for (let i = 0; i < extra; i++) items.push(c)
    }
    this.queue = shuffle(items, this.rng)
    this.seen.clear()
    this.round += 1
  }

  draw(): QuizCard {
    if (this.pool.length === 0) throw new Error('Bag: 牌池为空，请先启用至少一类。')
    if (this.queue.length === 0) this.refill()
    // 队首恰好与上一张相同 → 往后挪一张，避免连续重复。
    if (this.avoidRepeat && this.queue.length > 1 && this.queue[0].id === this.lastId) {
      const first = this.queue.shift()!
      this.queue.push(first)
    }
    const card = this.queue.shift()!
    this.seen.add(card.id)
    this.lastId = card.id
    return card
  }

  /** 本轮全集大小（去重）。 */
  get total(): number {
    return this.pool.length
  }

  /** 本轮已出现的不同卡数（进度条用）。 */
  get seenCount(): number {
    return this.seen.size
  }
}
