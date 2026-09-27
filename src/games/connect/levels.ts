// Tableros de ZEEK CONNECT (5 × 5). Cada tablero guarda SU SOLUCIÓN: cada letra
// es un camino simple entre sus dos extremos (G verde, P morado, B azul,
// O naranja; "." celda libre). El juego muestra solo los extremos. Así cada
// nivel es resoluble por construcción, y los tests lo verifican.
export const LEVELS: string[][] = [
  ['BGG.G', 'B.GGG', 'BBPPP', '.B..P', 'OOOOO'],
  ['BBBBO', 'BGG.O', 'GGOOO', 'GPPP.', 'GP...'],
  ['GGOOO', 'GBP.O', 'GBPPP', 'GBB.P', 'GGB..'],
  ['POOO.', 'PPGOO', '.PGB.', 'PPGB.', '..GBB'],
  ['OGGG.', 'OG..P', 'O.PPP', 'OPPBB', 'BBBB.'],
  ['PGGGB', 'PGBBB', 'PGBO.', 'PPPO.', '..POO'],
  ['GG..B', 'OG..B', 'OGGBB', 'OP.PP', 'OPPP.'],
  ['GGG..', 'G.GGP', '.OOPP', 'OOPPB', 'O.BBB'],
  ['GOOOO', 'GGGG.', 'B..G.', 'BPPG.', 'BBPP.'],
  ['BBBBB', '.PGGG', '.PGOO', 'PPG.O', 'P.GGO'],
  ['G.OO.', 'GB.OO', 'GBPPP', 'GBB.P', 'GGB..'],
  ['.GGGG', '.G..G', 'OOPP.', 'OB.PP', 'OBBBP'],
]

export const SIZE = 5
export const COLORS = ['G', 'P', 'B', 'O'] as const
export type Color = (typeof COLORS)[number]

export const COLOR_HEX: Record<Color, string> = {
  G: '#01E576',
  P: '#8A66FF',
  B: '#38BDF8',
  O: '#FB923C',
}
export const COLOR_NAME: Record<Color, string> = { G: 'verde', P: 'morado', B: 'azul', O: 'naranja' }
