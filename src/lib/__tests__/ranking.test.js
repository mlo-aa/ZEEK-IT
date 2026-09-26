import { describe, expect, it } from 'vitest'
import { MODES } from '../constants'
import { buildEntry, cleanName, dayKey } from '../rankingRules'
import { computeScore } from '../score'

const win = { name: 'Ada', mode: 'normal', won: true, pairs: 6, attempts: 8, remainingMs: 20_000 }

describe('score', () => {
  it('rewards pairs, winning and time left; penalizes misses', () => {
    expect(computeScore(win)).toBe(6 * 100 + 200 + 20 * 50 - 2 * 10)
    expect(computeScore({ won: false, pairs: 3, attempts: 5, remainingMs: 0 })).toBe(300 - 20)
    expect(computeScore({ won: false, pairs: 0, attempts: 50, remainingMs: 0 })).toBe(0)
  })
})

describe('buildEntry', () => {
  it('accepts a valid game and recomputes the score', () => {
    expect(buildEntry({ ...win, score: 999999 })).toMatchObject({ name: 'Ada', score: computeScore(win) })
  })

  it.each([
    ['unknown mode', { mode: 'god' }],
    ['empty name', { name: '   ' }],
    ['too many pairs', { pairs: 7 }],
    ['attempts below pairs', { attempts: 3 }],
    ['time above duration', { remainingMs: MODES.normal.durationMs + 1 }],
    ['won without all pairs', { pairs: 5 }],
    ['lost with time left', { won: false, pairs: 5 }],
    ['impossibly fast', { remainingMs: 44_000 }],
  ])('rejects %s', (_, patch) => {
    expect(buildEntry({ ...win, ...patch })).toBeNull()
  })

  it('cleans names', () => {
    expect(cleanName('  <b>Ada</b>\n  Lovelace  ')).toBe('bAda/b Lovelace')
    expect(cleanName('x'.repeat(40))).toHaveLength(16)
  })

  it('uses the event day in Costa Rica', () => {
    // 03:00 UTC del 27 = 21:00 del 26 en Costa Rica.
    expect(dayKey(new Date('2026-09-27T03:00:00Z'))).toBe('2026-09-26')
  })
})
