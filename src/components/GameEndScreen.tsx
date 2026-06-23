import { Link } from 'react-router-dom'
import type { MatchResult } from '../types/match'
import type { Player } from '../types/player'
import MatchResultPanel from './MatchResultPanel'
import PlayerImage from './PlayerImage'

interface GameEndScreenProps {
  status: 'team-complete' | 'game-over'
  team: Player[]
  result: MatchResult | null
  onRestart: () => void
}

function GameEndScreen({
  status,
  team,
  result,
  onRestart,
}: GameEndScreenProps) {
  const isComplete = status === 'team-complete'

  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl">
      <header className="text-center">
        <span
          className={`text-xs font-bold uppercase tracking-[0.3em] ${
            isComplete ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isComplete ? 'Objetivo alcançado' : 'Derrota'}
        </span>
        <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight sm:text-6xl">
          {isComplete ? 'Time completo' : 'Projeto encerrado'}
        </h1>
        <p className="mt-4 text-zinc-400">
          {isComplete
            ? 'Seu time de cinco jogadores está formado.'
            : 'Seu ego não sobreviveu a esta seleção.'}
        </p>
      </header>

      {result && (
        <div className="mt-9">
          <MatchResultPanel result={result} />
        </div>
      )}

      <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {team.map((player) => (
          <article
            key={player.id}
            className="overflow-hidden border border-white/10 bg-white/[0.04]"
          >
            <PlayerImage player={player} className="h-32 sm:h-40" />
            <div className="p-3">
              <h2 className="truncate text-sm font-black uppercase italic text-white">
                {player.name}
              </h2>
              <p className="mt-1 truncate text-xs text-zinc-500">
                {player.position}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="bg-blue-600 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
        >
          Tentar novamente
        </button>
        <Link
          to="/"
          className="border border-zinc-700 px-7 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-zinc-300 transition hover:border-blue-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
        >
          Voltar para Home
        </Link>
      </div>
    </section>
  )
}

export default GameEndScreen
