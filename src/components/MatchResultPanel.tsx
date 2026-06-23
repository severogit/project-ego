import type { MatchResult } from '../types/match'
import { getTraitImpactSummary } from '../utils/traits'
import PlayerImage from './PlayerImage'
import SynergyPanel from './SynergyPanel'

interface MatchResultPanelProps {
  result: MatchResult
}

function MatchResultPanel({ result }: MatchResultPanelProps) {
  const orderedStats = [...result.stats].sort(
    (firstPlayer, secondPlayer) =>
      secondPlayer.rating - firstPlayer.rating ||
      secondPlayer.goals - firstPlayer.goals ||
      secondPlayer.assists - firstPlayer.assists,
  )

  return (
    <section className="border border-white/10 bg-black/30 p-5 sm:p-8">
      <div className="text-center">
        <span className="text-xs font-black uppercase tracking-[0.24em] text-blue-400">
          Resultado final
        </span>
        <div className="mt-4 flex items-center justify-center gap-5 sm:gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Seu time
            </p>
            <strong className="mt-1 block text-5xl font-black italic text-white">
              {result.score.player}
            </strong>
          </div>
          <span className="text-2xl font-black text-zinc-700">×</span>
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Rival
            </p>
            <strong className="mt-1 block text-5xl font-black italic text-white">
              {result.score.rival}
            </strong>
          </div>
        </div>
        <p
          className={`mt-5 text-2xl font-black uppercase italic ${
            result.winner === 'player'
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}
        >
          {result.winner === 'player'
            ? 'Seu time venceu'
            : 'O rival venceu'}
        </p>
      </div>

      <article className="mx-auto mt-8 flex max-w-xl items-center gap-5 border border-amber-400/30 bg-amber-400/[0.07] p-4 sm:p-5">
        <PlayerImage
          player={result.mvp.player}
          className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
        />
        <div className="min-w-0">
          <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            MVP da partida
          </span>
          <h3 className="mt-2 truncate text-2xl font-black uppercase italic text-white">
            {result.mvp.player.name}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {result.mvp.side === 'player' ? 'Seu time' : 'Time rival'} · Nota{' '}
            {result.mvp.rating.toFixed(1)}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {result.mvp.goals} gols · {result.mvp.assists} assistências ·{' '}
            {result.mvp.defensiveActions} ações defensivas
          </p>
        </div>
      </article>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="border border-blue-500/25 bg-blue-500/[0.07] p-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-blue-300">
            Seu time
          </h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Poder base</dt>
              <dd className="font-bold text-white">
                {result.playerStrength.basePower}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Força final</dt>
              <dd className="font-bold text-blue-300">
                {result.playerStrength.finalStrength.toFixed(1)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="border border-rose-500/25 bg-rose-500/[0.06] p-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-rose-300">
            Time rival
          </h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Poder base</dt>
              <dd className="font-bold text-white">
                {result.rivalStrength.basePower}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Força final</dt>
              <dd className="font-bold text-rose-300">
                {result.rivalStrength.finalStrength.toFixed(1)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="border border-amber-400/25 bg-amber-400/[0.07] p-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
            FLOW
          </h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Ativado</dt>
              <dd className="font-bold text-white">
                {result.flowActivated ? 'Sim' : 'N\u00e3o'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">
                {'Ativa\u00e7\u00f5es'}
              </dt>
              <dd className="font-bold text-amber-300">
                {result.flowActivations}
              </dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="border border-blue-500/20 bg-blue-500/[0.04] p-5">
          <SynergyPanel
            team={result.playerTeam}
            title="Sinergias do seu time"
          />
        </article>
        <article className="border border-rose-500/20 bg-rose-500/[0.04] p-5">
          <SynergyPanel team={result.rivalTeam} title="Sinergias do rival" />
        </article>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-zinc-500">
              <th className="px-3 py-3 font-bold">Jogador</th>
              <th className="px-3 py-3 font-bold">Time</th>
              <th className="px-3 py-3 font-bold">Trait Impact</th>
              <th className="px-3 py-3 text-center font-bold">Gols</th>
              <th className="px-3 py-3 text-center font-bold">Assist.</th>
              <th className="px-3 py-3 text-center font-bold">Final.</th>
              <th className="px-3 py-3 text-center font-bold">Def.</th>
              <th className="px-3 py-3 text-center font-bold">FLOW</th>
              <th className="px-3 py-3 text-right font-bold">Nota</th>
            </tr>
          </thead>
          <tbody>
            {orderedStats.map((playerStats) => (
              <tr
                key={`${playerStats.side}-${playerStats.player.id}`}
                className="border-b border-white/5 text-sm"
              >
                <td className="px-3 py-3 font-bold text-white">
                  {playerStats.player.name}
                </td>
                <td
                  className={`px-3 py-3 ${
                    playerStats.side === 'player'
                      ? 'text-blue-300'
                      : 'text-rose-300'
                  }`}
                >
                  {playerStats.side === 'player' ? 'Seu time' : 'Rival'}
                </td>
                <td className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-amber-200">
                  {getTraitImpactSummary(playerStats.player)}
                </td>
                <td className="px-3 py-3 text-center text-zinc-300">
                  {playerStats.goals}
                </td>
                <td className="px-3 py-3 text-center text-zinc-300">
                  {playerStats.assists}
                </td>
                <td className="px-3 py-3 text-center text-zinc-300">
                  {playerStats.shots}
                </td>
                <td className="px-3 py-3 text-center text-zinc-300">
                  {playerStats.defensiveActions}
                </td>
                <td className="px-3 py-3 text-center font-bold text-amber-300">
                  {playerStats.flowActivations > 0 ? 'Sim' : '-'}
                </td>
                <td className="px-3 py-3 text-right font-black text-amber-300">
                  {playerStats.rating.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default MatchResultPanel
