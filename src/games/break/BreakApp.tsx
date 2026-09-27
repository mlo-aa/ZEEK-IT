// Temporal: se reemplaza al implementar el juego.
export default function BreakApp({ onExit }: { onExit: () => void }) {
  return <button onClick={onExit}>Próximamente</button>
}
