import { beforeAll, describe, expect, it, vi } from 'vitest'

// Redis en memoria con la parte de la API de @upstash/redis que usamos.
vi.mock('@upstash/redis', () => {
  class FakeRedis {
    constructor() {
      this.z = new Map()
      this.h = new Map()
      this.kv = new Map()
    }
    zset(key) {
      if (!this.z.has(key)) this.z.set(key, new Map())
      return this.z.get(key)
    }
    async zadd(key, { score, member }) {
      this.zset(key).set(member, score)
    }
    async zscore(key, member) {
      return this.zset(key).get(member) ?? null
    }
    sorted(key) {
      return [...this.zset(key)].sort((a, b) => b[1] - a[1])
    }
    async zrevrank(key, member) {
      const i = this.sorted(key).findIndex(([m]) => m === member)
      return i === -1 ? null : i
    }
    async zrange(key, start, stop) {
      return this.sorted(key)
        .slice(start, stop + 1)
        .flatMap(([m, s]) => [m, s])
    }
    async hset(key, obj) {
      if (!this.h.has(key)) this.h.set(key, {})
      Object.assign(this.h.get(key), obj)
    }
    async hmget(key, ...fields) {
      const h = this.h.get(key) ?? {}
      return Object.fromEntries(fields.map((f) => [f, h[f] ?? null]))
    }
    async set(key, value, { nx }) {
      if (nx && this.kv.has(key)) return null
      this.kv.set(key, value)
      return 'OK'
    }
    async expire() {}
    pipeline() {
      const ops = []
      const p = new Proxy(
        {},
        {
          get: (_, name) =>
            name === 'exec'
              ? () => Promise.all(ops.map(([n, a]) => this[n](...a)))
              : (...args) => (ops.push([name, args]), p),
        },
      )
      return p
    }
  }
  return { Redis: FakeRedis }
})

let api
beforeAll(async () => {
  process.env.KV_REST_API_URL = 'https://fake'
  process.env.KV_REST_API_TOKEN = 'fake'
  api = await import('../api/scores.js')
})

let ip = 0
const post = (body) =>
  api.POST(
    new Request('https://x/api/scores', {
      method: 'POST',
      headers: { 'x-forwarded-for': `10.0.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  )

const game = (name, remainingMs, mode = 'normal') => ({ name, mode, won: true, pairs: 6, attempts: 6, remainingMs })

describe('/api/scores', () => {
  it('stores scores, ranks them and keeps each player best', async () => {
    let res = await (await post(game('Ada', 20_000))).json()
    expect(res.rank).toBe(1)
    res = await (await post(game('Grace', 30_000))).json()
    expect(res.rank).toBe(1)
    res = await (await post(game('ada', 10_000))).json()
    expect(res.improved).toBe(false)
    expect(res.rank).toBe(2)

    const data = await (await api.GET(new Request('https://x/api/scores'))).json()
    expect(data.boards.normal.map((e) => e.name)).toEqual(['Grace', 'Ada'])
    expect(data.boards.extreme).toEqual([])
  })

  it('rejects invalid games', async () => {
    const res = await post({ ...game('Eve', 20_000), pairs: 9 })
    expect(res.status).toBe(400)
  })

  it('rate-limits bursts from the same IP', async () => {
    const req = () =>
      api.POST(
        new Request('https://x/api/scores', {
          method: 'POST',
          headers: { 'x-forwarded-for': '1.1.1.1' },
          body: JSON.stringify(game('Linus', 5_000)),
        }),
      )
    expect((await req()).status).toBe(200)
    expect((await req()).status).toBe(429)
  })
})
