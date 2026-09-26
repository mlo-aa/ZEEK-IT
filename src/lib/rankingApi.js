import { MODE_IDS } from './constants'
import { RANKING_LIMIT, buildEntry, dayKey } from './rankingRules'

// Cliente del ranking. Si la API no responde (sin internet, o Redis aún sin
// conectar) se usa un ranking guardado en este dispositivo, para que el
// juego nunca se rompa en el stand.
const LOCAL_KEY = 'zeek-it:ranking'

function readLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? 'null')
    return data?.day === dayKey() ? data : { day: dayKey(), boards: {} }
  } catch {
    return { day: dayKey(), boards: {} }
  }
}

function saveLocal(entry) {
  const data = readLocal()
  const board = data.boards[entry.mode] ?? []
  const id = entry.name.toLocaleLowerCase('es')
  const current = board.find((e) => e.name.toLocaleLowerCase('es') === id)
  const improved = !current || entry.score > current.score
  const next = improved ? [...board.filter((e) => e !== current), entry] : board
  next.sort((a, b) => b.score - a.score)
  data.boards[entry.mode] = next.slice(0, RANKING_LIMIT)
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  } catch {
    // Sin almacenamiento: el ranking local vive solo en esta pantalla.
  }
  const rank = data.boards[entry.mode].findIndex((e) => e.name.toLocaleLowerCase('es') === id)
  return {
    entry,
    improved,
    best: improved ? entry.score : current.score,
    rank: rank === -1 ? null : rank + 1,
    board: data.boards[entry.mode],
    local: true,
  }
}

async function request(path, options) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(path, { ...options, signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function submitScore(game) {
  const entry = buildEntry(game)
  if (!entry) return null
  try {
    return await request('/api/scores', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry),
    })
  } catch {
    return saveLocal(entry)
  }
}

export async function fetchRanking() {
  try {
    return await request('/api/scores')
  } catch {
    const data = readLocal()
    return {
      day: data.day,
      boards: Object.fromEntries(MODE_IDS.map((m) => [m, data.boards[m] ?? []])),
      local: true,
    }
  }
}
