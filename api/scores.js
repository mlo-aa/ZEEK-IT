import { Redis } from '@upstash/redis'
import { MODES } from '../src/lib/constants.js'
import { RANKING_LIMIT, buildEntry, dayKey } from '../src/lib/rankingRules.js'

// Ranking del día en Upstash Redis (se conecta desde Vercel → Storage).
// Por modo y por día: un sorted set con el mejor puntaje de cada nombre
// y un hash con el detalle de esa mejor partida.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

const TTL_SECONDS = 60 * 60 * 24 * 3
const keys = (mode, day = dayKey()) => ({
  board: `zeekit:${day}:${mode}:board`,
  detail: `zeekit:${day}:${mode}:detail`,
})

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

async function readBoard(mode) {
  const k = keys(mode)
  const members = await redis.zrange(k.board, 0, RANKING_LIMIT - 1, { rev: true, withScores: true })
  const ids = members.filter((_, i) => i % 2 === 0)
  if (!ids.length) return []
  const details = await redis.hmget(k.detail, ...ids)
  return ids.map((id, i) => ({ ...(details?.[id] ?? {}), score: Number(members[i * 2 + 1]) }))
}

export async function GET(request) {
  if (!redis) return json({ error: 'ranking_not_configured' }, 503)
  const mode = new URL(request.url).searchParams.get('mode')
  const modes = MODES[mode] ? [mode] : Object.keys(MODES)
  const boards = Object.fromEntries(await Promise.all(modes.map(async (m) => [m, await readBoard(m)])))
  return json({ day: dayKey(), boards })
}

export async function POST(request) {
  if (!redis) return json({ error: 'ranking_not_configured' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  const entry = buildEntry(body)
  if (!entry) return json({ error: 'invalid_entry' }, 400)

  // Freno simple contra envíos en ráfaga desde la misma IP.
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  const allowed = await redis.set(`zeekit:rl:${ip}`, 1, { nx: true, ex: 3 })
  if (!allowed) return json({ error: 'too_many_requests' }, 429)

  const k = keys(entry.mode)
  const id = entry.name.toLocaleLowerCase('es')
  const previous = await redis.zscore(k.board, id)
  const improved = previous === null || entry.score > Number(previous)

  if (improved) {
    const at = new Date().toISOString()
    await redis
      .pipeline()
      .zadd(k.board, { score: entry.score, member: id })
      .hset(k.detail, { [id]: { ...entry, at } })
      .expire(k.board, TTL_SECONDS)
      .expire(k.detail, TTL_SECONDS)
      .exec()
  }

  const rank = await redis.zrevrank(k.board, id)
  return json({
    entry,
    best: improved ? entry.score : Number(previous),
    improved,
    rank: rank === null ? null : rank + 1,
    board: await readBoard(entry.mode),
  })
}
