import type { MatchPhase } from '../types/game'
import type { Player } from '../types/player'
import { MATCH_PHASE_LABELS } from '../utils/gameFlow'
import PlayerImage from './PlayerImage'
import SynergyPanel from './SynergyPanel'

interface TeamSummaryProps {
  team: Player[]
  rivalTeam: Player[]
  phase: MatchPhase
  onStartMatch: () => void
}

function TeamSummary({
  team,
  rivalTeam,
  phase,
  onStartMatch,
}: TeamSummaryProps) {
  const matchLabel = MATCH_PHASE_LABELS[phase]
  const isKnockout = phase.startsWith('knockout-')

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl">
      <header className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400">
          {isKnockout ? 'Mata-mata' : 'Proximo desafio'}
        </span>
        <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight sm:text-5xl">
          {isKnockout ? matchLabel : `Partida ${matchLabel}`}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Analise identidades, traits e sinergias antes da partida.
        </p>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
            Seu time
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {team.map((player) => (
              <PlayerSummaryCard
                key={player.id}
                player={player}
                tone="player"
              />
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <SynergyPanel team={team} title="Sinergias do seu time" />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">
            Time rival
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {rivalTeam.map((player) => (
              <PlayerSummaryCard
                key={player.id}
                player={player}
                tone="rival"
              />
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <SynergyPanel team={rivalTeam} title="Sinergias do rival" />
          </div>
        </section>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onStartMatch}
          className="bg-emerald-600 px-7 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
        >
          Iniciar {isKnockout ? matchLabel : `partida ${matchLabel}`}
        </button>
      </div>
    </section>
  )
}

function PlayerSummaryCard({
  player,
  tone,
}: {
  player: Player
  tone: 'player' | 'rival'
}) {
  const toneClass =
    tone === 'player'
      ? 'border-blue-500/20 bg-blue-500/[0.05]'
      : 'border-rose-500/20 bg-rose-500/[0.05]'

  return (
    <article className={`overflow-hidden border ${toneClass}`}>
      <PlayerImage player={player} className="h-28 sm:h-32" />
      <div className="border-t border-white/10 p-2.5">
        <h3 className="truncate text-xs font-black uppercase italic">
          {player.name}
        </h3>
        <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
          {player.rarity} / {player.position}
        </p>
        {player.trait && (
          <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.1em] text-amber-300">
            {player.trait.name}
          </p>
        )}
      </div>
    </article>
  )
}

export default TeamSummary
