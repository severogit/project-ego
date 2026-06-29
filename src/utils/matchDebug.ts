import type {
  MatchResult,
  MatchSide,
  PlayerMatchDevStats,
  PlayerMatchStats,
} from '../types/match'
import type { Player, Rarity } from '../types/player'
import { DEV_MODE } from './devMode.ts'
import {
  calculateAttributeAverages,
  playerAttributes,
} from './draft.ts'
import {
  getActiveSynergies,
  getActiveUniqueSynergies,
  type SynergyEffectKey,
  type TeamSynergy,
} from './synergies.ts'
import {
  getTraitImpactSummary,
  getTraitModifiers,
} from './traits.ts'

export interface SynergyImpactStats {
  id: string
  name: string
  side: MatchSide
  activations: number
  bonusApplied: boolean
  affectedStats: SynergyEffectKey[]
}

export interface SimulationParticipationRow {
  playerStats: PlayerMatchStats
  devStats: PlayerMatchDevStats
  averageFinisherWeight: number
  averageAssistantWeight: number
  averageDefensiveWeight: number
  insights: string[]
}

interface MatchDebugPlayerData {
  name: string
  rarity: Rarity
  position: string
  archetypes: string[]
  rating: number
  goals: number
  assists: number
  participations: number
  shots: number
  defensiveActions: number
  flowActivations: number
  traitActivations: number
  traitImpact: string
  candidateFin: number
  selectedFin: number
  shotWeight: number | null
  candidateAssist: number
  selectedAssist: number
  assistWeight: number | null
  candidateDef: number
  selectedDef: number
  defensiveWeight: number | null
  insights: string[]
  rawDevStats: PlayerMatchDevStats
}

interface MatchDebugTraitData {
  team: string
  player: string
  traitName: string
  activations: number
  summary: string
  modifiers: Record<string, number>
}

interface MatchDebugSynergyData {
  team: string
  synergy: string
  activations: number
  bonusApplied: boolean
  affectedStats: SynergyEffectKey[]
}

interface MatchDebugFlowData {
  totalActivations: number
  activatedBy: Array<{
    player: string
    activations: number
  }>
}

interface MatchDebugSideData {
  label: string
  strength: {
    basePower: number
    averageEgo: number
    randomFactor: number
    clutchBonus: number
    upsetBonus: number
    finalStrength: number
  }
  players: MatchDebugPlayerData[]
  traits: MatchDebugTraitData[]
  synergies: MatchDebugSynergyData[]
  flow: MatchDebugFlowData
}

interface MatchDebugTeamCompositionData {
  Common: number
  Rare: number
  Epic: number
  Legendary: number
  Egoist: number
  averageAttack: number
  averageSpeed: number
  averageVision: number
  averageDribble: number
  averageDefense: number
  averageEgo: number
  averageOverall: number
}

export interface MatchDebugData {
  score: {
    home: number
    away: number
  }
  winner: string
  winnerSide: MatchSide
  mvp: {
    name: string
    side: string
    rating: number
    goals: number
    assists: number
    defensiveActions: number
    flowActivations: number
    scoreBreakdown: {
      goals: number
      assists: number
      defense: number
      flowBonus: number
      final: number
    }
  }
  duration: string
  durationMs: number
  eventCount: number
  upsetOccurred: boolean
  flowActivated: boolean
  flowActivations: number
  home: MatchDebugSideData
  away: MatchDebugSideData
  teamComposition: {
    home: MatchDebugTeamCompositionData
    away: MatchDebugTeamCompositionData
  }
  traits: MatchDebugTraitData[]
  synergies: MatchDebugSynergyData[]
  flow: {
    home: MatchDebugFlowData
    away: MatchDebugFlowData
    totalActivations: number
  }
  events: Array<{
    id: number
    type: string
    side: string
    player: string
    assist?: string
    scoreAfter: {
      home: number
      away: number
    }
    traitImpact?: string
    synergyImpact?: string
    description: string
  }>
}

interface MatchDebugLogOptions {
  matchDurationMs: number
  mvpFlowTieBreakBonus: number
}

export interface MatchDebugPayload {
  data: MatchDebugData
  json: string
}

type MatchDebugGlobal = typeof globalThis & {
  __PROJECT_EGO_LAST_MATCH_DEBUG?: MatchDebugData
  __PROJECT_EGO_MATCH_DEBUG_JSON?: string
  __PROJECT_EGO_PRINT_MATCH_DEBUG?: () => string
}

const matchDebugPayloads = new WeakMap<MatchResult, MatchDebugPayload>()
const loggedMatchDebugResults = new WeakSet<MatchResult>()

export const MVP_SCORING = {
  goal: 1.35,
  assist: 0.8,
  defense: 0.35,
} as const

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

const RARITIES: Rarity[] = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
  'Egoist',
]

export function getPlayerStatsKey(
  side: MatchSide,
  playerId: number,
): string {
  return `${side}-${playerId}`
}

function descriptionBelongsToPlayer(
  description: string,
  player: Player,
): boolean {
  return description.toLowerCase().includes(player.name.toLowerCase())
}

export function getTraitProcCounts(
  result: MatchResult,
): Map<string, number> {
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

function getSynergyAffectedStats(
  synergy: TeamSynergy,
): SynergyEffectKey[] {
  return Object.entries(synergy.effects)
    .filter(([, bonus]) => (bonus ?? 0) > 0)
    .map(([effectKey]) => effectKey as SynergyEffectKey)
}

export function getSynergyImpactStats(
  result: MatchResult,
): SynergyImpactStats[] {
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
      bonusApplied: getSynergyAffectedStats(synergy).length > 0,
      affectedStats: getSynergyAffectedStats(synergy),
    }
  })
}

export function formatActivationCount(activations: number): string {
  return `${activations} ${
    activations === 1 ? 'ativacao' : 'ativacoes'
  }`
}

function getAverageWeight(totalWeight: number, count: number): number {
  return count > 0 ? totalWeight / count : 0
}

export function formatAverageWeight(weight: number): string {
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

export function getSimulationParticipationRows(
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

function getSideLabel(side: MatchSide): string {
  return side === 'player' ? 'Home Team' : 'Away Team'
}

export function formatMatchDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

function getDebugWeight(weight: number): number | null {
  return weight > 0 ? Number(weight.toFixed(1)) : null
}

function getStrengthDebugData(result: MatchResult, side: MatchSide) {
  const strength =
    side === 'player' ? result.playerStrength : result.rivalStrength

  return {
    basePower: strength.basePower,
    averageEgo: Number(strength.averageEgo.toFixed(2)),
    randomFactor: Number(strength.randomFactor.toFixed(3)),
    clutchBonus: Number(strength.clutchBonus.toFixed(2)),
    upsetBonus: Number(strength.upsetBonus.toFixed(2)),
    finalStrength: Number(strength.finalStrength.toFixed(2)),
  }
}

function getRoundedDebugNumber(value: number): number {
  return Number(value.toFixed(2))
}

function getTeamCompositionDebugData(
  team: Player[],
): MatchDebugTeamCompositionData {
  const rarityCounts = RARITIES.reduce(
    (counts, rarity) => ({
      ...counts,
      [rarity]: team.filter((player) => player.rarity === rarity).length,
    }),
    {
      Common: 0,
      Rare: 0,
      Epic: 0,
      Legendary: 0,
      Egoist: 0,
    } satisfies Record<Rarity, number>,
  )
  const averages = calculateAttributeAverages(team)
  const averageOverall =
    playerAttributes.reduce(
      (total, attribute) => total + averages[attribute],
      0,
    ) / playerAttributes.length

  return {
    Common: rarityCounts.Common,
    Rare: rarityCounts.Rare,
    Epic: rarityCounts.Epic,
    Legendary: rarityCounts.Legendary,
    Egoist: rarityCounts.Egoist,
    averageAttack: getRoundedDebugNumber(averages.attack),
    averageSpeed: getRoundedDebugNumber(averages.speed),
    averageVision: getRoundedDebugNumber(averages.vision),
    averageDribble: getRoundedDebugNumber(averages.dribble),
    averageDefense: getRoundedDebugNumber(averages.defense),
    averageEgo: getRoundedDebugNumber(averages.ego),
    averageOverall: getRoundedDebugNumber(averageOverall),
  }
}

function getTraitModifierDebugData(
  player: Player,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(getTraitModifiers(player))
      .filter(([, modifier]) => modifier !== 1)
      .map(([modifier, value]) => [
        modifier,
        getRoundedDebugNumber(value),
      ]),
  )
}

function getPlayerDebugData(
  rows: SimulationParticipationRow[],
  side: MatchSide,
  traitProcCounts: Map<string, number>,
): MatchDebugPlayerData[] {
  return rows
    .filter((row) => row.playerStats.side === side)
    .map((row) => {
      const statsKey = getPlayerStatsKey(
        row.playerStats.side,
        row.playerStats.player.id,
      )

      return {
        name: row.playerStats.player.name,
        rarity: row.playerStats.player.rarity,
        position: row.playerStats.player.position,
        archetypes: row.playerStats.player.archetypes ?? [],
        rating: Number(row.playerStats.rating.toFixed(1)),
        goals: row.playerStats.goals,
        assists: row.playerStats.assists,
        participations: row.playerStats.goals + row.playerStats.assists,
        shots: row.playerStats.shots,
        defensiveActions: row.playerStats.defensiveActions,
        flowActivations: row.playerStats.flowActivations,
        traitActivations: traitProcCounts.get(statsKey) ?? 0,
        traitImpact: getTraitImpactSummary(row.playerStats.player),
        candidateFin: row.devStats.offensiveCandidateCount,
        selectedFin: row.devStats.finisherSelectedCount,
        shotWeight: getDebugWeight(row.averageFinisherWeight),
        candidateAssist: row.devStats.assistantCandidateCount,
        selectedAssist: row.devStats.assistantSelectedCount,
        assistWeight: getDebugWeight(row.averageAssistantWeight),
        candidateDef: row.devStats.defensiveCandidateCount,
        selectedDef: row.devStats.defensiveSelectedCount,
        defensiveWeight: getDebugWeight(row.averageDefensiveWeight),
        insights: row.insights,
        rawDevStats: row.devStats,
      }
    })
}

function getTraitDebugData(
  stats: PlayerMatchStats[],
  side: MatchSide,
  traitProcCounts: Map<string, number>,
): MatchDebugTraitData[] {
  return stats
    .filter((playerStats) => playerStats.side === side)
    .filter((playerStats) => playerStats.player.trait)
    .map((playerStats) => {
      const statsKey = getPlayerStatsKey(
        playerStats.side,
        playerStats.player.id,
      )

      return {
        team: getSideLabel(side),
        player: playerStats.player.name,
        traitName: playerStats.player.trait?.name ?? '-',
        activations: traitProcCounts.get(statsKey) ?? 0,
        summary: getTraitImpactSummary(playerStats.player),
        modifiers: getTraitModifierDebugData(playerStats.player),
      }
    })
}

function getSynergyDebugData(
  synergyImpactStats: SynergyImpactStats[],
  side: MatchSide,
): MatchDebugSynergyData[] {
  return synergyImpactStats
    .filter((synergyStats) => synergyStats.side === side)
    .map((synergyStats) => ({
      team: getSideLabel(side),
      synergy: synergyStats.name,
      activations: synergyStats.activations,
      bonusApplied: synergyStats.bonusApplied,
      affectedStats: synergyStats.affectedStats,
    }))
}

function getFlowDebugData(
  stats: PlayerMatchStats[],
  side: MatchSide,
): MatchDebugFlowData {
  const activatedBy = stats
    .filter((playerStats) => playerStats.side === side)
    .filter((playerStats) => playerStats.flowActivations > 0)
    .map((playerStats) => ({
      player: playerStats.player.name,
      activations: playerStats.flowActivations,
    }))

  return {
    totalActivations: activatedBy.reduce(
      (total, playerFlow) => total + playerFlow.activations,
      0,
    ),
    activatedBy,
  }
}

function createMatchDebugSideData(
  result: MatchResult,
  rows: SimulationParticipationRow[],
  side: MatchSide,
  traitProcCounts: Map<string, number>,
  synergyImpactStats: SynergyImpactStats[],
): MatchDebugSideData {
  return {
    label: getSideLabel(side),
    strength: getStrengthDebugData(result, side),
    players: getPlayerDebugData(rows, side, traitProcCounts),
    traits: getTraitDebugData(result.stats, side, traitProcCounts),
    synergies: getSynergyDebugData(synergyImpactStats, side),
    flow: getFlowDebugData(result.stats, side),
  }
}

export function createMatchDebugData(
  result: MatchResult,
  options: MatchDebugLogOptions,
): MatchDebugData {
  const durationMs = Math.max(0, Math.round(options.matchDurationMs))
  const traitProcCounts = getTraitProcCounts(result)
  const synergyImpactStats = getSynergyImpactStats(result)
  const orderedStats = [...result.stats].sort(
    (firstPlayer, secondPlayer) =>
      secondPlayer.rating - firstPlayer.rating ||
      secondPlayer.goals - firstPlayer.goals ||
      secondPlayer.assists - firstPlayer.assists,
  )
  const rows = getSimulationParticipationRows(orderedStats)
  const home = createMatchDebugSideData(
    result,
    rows,
    'player',
    traitProcCounts,
    synergyImpactStats,
  )
  const away = createMatchDebugSideData(
    result,
    rows,
    'rival',
    traitProcCounts,
    synergyImpactStats,
  )

  return {
    score: {
      home: result.score.player,
      away: result.score.rival,
    },
    winner: getSideLabel(result.winner),
    winnerSide: result.winner,
    mvp: {
      name: result.mvp.player.name,
      side: getSideLabel(result.mvp.side),
      rating: Number(result.mvp.rating.toFixed(1)),
      goals: result.mvp.goals,
      assists: result.mvp.assists,
      defensiveActions: result.mvp.defensiveActions,
      flowActivations: result.mvp.flowActivations,
      scoreBreakdown: {
        goals: Number((result.mvp.goals * MVP_SCORING.goal).toFixed(2)),
        assists: Number(
          (result.mvp.assists * MVP_SCORING.assist).toFixed(2),
        ),
        defense: Number(
          (result.mvp.defensiveActions * MVP_SCORING.defense).toFixed(2),
        ),
        flowBonus: Number(
          (
            result.mvp.flowActivations * options.mvpFlowTieBreakBonus
          ).toFixed(2),
        ),
        final: Number(result.mvp.rating.toFixed(2)),
      },
    },
    duration: formatMatchDuration(durationMs),
    durationMs,
    eventCount: result.events.length,
    upsetOccurred: result.upsetOccurred,
    flowActivated: result.flowActivated,
    flowActivations: result.flowActivations,
    home,
    away,
    teamComposition: {
      home: getTeamCompositionDebugData(result.playerTeam),
      away: getTeamCompositionDebugData(result.rivalTeam),
    },
    traits: [...home.traits, ...away.traits],
    synergies: [...home.synergies, ...away.synergies],
    flow: {
      home: home.flow,
      away: away.flow,
      totalActivations: result.flowActivations,
    },
    events: result.events.map((event) => ({
      id: event.id,
      type: event.type,
      side: getSideLabel(event.side),
      player: event.playerName,
      assist: event.assistPlayerName,
      scoreAfter: {
        home: event.scoreAfter.player,
        away: event.scoreAfter.rival,
      },
      traitImpact: event.traitImpactDescription,
      synergyImpact: event.synergyImpactDescription,
      description: event.description,
    })),
  }
}

export function getMatchDebugPayload(
  result: MatchResult,
  options: MatchDebugLogOptions,
): MatchDebugPayload {
  const existingPayload = matchDebugPayloads.get(result)

  if (existingPayload) {
    return existingPayload
  }

  const data = createMatchDebugData(result, options)
  const payload = {
    data,
    json: JSON.stringify(data, null, 2),
  }

  matchDebugPayloads.set(result, payload)

  return payload
}

export function logMatchDebugData(
  matchDebugData: MatchDebugData,
  matchDebugJson = JSON.stringify(matchDebugData, null, 2),
): void {
  if (!DEV_MODE) {
    return
  }

  const debugGlobal = globalThis as MatchDebugGlobal
  const emitLog = () => {
    const debugConsole = debugGlobal.console

    try {
      debugConsole.groupCollapsed('⚽ MATCH DEBUG')
      debugConsole.log(matchDebugJson)
    } finally {
      debugConsole.groupEnd()
    }

    return matchDebugJson
  }

  debugGlobal.__PROJECT_EGO_LAST_MATCH_DEBUG = matchDebugData
  debugGlobal.__PROJECT_EGO_MATCH_DEBUG_JSON = matchDebugJson
  debugGlobal.__PROJECT_EGO_PRINT_MATCH_DEBUG = emitLog
  window.setTimeout(() => {
    emitLog()
  }, 0)
}

export function logMatchDebugResult(
  result: MatchResult,
  options: MatchDebugLogOptions,
): MatchDebugPayload | undefined {
  if (!DEV_MODE) {
    return undefined
  }

  const payload = getMatchDebugPayload(result, options)

  if (loggedMatchDebugResults.has(result)) {
    return payload
  }

  loggedMatchDebugResults.add(result)
  logMatchDebugData(payload.data, payload.json)

  return payload
}
