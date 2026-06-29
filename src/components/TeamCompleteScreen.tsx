import type { Player } from '../types/player'
import PlayerImage from './PlayerImage'

interface TeamCompleteScreenProps {
  team: Player[]
  onEnterKnockout: () => void
}

function TeamCompleteScreen({
  team,
  onEnterKnockout,
}: TeamCompleteScreenProps) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl">
      <header className="text-center">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
          Formação concluída
        </span>
        <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight sm:text-6xl">
          Time completo
        </h1>
        <p className="mt-4 text-zinc-400">
          Seus cinco egoístas estão prontos para o mata-mata.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {team.map((player) => (
          <article
            key={player.id}
            className="overflow-hidden border border-emerald-500/20 bg-emerald-500/[0.05]"
          >
            <PlayerImage player={player} className="h-36 sm:h-44" />
            <div className="p-3">
              <h2 className="truncate text-sm font-black uppercase italic">
                {player.name}
              </h2>
              <p className="mt-1 truncate text-xs text-zinc-500">
                {player.position}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onEnterKnockout}
          className="bg-emerald-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
        >
          Entrar no Mata-Mata
        </button>
      </div>
    </section>
  )
}

export default TeamCompleteScreen
