import type { MatchPhase } from '../types/game'
import type { Player } from '../types/player'
import {
  calculateAttributeAverages,
  calculatePlayerPower,
  calculateTeamPower,
  playerAttributes,
} from '../utils/draft'
import PlayerImage from './PlayerImage'

interface TeamSummaryProps {
  team: Player[]
  rivalTeam: Player[]
  phase: MatchPhase
  onSimulate: () => void
}

const attributeLabels = {
  attack: 'Ataque',
  speed: 'Velocidade',
  vision: 'Visão',
  dribble: 'Drible',
  defense: 'Defesa',
  ego: 'Ego',
}

function TeamSummary({
  team,
  rivalTeam,
  phase,
  onSimulate,
}: TeamSummaryProps) {
  const teamPower = calculateTeamPower(team)
  const averages = calculateAttributeAverages(team)
  const matchLabel = phase === 'match-3v3' ? '3x3' : '4x4'

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl">
      <header className="text-center">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">
          Próximo desafio
        </span>
        <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight sm:text-6xl">
          Partida {matchLabel}
        </h1>
        <p className="mt-4 text-zinc-400">
          Analise os dois times e simule esta partida.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
              Seu time
            </h2>
            <span className="text-sm font-bold text-zinc-500">
              Poder {teamPower}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {team.map((player) => (
              <article
                key={player.id}
                className="overflow-hidden border border-blue-500/20 bg-blue-500/[0.05]"
              >
                <PlayerImage player={player} className="h-32 sm:h-40" />
                <div className="p-3">
                  <h3 className="truncate text-sm font-black uppercase italic">
                    {player.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Poder {calculatePlayerPower(player)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-rose-300">
              Time rival
            </h2>
            <span className="text-sm font-bold text-zinc-500">
              Poder {calculateTeamPower(rivalTeam)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {rivalTeam.map((player) => (
              <article
                key={player.id}
                className="overflow-hidden border border-rose-500/20 bg-rose-500/[0.05]"
              >
                <PlayerImage player={player} className="h-32 sm:h-40" />
                <div className="p-3">
                  <h3 className="truncate text-sm font-black uppercase italic">
                    {player.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Poder {calculatePlayerPower(player)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="flex flex-col justify-center border border-blue-500/30 bg-blue-500/10 p-7 text-center">
          <span className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">
            Poder total
          </span>
          <strong className="mt-3 text-6xl font-black italic text-white">
            {teamPower}
          </strong>
        </article>

        <article className="border border-white/10 bg-white/[0.04] p-7">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-300">
            Média dos atributos
          </h2>
          <dl className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {playerAttributes.map((attribute) => (
              <div key={attribute}>
                <dt className="text-xs uppercase tracking-wider text-zinc-500">
                  {attributeLabels[attribute]}
                </dt>
                <dd className="mt-1 text-2xl font-black text-white">
                  {averages[attribute].toFixed(1)}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onSimulate}
          className="bg-emerald-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
        >
          Simular partida {matchLabel}
        </button>
      </div>
    </section>
  )
}

export default TeamSummary
