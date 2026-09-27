// Tableros de ZEEK CONNECT (5 × 5). Cada tablero guarda SU SOLUCIÓN: cada letra
// es un camino simple entre sus dos extremos (G verde, P morado, B azul,
// O naranja) y entre los 4 caminos cubren LAS 25 CELDAS. El juego muestra solo
// los extremos. Cada nivel es resoluble por construcción y tiene una única
// solución (generados con un buscador y verificados en los tests).
export const LEVELS: string[][] = [
  ['OOOOG', 'OGGGG', 'PGBBB', 'PGPPB', 'PPPBB'],
  ['OPPPP', 'OOBBP', 'GOBPP', 'GOBPB', 'GGBBB'],
  ['BBBBP', 'OOOBP', 'OGGPP', 'OGPPG', 'OGGGG'],
  ['BBGGG', 'BPGOO', 'BPGGO', 'BPOGO', 'PPOOO'],
  ['PPPPO', 'BOOOO', 'BOGGG', 'BOOBG', 'BBBBG'],
  ['GGGGB', 'GBBBB', 'BBPPP', 'BOOOP', 'OOPPP'],
  ['OBBBB', 'OGGGG', 'OOPPG', 'POOPG', 'PPPPG'],
  ['OOOOB', 'PPPOB', 'PGGGB', 'PGBBB', 'PGGGG'],
  ['BOOOO', 'BBPPO', 'GBGPO', 'GBGPO', 'GGGPP'],
  ['POOOO', 'PPPPO', 'GGGOO', 'GBBOB', 'GGBBB'],
  ['BPPPP', 'BPBOP', 'BBBOO', 'GGGGO', 'GOOOO'],
  ['GPPPG', 'GPGGG', 'GGGOB', 'OOOOB', 'OBBBB'],
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
