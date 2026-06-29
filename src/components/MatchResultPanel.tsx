import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  MatchResult,
  MatchSide,
  PlayerMatchDevStats,
  PlayerMatchStats,
} from '../types/match'
import type { Player } from '../types/player'
import { DEV_MODE } from '../utils/devMode'
import { MATCH_CONFIG } from '../utils/match'
import {
  getMatchDebugPayload,
  logMatchDebugResult,
} from '../utils/matchDebug'
import {
  getActiveSynergies,
  getActiveUniqueSynergies,
  type TeamSynergy,
} from '../utils/synergies'
import { getTraitImpactSummary } from '../utils/traits'
import Icon from './Icon'
import PlayerImage from './PlayerImage'
import SynergyPanel from './SynergyPanel'

interface MatchResultPanelProps {
  result: MatchResult
}

interface SynergyImpactStats {
  id: string
  name: string
  side: MatchSide
  activations: number
}

interface SimulationParticipationRow {
  playerStats: PlayerMatchStats
  devStats: PlayerMatchDevStats
  averageFinisherWeight: number
  averageAssistantWeight: number
  averageDefensiveWeight: number
  insights: string[]
}

const EMPTY_DEV_STATS: PlayerMatchDevStats = {
  offensiveCandidateCount: 0,
  finisherSelectedCount: 0,
  assistantCandidateCount: 0,
  assistantSelectedCount: 0,
  defensiveCandidateCount: 0,
  defensiveSelectedCount: 0,
  totalFinisherWeight: 0,
  totalAssistantWeight: 0,
  totalDefensiveWeight: 0,
}

function getPlayerStatsKey(side: MatchSide, playerId: number): string {
  return `${side}-${playerId}`
}

function descriptionBelongsToPlayer(
  description: string,
  player: Player,
): boolean {
  return description.toLowerCase().includes(player.name.toLowerCase())
}

function getTraitProcCounts(result: MatchResult): Map<string, number> {
  const counts = new Map<string, number>()

  for (const event of result.events) {
    if (!event.traitImpactDescription) {
      continue
    }

    const eventPlayer = result.stats.find(
      (playerStats) =>
        playerStats.side === event.side &&
        playerStats.player.id === event.playerId,
    )
    const assistPlayer = event.assistPlayerId
      ? result.stats.find(
          (playerStats) =>
            playerStats.side === event.side &&
            playerStats.player.id === event.assistPlayerId,
        )
      : undefined
    const candidateStats = [eventPlayer, assistPlayer].filter(
      (playerStats): playerStats is PlayerMatchStats =>
        Boolean(playerStats),
    )
    const impactedStats =
      candidateStats.find((playerStats) =>
        descriptionBelongsToPlayer(
          event.traitImpactDescription ?? '',
          playerStats.player,
        ),
      ) ??
      eventPlayer ??
      assistPlayer

    if (!impactedStats) {
      continue
    }

    const statsKey = getPlayerStatsKey(
      impactedStats.side,
      impactedStats.player.id,
    )

    counts.set(statsKey, (counts.get(statsKey) ?? 0) + 1)
  }

  return counts
}

function getActiveMatchSynergies(
  result: MatchResult,
): Array<TeamSynergy & { side: MatchSide }> {
  return [
    ...getActiveSynergies(result.playerTeam).map((synergy) => ({
      ...synergy,
      side: 'player' as const,
    })),
    ...getActiveUniqueSynergies(result.playerTeam).map((synergy) => ({
      ...synergy,
      side: 'player' as const,
    })),
    ...getActiveSynergies(result.rivalTeam).map((synergy) => ({
      ...synergy,
      side: 'rival' as const,
    })),
    ...getActiveUniqueSynergies(result.rivalTeam).map((synergy) => ({
      ...synergy,
      side: 'rival' as const,
    })),
  ]
}

function getSynergyImpactStats(result: MatchResult): SynergyImpactStats[] {
  const activeSynergies = getActiveMatchSynergies(result)
  const counts = new Map<string, number>()

  for (const event of result.events) {
    if (!event.synergyImpactDescription) {
      continue
    }

    const impactedSynergy = activeSynergies.find(
      (synergy) =>
        synergy.side === event.side &&
        event.synergyImpactDescription?.startsWith(synergy.name),
    )

    if (!impactedSynergy) {
      continue
    }

    const synergyKey = `${impactedSynergy.side}-${impactedSynergy.id}`

    counts.set(synergyKey, (counts.get(synergyKey) ?? 0) + 1)
  }

  return activeSynergies.map((synergy) => {
    const synergyKey = `${synergy.side}-${synergy.id}`

    return {
      id: synergy.id,
      name: synergy.name,
      side: synergy.side,
      activations: counts.get(synergyKey) ?? 0,
    }
  })
}

function formatActivationCount(activations: number): string {
  return `${activations} ${
    activations === 1 ? 'ativação' : 'ativações'
  }`
}

function getAverageWeight(totalWeight: number, count: number): number {
  return count > 0 ? totalWeight / count : 0
}

function formatAverageWeight(weight: number): string {
  return weight > 0 ? weight.toFixed(1) : '-'
}

function getSimulationInsightLabels(
  devStats: PlayerMatchDevStats,
  averageFinisherWeight: number,
  matchAverageFinisherWeight: number,
): string[] {
  const insights: string[] = []
  const finisherSelectionRate =
    devStats.offensiveCandidateCount > 0
      ? devStats.finisherSelectedCount / devStats.offensiveCandidateCount
      : 0

  if (
    devStats.offensiveCandidateCount >= 4 &&
    finisherSelectionRate < 0.35
  ) {
    insights.push('Considerado muito, selecionado pouco')
  }

  if (devStats.offensiveCandidateCount <= 1) {
    insights.push('Pouco envolvido ofensivamente')
  }

  if (
    averageFinisherWeight > 0 &&
    averageFinisherWeight >= matchAverageFinisherWeight * 1.15
  ) {
    insights.push('Alta prioridade ofensiva')
  }

  if (
    devStats.defensiveCandidateCount >= 3 &&
    devStats.defensiveSelectedCount >= 2
  ) {
    insights.push('Muito ativo defensivamente')
  }

  return insights
}

function getSimulationParticipationRows(
  stats: PlayerMatchStats[],
): SimulationParticipationRow[] {
  const totalFinisherWeight = stats.reduce(
    (total, playerStats) =>
      total + (playerStats.dev?.totalFinisherWeight ?? 0),
    0,
  )
  const totalOffensiveCandidates = stats.reduce(
    (total, playerStats) =>
      total + (playerStats.dev?.offensiveCandidateCount ?? 0),
    0,
  )
  const matchAverageFinisherWeight = getAverageWeight(
    totalFinisherWeight,
    totalOffensiveCandidates,
  )

  return stats.map((playerStats) => {
    const devStats = playerStats.dev ?? EMPTY_DEV_STATS
    const averageFinisherWeight = getAverageWeight(
      devStats.totalFinisherWeight,
      devStats.offensiveCandidateCount,
    )
    const averageAssistantWeight = getAverageWeight(
      devStats.totalAssistantWeight,
      devStats.assistantCandidateCount,
    )
    const averageDefensiveWeight = getAverageWeight(
      devStats.totalDefensiveWeight,
      devStats.defensiveCandidateCount,
    )

    return {
      playerStats,
      devStats,
      averageFinisherWeight,
      averageAssistantWeight,
      averageDefensiveWeight,
      insights: getSimulationInsightLabels(
        devStats,
        averageFinisherWeight,
        matchAverageFinisherWeight,
      ),
    }
  })
}

async function copyTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    const textarea = document.createElement('textarea')

    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.select()

    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

function MatchResultPanel({ result }: MatchResultPanelProps) {
  const [copyDebugFeedback, setCopyDebugFeedback] = useState(false)
  const copyFeedbackTimerRef = useRef<number | null>(null)
  const matchDebugPayload = useMemo(
    () =>
      DEV_MODE
        ? getMatchDebugPayload(result, {
            matchDurationMs: result.durationMs,
            mvpFlowTieBreakBonus: MATCH_CONFIG.flow.mvpTieBreakBonus,
          })
        : undefined,
    [result],
  )

  useEffect(() => {
    logMatchDebugResult(result, {
      matchDurationMs: result.durationMs,
      mvpFlowTieBreakBonus: MATCH_CONFIG.flow.mvpTieBreakBonus,
    })
  }, [result])

  useEffect(
    () => () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current)
      }
    },
    [],
  )

  async function handleCopyDebugJson() {
    if (!matchDebugPayload) {
      return
    }

    await copyTextToClipboard(matchDebugPayload.json)
    setCopyDebugFeedback(true)

    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current)
    }

    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopyDebugFeedback(false)
      copyFeedbackTimerRef.current = null
    }, 1600)
  }

  const orderedStats = [...result.stats].sort(
    (firstPlayer, secondPlayer) =>
      secondPlayer.rating - firstPlayer.rating ||
      secondPlayer.goals - firstPlayer.goals ||
      secondPlayer.assists - firstPlayer.assists,
  )
  const traitProcCounts = DEV_MODE ? getTraitProcCounts(result) : undefined
  const synergyImpactStats = DEV_MODE
    ? getSynergyImpactStats(result)
    : undefined
  const simulationParticipationRows = DEV_MODE
    ? getSimulationParticipationRows(orderedStats)
    : undefined
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

      <div className="mx-auto mt-8 max-w-md">
        <article className="border border-amber-400/25 bg-amber-400/[0.07] p-5">
          <h3 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-300">
            <Icon name="zap" className="h-4 w-4" />
            FLOW
          </h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Ativado</dt>
              <dd className="font-bold text-white">
                {result.flowActivated ? 'Sim' : 'Não'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Ativações</dt>
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
        <table
          className={`w-full table-fixed border-collapse text-left ${
            DEV_MODE ? 'min-w-[980px]' : 'min-w-[860px]'
          }`}
        >
          <thead>
            <tr className="border-b border-white/10 text-[9px] uppercase tracking-wider text-zinc-500">
              <th className="w-[18%] px-2 py-2 font-bold">Jogador</th>
              <th className="w-[9%] px-2 py-2 font-bold">Time</th>
              <th className="w-[20%] px-2 py-2 font-bold">Trait Impact</th>
              <th className="w-[6%] px-2 py-2 text-center font-bold">Gols</th>
              <th className="w-[7%] px-2 py-2 text-center font-bold">Assist.</th>
              {DEV_MODE && (
                <th className="w-[9%] px-2 py-2 text-center font-bold">
                  Participações
                </th>
              )}
              <th className="w-[6%] px-2 py-2 text-center font-bold">Final.</th>
              <th className="w-[6%] px-2 py-2 text-center font-bold">Def.</th>
              <th className="w-[6%] px-2 py-2 text-center font-bold">
                {DEV_MODE ? 'FLOWS' : 'FLOW'}
              </th>
              {DEV_MODE && (
                <th className="w-[8%] px-2 py-2 text-center font-bold">
                  Trait Proc
                </th>
              )}
              <th className="w-[6%] px-2 py-2 text-right font-bold">Nota</th>
            </tr>
          </thead>
          <tbody>
            {orderedStats.map((playerStats) => (
              <tr
                key={`${playerStats.side}-${playerStats.player.id}`}
                className="border-b border-white/5 text-xs"
              >
                <td className="truncate px-2 py-2 font-bold text-white">
                  {playerStats.player.name}
                </td>
                <td
                  className={`px-2 py-2 ${
                    playerStats.side === 'player'
                      ? 'text-blue-300'
                      : 'text-rose-300'
                  }`}
                >
                  {playerStats.side === 'player' ? 'Seu time' : 'Rival'}
                </td>
                <td className="truncate px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-amber-200">
                  {getTraitImpactSummary(playerStats.player)}
                </td>
                <td className="px-2 py-2 text-center text-zinc-300">
                  {playerStats.goals}
                </td>
                <td className="px-2 py-2 text-center text-zinc-300">
                  {playerStats.assists}
                </td>
                {DEV_MODE && (
                  <td className="px-2 py-2 text-center font-bold text-cyan-200">
                    {playerStats.goals + playerStats.assists}
                  </td>
                )}
                <td className="px-2 py-2 text-center text-zinc-300">
                  {playerStats.shots}
                </td>
                <td className="px-2 py-2 text-center text-zinc-300">
                  {playerStats.defensiveActions}
                </td>
                <td className="px-2 py-2 text-center font-bold text-amber-300">
                  {DEV_MODE
                    ? playerStats.flowActivations
                    : playerStats.flowActivations > 0
                      ? 'Sim'
                      : '-'}
                </td>
                {DEV_MODE && (
                  <td className="px-2 py-2 text-center font-bold text-amber-200">
                    {traitProcCounts?.get(
                      getPlayerStatsKey(
                        playerStats.side,
                        playerStats.player.id,
                      ),
                    ) ?? 0}
                  </td>
                )}
                <td className="px-2 py-2 text-right font-black text-amber-300">
                  {playerStats.rating.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {DEV_MODE && simulationParticipationRows && (
        <details
          open
          className="mt-8 border border-cyan-300/20 bg-cyan-300/[0.04] p-5"
        >
          <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
            DEV - Participação na Simulação
          </summary>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {simulationParticipationRows.map((row) => (
              <article
                key={`${row.playerStats.side}-${row.playerStats.player.id}`}
                className="border border-white/10 bg-black/20 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black uppercase italic text-white">
                      {row.playerStats.player.name}
                    </h4>
                    <p
                      className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${
                        row.playerStats.side === 'player'
                          ? 'text-blue-300'
                          : 'text-rose-300'
                      }`}
                    >
                      {row.playerStats.side === 'player'
                        ? 'Seu time'
                        : 'Rival'}
                    </p>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Cand. Fin.
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {row.devStats.offensiveCandidateCount}
                    </dd>
                  </div>
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Sel. Fin.
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {row.devStats.finisherSelectedCount}
                    </dd>
                  </div>
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Peso Fin.
                    </dt>
                    <dd className="mt-1 font-black text-cyan-100">
                      {formatAverageWeight(row.averageFinisherWeight)}
                    </dd>
                  </div>
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Cand. Assist.
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {row.devStats.assistantCandidateCount}
                    </dd>
                  </div>
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Sel. Assist.
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {row.devStats.assistantSelectedCount}
                    </dd>
                  </div>
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Peso Assist.
                    </dt>
                    <dd className="mt-1 font-black text-cyan-100">
                      {formatAverageWeight(row.averageAssistantWeight)}
                    </dd>
                  </div>
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Cand. Def.
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {row.devStats.defensiveCandidateCount}
                    </dd>
                  </div>
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Sel. Def.
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {row.devStats.defensiveSelectedCount}
                    </dd>
                  </div>
                  <div className="border border-white/5 bg-white/[0.03] p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Peso Def.
                    </dt>
                    <dd className="mt-1 font-black text-cyan-100">
                      {formatAverageWeight(row.averageDefensiveWeight)}
                    </dd>
                  </div>
                </dl>

                {row.insights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.insights.map((insight) => (
                      <span
                        key={insight}
                        className="border border-amber-300/20 bg-amber-300/[0.08] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100"
                      >
                        {insight}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </details>
      )}

      {DEV_MODE && (
        <section className="mt-8 border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
              DEV
            </h3>
            <button
              type="button"
              onClick={handleCopyDebugJson}
              disabled={!matchDebugPayload}
              className="border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-2 text-[11px] font-black uppercase tracking-wider text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copyDebugFeedback ? 'Copiado!' : 'Copiar Debug JSON'}
            </button>
          </div>
          <div className="mt-5">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
              Sinergias ativadas
            </h4>
            {synergyImpactStats && synergyImpactStats.length > 0 ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {synergyImpactStats.map((synergyStats) => (
                  <li
                    key={`${synergyStats.side}-${synergyStats.id}`}
                    className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-white">
                        {synergyStats.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          synergyStats.side === 'player'
                            ? 'text-blue-300'
                            : 'text-rose-300'
                        }`}
                      >
                        {synergyStats.side === 'player'
                          ? 'Seu time'
                          : 'Rival'}
                      </span>
                    </span>
                    <span className="shrink-0 font-black text-cyan-100">
                      {formatActivationCount(synergyStats.activations)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                Nenhuma sinergia ativada.
              </p>
            )}
          </div>
        </section>
      )}
    </section>
  )
}

export default MatchResultPanel
