type Priority = 'high' | 'low'
type QueuedRequest = {
  id: string
  url: string
  priority: Priority
  fn: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  low: 1,
}

function hasHigherPriority(a: Priority, b: Priority): boolean {
  return PRIORITY_ORDER[a] < PRIORITY_ORDER[b]
}

class RequestQueue {
  private queues: Record<Priority, QueuedRequest[]> = {
    high: [],
    low: [],
  }
  private processing = false
  private lastRequestTime = 0
  private minDelay: number
  private enabled: boolean

  constructor(minDelayMs: number = 200, enabled: boolean = true) {
    this.minDelay = minDelayMs
    this.enabled = enabled
  }

  setMinDelay(ms: number) {
    this.minDelay = ms
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  async add<T>(url: string, fn: () => Promise<T>, priority: Priority = 'low'): Promise<T> {
    return new Promise((resolve, reject) => {
      const existingRequest = this.findExistingRequest(url)

      if (existingRequest) {
        if (hasHigherPriority(priority, existingRequest.priority)) {
          const oldQueue = this.queues[existingRequest.priority]
          const oldIndex = oldQueue.findIndex((r) => r.url === url)
          if (oldIndex !== -1) {
            oldQueue.splice(oldIndex, 1)
          }
          this.queues[priority].push({
            id: existingRequest.id,
            url,
            priority,
            fn: fn as () => Promise<unknown>,
            resolve: resolve as (value: unknown) => void,
            reject,
          })
        } else {
          existingRequest.resolve = resolve as (value: unknown) => void
          existingRequest.reject = reject
        }
        this.process()
        return
      }

      const request: QueuedRequest = {
        id: crypto.randomUUID(),
        url,
        priority,
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      }

      this.queues[priority].push(request)
      this.process()
    }) as Promise<T>
  }

  private findExistingRequest(url: string): QueuedRequest | undefined {
    for (const priority of ['high', 'low'] as Priority[]) {
      const found = this.queues[priority].find((r) => r.url === url)
      if (found) return found
    }
    return undefined
  }

  private getNextRequest(): QueuedRequest | undefined {
    if (this.queues.high.length > 0) {
      return this.queues.high.shift()
    }
    if (this.queues.low.length > 0) {
      return this.queues.low.shift()
    }
    return undefined
  }

  private hasQueuedRequests(): boolean {
    return this.queues.high.length > 0 || this.queues.low.length > 0
  }

  private async process() {
    if (this.processing || !this.enabled) return

    this.processing = true

    while (this.hasQueuedRequests()) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      const delayNeeded = Math.max(0, this.minDelay - timeSinceLastRequest)

      if (delayNeeded > 0) {
        await this.sleep(delayNeeded)
      }
const request = this.getNextRequest()
      if (!request) break

      try {
        this.lastRequestTime = Date.now()
        const result = await request.fn()
        request.resolve(result)
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)))
      }
    }

    this.processing = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  clear() {
    this.queues = { high: [], low: [] }
  }

  getQueueLength(): number {
    return this.queues.high.length + this.queues.low.length
  }
}

export const githubRequestQueue = new RequestQueue(200, true)