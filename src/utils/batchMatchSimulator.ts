import { players as defaultPlayerPool } from '../data/players.ts'
import type {
  MatchResult,
  MatchSide,
  PlayerMatchStats,
  TeamMatchStrength,
} from '../types/match'
import type { Player, Rarity } from '../types/player'
import { drawWeightedPlayers } from './draft.ts'
import {
  MATCH_CONFIG,
  simulateMatch,
  type RandomGenerator,
} from './match.ts'
import {
  formatMatchDuration,
  getSynergyImpactStats,
  getTraitProcCounts,
  getPlayerStatsKey,
} from './matchDebug.ts'
import {
  getActiveSynergies,
  getActiveUniqueSynergies,
  SYNERGY_DEFINITIONS,
  UNIQUE_SYNERGY_DEFINITIONS,
} from './synergies.ts'

export type BatchReportSaveStatus =
  | 'dev-server'
  | 'download'
  | 'unavailable'
  | 'failed'

export type BatchBalanceAlertType =
  | 'HIGH_GOAL_RATE'
  | 'HIGH_ASSIST_RATE'
  | 'HIGH_DEFENSIVE_RATE'
  | 'HIGH_MVP_RATE'
  | 'LOW_PARTICIPATION'
  | 'LOW_FLOW_RATE'
  | 'HIGH_FLOW_RATE'
  | 'LOW_TRAIT_USAGE'
  | 'HIGH_TRAIT_USAGE'
  | 'LOW_SYNERGY_USAGE'
  | 'HIGH_SYNERGY_USAGE'
  | 'HIGH_UPSET_RATE'
  | 'LOW_UPSET_RATE'

type BatchSide = 'home' | 'away'
export type BatchSimulationMode = 'random' | 'balanced' | 'focused'

type HomeAwayDistribution = Record<string, { home: number; away: number }>
type NamedCountDistribution = Record<string, Record<string, number>>
type RarityCountDistribution = Record<Rarity, number>
type MatchesPerPlayerDistribution = Record<string, number>

interface PlayerRarityDistribution {
  teammates: RarityCountDistribution
  opponents: RarityCountDistribution
}

type PlayerRarityDistributionReport = Record<
  string,
  PlayerRarityDistribution
>

interface FocusedPlayerReport {
  id: number
  name: string
}

interface PlayerDistributionReport {
  averageMatchesPerPlayer: number
  minMatches: number
  maxMatches: number
  difference: number
  matchesPerPlayer: MatchesPerPlayerDistribution
}

interface NormalizedBatchSimulationInput {
  matchCount: number
  options: BatchMatchSimulationOptions
}

interface FinalizeBatchReportOptions
  extends Pick<
    BatchMatchSimulationOptions,
    'randomSeed' | 'simulationMode'
  > {
  focusedPlayer: Player | null
}

interface BatchUsageAggregate {
  id: string
  name: string
  activations: number
}

interface BatchPlayerAggregate {
  id: number
  name: string
  position: string
  rarity: Rarity
  matches: number
  wins: number
  losses: number
  mvps: number
  goals: number
  assists: number
  defensiveActions: number
  participations: number
  shots: number
  totalRating: number
  flowActivations: number
  traitActivations: number
}

interface BatchRarityAggregate {
  matches: number
  wins: number
  goals: number
  assists: number
  mvps: number
  totalRating: number
}

interface BatchPositionAggregate {
  matches: number
  goals: number
  assists: number
  participations: number
}

interface TeamStrengthAggregate {
  matches: number
  basePower: number
  averageEgo: number
  randomFactor: number
  clutchBonus: number
  upsetBonus: number
  finalStrength: number
}

interface BatchCompositionDistribution {
  homeAway: Map<number, { home: number; away: number }>
  teammates: Map<number, Map<number, number>>
  opponents: Map<number, Map<number, number>>
  rarity: Map<number, PlayerRarityDistribution>
  availableSynergies: Map<string, number>
}

interface BatchReportAccumulator {
  startedAt: string
  startedAtMs: number
  simulationCount: number
  matchCount: number
  totalGoals: number
  totalEvents: number
  totalDurationMs: number
  homeWins: number
  awayWins: number
  draws: number
  flowMatches: number
  totalFlowActivations: number
  upsetTriggered: number
  upsetVictories: number
  players: Map<number, BatchPlayerAggregate>
  traits: Map<string, BatchUsageAggregate>
  synergies: Map<string, BatchUsageAggregate>
  rarity: Record<Rarity, BatchRarityAggregate>
  positions: Map<string, BatchPositionAggregate>
  teamStrength: Record<BatchSide, TeamStrengthAggregate>
  composition: BatchCompositionDistribution
  playerPool: Player[]
}

export interface BatchMatchSimulationProgress {
  simulationCount: number
  completed: number
  percentage: number
  elapsedMs: number
}

export interface BatchMatchSimulationOptions {
  playerPool?: Player[]
  teamSize?: number
  simulationMode?: BatchSimulationMode
  focusedPlayerId?: number
  focusedPlayerName?: string
  balancedCandidateCount?: number
  random?: RandomGenerator
  randomSeed?: string | number | null
  log?: boolean
  save?: boolean
}

export interface BatchMatchSimulationRequest
  extends BatchMatchSimulationOptions {
  matchCount?: number
}

export interface BatchMatchSimulationAsyncOptions
  extends BatchMatchSimulationOptions {
  onProgress?: (progress: BatchMatchSimulationProgress) => void
  yieldEvery?: number
  progressEvery?: number
}

export interface BatchMatchSimulationRun {
  report: BatchMatchReport
  json: string
  saveStatus: BatchReportSaveStatus
}

export interface BatchPlayerStats {
  id: number
  name: string
  position: string
  rarity: Rarity
  matches: number
  wins: number
  losses: number
  mvps: number
  goals: number
  assists: number
  defensiveActions: number
  participations: number
  shots: number
  averageRating: number
  flowActivations: number
  traitActivations: number
  goalsPerGame: number
  assistsPerGame: number
  defensiveActionsPerGame: number
  participationsPerGame: number
  shotsPerGame: number
  flowActivationsPerGame: number
  traitActivationsPerGame: number
  mvpRate: number
}

export interface BatchRankingEntry {
  id: number
  name: string
  position: string
  rarity: Rarity
  value: number
}

export interface BatchUsageStats {
  id: string
  name: string
  activations: number
  activationsPerMatch: number
}

export interface BatchRarityStats {
  matches: number
  wins: number
  goals: number
  assists: number
  mvps: number
  averageRating: number
}

export interface BatchPositionStats {
  matches: number
  goals: number
  assists: number
  participations: number
  participationsPerGame: number
}

export interface BatchBalanceAlert {
  type: BatchBalanceAlertType
  player?: string
  trait?: string
  synergy?: string
  rarity?: Rarity
  value: number
  average?: number
  standardDeviation?: number
  message: string
}

export interface BatchMatchReport {
  version: string
  generatedAt: string
  simulationCount: number
  simulationMode: BatchSimulationMode
  focusedPlayer: FocusedPlayerReport | null
  summary: {
    version: string
    generatedAt: string
    simulationCount: number
    totalMatches: number
    totalGoals: number
    averageGoalsPerMatch: number
    totalEvents: number
    averageEventsPerMatch: number
    averageMatchDuration: string
    averageMatchDurationMs: number
    results: {
      homeWins: number
      awayWins: number
      draws: number
      homeWinRate: number
      awayWinRate: number
      drawRate: number
    }
    flow: {
      flowMatches: number
      flowRate: number
      totalFlowActivations: number
    }
    upset: {
      upsetTriggered: number
      upsetTriggeredRate: number
      upsetVictories: number
      upsetVictoryRate: number
    }
    teamStrength: Record<
      BatchSide,
      Omit<TeamStrengthAggregate, 'matches'>
    >
  }
  players: BatchPlayerStats[]
  rankings: {
    topGoals: BatchRankingEntry[]
    topAssists: BatchRankingEntry[]
    topDefensiveActions: BatchRankingEntry[]
    topMVPs: BatchRankingEntry[]
    topAverageRating: BatchRankingEntry[]
    topFlowActivations: BatchRankingEntry[]
    topTraitActivations: BatchRankingEntry[]
    topParticipations: BatchRankingEntry[]
    topShots: BatchRankingEntry[]
  }
  traits: {
    traitUsage: BatchUsageStats[]
  }
  synergies: {
    synergyUsage: BatchUsageStats[]
  }
  rarity: Record<Rarity, BatchRarityStats>
  positionStatistics: Record<string, BatchPositionStats>
  homeAwayDistribution: HomeAwayDistribution
  teammateDistribution: NamedCountDistribution
  opponentDistribution: NamedCountDistribution
  rarityDistribution: PlayerRarityDistributionReport
  playerDistribution: PlayerDistributionReport
  balanceScore: number
  alerts: BatchBalanceAlert[]
  historicalComparison: {
    enabled: false
    previousVersion: null
    currentVersion: string
    changes: Record<string, never>
  }
  metadata: {
    simulatorVersion: string
    gameVersion: string
    balanceVersion: string
    simulationMode: BatchSimulationMode
    executionTime: {
      startedAt: string
      finishedAt: string
      durationMs: number
      duration: string
    }
    randomSeed: string | number | null
    notes: string[]
  }
}

type BatchGlobal = typeof globalThis & {
  __PROJECT_EGO_LAST_BATCH_REPORT?: BatchMatchReport
  __PROJECT_EGO_LAST_BATCH_REPORT_JSON?: string
  __PROJECT_EGO_RUN_BATCH_MATCH_SIMULATION?: typeof runBatchMatchSimulation
}

const BATCH_REPORT_FILENAME = 'batch-report.json'
const BATCH_REPORT_ENDPOINT = '/__project_ego_batch_report'
const BATCH_REPORT_VERSION = '1.0.0'
const BATCH_SIMULATOR_VERSION = '1.0.0'
const GAME_VERSION = '0.0.0'
const BALANCE_VERSION = '0.0.0'
const DEFAULT_MATCH_COUNT = 100
const DEFAULT_TEAM_SIZE = 5
const DEFAULT_SIMULATION_MODE: BatchSimulationMode = 'random'
const DEFAULT_BALANCED_CANDIDATE_COUNT = 64
const OUTLIER_STANDARD_DEVIATIONS = 2
const RARITIES: Rarity[] = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
  'Egoist',
]
function getNowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function round(value: number, digits = 4): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Number(value.toFixed(digits))
}

function getRate(value: number, total: number): number {
  return total > 0 ? round(value / total) : 0
}

function getAverage(value: number, total: number): number {
  return total > 0 ? round(value / total, 2) : 0
}

function createRarityAggregate(): BatchRarityAggregate {
  return {
    matches: 0,
    wins: 0,
    goals: 0,
    assists: 0,
    mvps: 0,
    totalRating: 0,
  }
}

function createPositionAggregate(): BatchPositionAggregate {
  return {
    matches: 0,
    goals: 0,
    assists: 0,
    participations: 0,
  }
}

function createRarityCountDistribution(): RarityCountDistribution {
  return {
    Common: 0,
    Rare: 0,
    Epic: 0,
    Legendary: 0,
    Egoist: 0,
  }
}

function createTeamStrengthAggregate(): TeamStrengthAggregate {
  return {
    matches: 0,
    basePower: 0,
    averageEgo: 0,
    randomFactor: 0,
    clutchBonus: 0,
    upsetBonus: 0,
    finalStrength: 0,
  }
}

function createPlayerRarityDistribution(): PlayerRarityDistribution {
  return {
    teammates: createRarityCountDistribution(),
    opponents: createRarityCountDistribution(),
  }
}

function createBatchCompositionDistribution(
  playerPool: Player[],
): BatchCompositionDistribution {
  return {
    homeAway: new Map(
      playerPool.map((player) => [player.id, { home: 0, away: 0 }]),
    ),
    teammates: new Map(playerPool.map((player) => [player.id, new Map()])),
    opponents: new Map(playerPool.map((player) => [player.id, new Map()])),
    rarity: new Map(
      playerPool.map((player) => [
        player.id,
        createPlayerRarityDistribution(),
      ]),
    ),
    availableSynergies: new Map(
      [...SYNERGY_DEFINITIONS, ...UNIQUE_SYNERGY_DEFINITIONS].map(
        (synergy) => [synergy.id, 0],
      ),
    ),
  }
}

function createUsageAggregate(id: string, name: string): BatchUsageAggregate {
  return {
    id,
    name,
    activations: 0,
  }
}

function createPlayerAggregate(player: Player): BatchPlayerAggregate {
  return {
    id: player.id,
    name: player.name,
    position: player.position,
    rarity: player.rarity,
    matches: 0,
    wins: 0,
    losses: 0,
    mvps: 0,
    goals: 0,
    assists: 0,
    defensiveActions: 0,
    participations: 0,
    shots: 0,
    totalRating: 0,
    flowActivations: 0,
    traitActivations: 0,
  }
}

function createBatchAccumulator(
  matchCount: number,
  startedAt: string,
  startedAtMs: number,
  playerPool: Player[],
): BatchReportAccumulator {
  const traits = new Map<string, BatchUsageAggregate>()
  const synergies = new Map<string, BatchUsageAggregate>()

  for (const player of playerPool) {
    if (player.trait) {
      traits.set(
        player.trait.name,
        createUsageAggregate(player.trait.name, player.trait.name),
      )
    }
  }

  for (const synergy of [
    ...SYNERGY_DEFINITIONS,
    ...UNIQUE_SYNERGY_DEFINITIONS,
  ]) {
    synergies.set(synergy.id, createUsageAggregate(synergy.id, synergy.name))
  }

  return {
    startedAt,
    startedAtMs,
    simulationCount: matchCount,
    matchCount: 0,
    totalGoals: 0,
    totalEvents: 0,
    totalDurationMs: 0,
    homeWins: 0,
    awayWins: 0,
    draws: 0,
    flowMatches: 0,
    totalFlowActivations: 0,
    upsetTriggered: 0,
    upsetVictories: 0,
    players: new Map(
      playerPool.map((player) => [player.id, createPlayerAggregate(player)]),
    ),
    traits,
    synergies,
    positions: new Map(),
    rarity: {
      Common: createRarityAggregate(),
      Rare: createRarityAggregate(),
      Epic: createRarityAggregate(),
      Legendary: createRarityAggregate(),
      Egoist: createRarityAggregate(),
    },
    teamStrength: {
      home: createTeamStrengthAggregate(),
      away: createTeamStrengthAggregate(),
    },
    composition: createBatchCompositionDistribution(playerPool),
    playerPool,
  }
}

function getOrCreatePlayerAggregate(
  players: Map<number, BatchPlayerAggregate>,
  player: Player,
): BatchPlayerAggregate {
  const existingAggregate = players.get(player.id)

  if (existingAggregate) {
    return existingAggregate
  }

  const aggregate = createPlayerAggregate(player)

  players.set(player.id, aggregate)
  return aggregate
}

function getOrCreateUsageAggregate(
  usage: Map<string, BatchUsageAggregate>,
  id: string,
  name: string,
): BatchUsageAggregate {
  const existingAggregate = usage.get(id)

  if (existingAggregate) {
    return existingAggregate
  }

  const aggregate = createUsageAggregate(id, name)

  usage.set(id, aggregate)
  return aggregate
}

function recordTeamStrength(
  aggregate: TeamStrengthAggregate,
  strength: TeamMatchStrength,
): void {
  aggregate.matches += 1
  aggregate.basePower += strength.basePower
  aggregate.averageEgo += strength.averageEgo
  aggregate.randomFactor += strength.randomFactor
  aggregate.clutchBonus += strength.clutchBonus
  aggregate.upsetBonus += strength.upsetBonus
  aggregate.finalStrength += strength.finalStrength
}

function getHomeAwayExposure(
  composition: BatchCompositionDistribution,
  playerId: number,
): { home: number; away: number } {
  const existingExposure = composition.homeAway.get(playerId)

  if (existingExposure) {
    return existingExposure
  }

  const exposure = { home: 0, away: 0 }

  composition.homeAway.set(playerId, exposure)
  return exposure
}

function getPairDistribution(
  distribution: Map<number, Map<number, number>>,
  playerId: number,
): Map<number, number> {
  const existingDistribution = distribution.get(playerId)

  if (existingDistribution) {
    return existingDistribution
  }

  const playerDistribution = new Map<number, number>()

  distribution.set(playerId, playerDistribution)
  return playerDistribution
}

function getPlayerRarityDistribution(
  composition: BatchCompositionDistribution,
  playerId: number,
): PlayerRarityDistribution {
  const existingDistribution = composition.rarity.get(playerId)

  if (existingDistribution) {
    return existingDistribution
  }

  const distribution = createPlayerRarityDistribution()

  composition.rarity.set(playerId, distribution)
  return distribution
}

function incrementPairCount(
  distribution: Map<number, Map<number, number>>,
  playerId: number,
  relatedPlayerId: number,
): void {
  const playerDistribution = getPairDistribution(distribution, playerId)

  playerDistribution.set(
    relatedPlayerId,
    (playerDistribution.get(relatedPlayerId) ?? 0) + 1,
  )
}

function recordTeamSideDistribution(
  composition: BatchCompositionDistribution,
  team: Player[],
  side: BatchSide,
): void {
  for (const player of team) {
    const exposure = getHomeAwayExposure(composition, player.id)

    exposure[side] += 1
  }
}

function recordTeammateDistribution(
  composition: BatchCompositionDistribution,
  team: Player[],
): void {
  for (const player of team) {
    const rarityDistribution = getPlayerRarityDistribution(
      composition,
      player.id,
    )

    for (const teammate of team) {
      if (teammate.id === player.id) {
        continue
      }

      incrementPairCount(composition.teammates, player.id, teammate.id)
      rarityDistribution.teammates[teammate.rarity] += 1
    }
  }
}

function recordOpponentDistribution(
  composition: BatchCompositionDistribution,
  homeTeam: Player[],
  awayTeam: Player[],
): void {
  for (const homePlayer of homeTeam) {
    const homeRarityDistribution = getPlayerRarityDistribution(
      composition,
      homePlayer.id,
    )

    for (const awayPlayer of awayTeam) {
      const awayRarityDistribution = getPlayerRarityDistribution(
        composition,
        awayPlayer.id,
      )

      incrementPairCount(composition.opponents, homePlayer.id, awayPlayer.id)
      incrementPairCount(composition.opponents, awayPlayer.id, homePlayer.id)
      homeRarityDistribution.opponents[awayPlayer.rarity] += 1
      awayRarityDistribution.opponents[homePlayer.rarity] += 1
    }
  }
}

function getAvailableSynergyIds(team: Player[]): string[] {
  return [
    ...getActiveSynergies(team),
    ...getActiveUniqueSynergies(team),
  ].map((synergy) => synergy.id)
}

function recordAvailableSynergyDistribution(
  composition: BatchCompositionDistribution,
  homeTeam: Player[],
  awayTeam: Player[],
): void {
  for (const synergyId of [
    ...getAvailableSynergyIds(homeTeam),
    ...getAvailableSynergyIds(awayTeam),
  ]) {
    composition.availableSynergies.set(
      synergyId,
      (composition.availableSynergies.get(synergyId) ?? 0) + 1,
    )
  }
}

function recordCompositionDistribution(
  accumulator: BatchReportAccumulator,
  result: MatchResult,
): void {
  recordTeamSideDistribution(
    accumulator.composition,
    result.playerTeam,
    'home',
  )
  recordTeamSideDistribution(
    accumulator.composition,
    result.rivalTeam,
    'away',
  )
  recordTeammateDistribution(accumulator.composition, result.playerTeam)
  recordTeammateDistribution(accumulator.composition, result.rivalTeam)
  recordOpponentDistribution(
    accumulator.composition,
    result.playerTeam,
    result.rivalTeam,
  )
  recordAvailableSynergyDistribution(
    accumulator.composition,
    result.playerTeam,
    result.rivalTeam,
  )
}

function getUpsetBoostedSide(result: MatchResult): MatchSide | null {
  if (!result.upsetOccurred) {
    return null
  }

  if (result.playerStrength.upsetBonus > 0) {
    return 'player'
  }

  if (result.rivalStrength.upsetBonus > 0) {
    return 'rival'
  }

  return null
}

function recordPlayerStats(
  accumulator: BatchReportAccumulator,
  playerStats: PlayerMatchStats,
  winner: MatchSide,
  mvp: PlayerMatchStats,
  traitActivations: number,
): void {
  const aggregate = getOrCreatePlayerAggregate(
    accumulator.players,
    playerStats.player,
  )
  const rarityAggregate = accumulator.rarity[playerStats.player.rarity]
  const won = playerStats.side === winner
  const wasMvp =
    mvp.side === playerStats.side &&
    mvp.player.id === playerStats.player.id

  aggregate.matches += 1
  aggregate.wins += won ? 1 : 0
  aggregate.losses += won ? 0 : 1
  aggregate.mvps += wasMvp ? 1 : 0
  aggregate.goals += playerStats.goals
  aggregate.assists += playerStats.assists
  aggregate.defensiveActions += playerStats.defensiveActions
  aggregate.participations += playerStats.goals + playerStats.assists
  aggregate.shots += playerStats.shots
  aggregate.totalRating += playerStats.rating
  aggregate.flowActivations += playerStats.flowActivations
  aggregate.traitActivations += traitActivations

  rarityAggregate.matches += 1
  rarityAggregate.wins += won ? 1 : 0
  rarityAggregate.goals += playerStats.goals
  rarityAggregate.assists += playerStats.assists
  rarityAggregate.mvps += wasMvp ? 1 : 0
  rarityAggregate.totalRating += playerStats.rating

  if (playerStats.player.trait) {
    const traitAggregate = getOrCreateUsageAggregate(
      accumulator.traits,
      playerStats.player.trait.name,
      playerStats.player.trait.name,
    )

    traitAggregate.activations += traitActivations
  }

  const positionAggregate =
    accumulator.positions.get(playerStats.player.position) ??
    createPositionAggregate()

  positionAggregate.matches += 1
  positionAggregate.goals += playerStats.goals
  positionAggregate.assists += playerStats.assists
  positionAggregate.participations += playerStats.goals + playerStats.assists
  accumulator.positions.set(playerStats.player.position, positionAggregate)
}

function recordMatch(
  accumulator: BatchReportAccumulator,
  result: MatchResult,
): void {
  const traitProcCounts = getTraitProcCounts(result)
  const boostedSide = getUpsetBoostedSide(result)

  accumulator.matchCount += 1
  accumulator.totalGoals += result.score.player + result.score.rival
  accumulator.totalEvents += result.events.length
  accumulator.totalDurationMs += result.durationMs
  accumulator.homeWins += result.winner === 'player' ? 1 : 0
  accumulator.awayWins += result.winner === 'rival' ? 1 : 0
  accumulator.flowMatches += result.flowActivated ? 1 : 0
  accumulator.totalFlowActivations += result.flowActivations
  accumulator.upsetTriggered += result.upsetOccurred ? 1 : 0
  accumulator.upsetVictories += boostedSide === result.winner ? 1 : 0

  recordCompositionDistribution(accumulator, result)
  recordTeamStrength(accumulator.teamStrength.home, result.playerStrength)
  recordTeamStrength(accumulator.teamStrength.away, result.rivalStrength)

  for (const playerStats of result.stats) {
    const statsKey = getPlayerStatsKey(
      playerStats.side,
      playerStats.player.id,
    )

    recordPlayerStats(
      accumulator,
      playerStats,
      result.winner,
      result.mvp,
      traitProcCounts.get(statsKey) ?? 0,
    )
  }

  for (const synergyStats of getSynergyImpactStats(result)) {
    const synergyAggregate = getOrCreateUsageAggregate(
      accumulator.synergies,
      synergyStats.id,
      synergyStats.name,
    )

    synergyAggregate.activations += synergyStats.activations
  }
}

function drawBatchTeams(
  accumulator: BatchReportAccumulator,
  playerPool: Player[],
  teamSize: number,
  random: RandomGenerator,
  simulationMode: BatchSimulationMode,
  balancedCandidateCount: number,
  focusedPlayer: Player | null,
): { homeTeam: Player[]; awayTeam: Player[] } {
  if (simulationMode === 'focused') {
    if (!focusedPlayer) {
      throw new Error('Focused simulation requires a valid focused player.')
    }

    return drawFocusedBatchTeams(
      playerPool,
      teamSize,
      random,
      focusedPlayer,
    )
  }

  if (simulationMode === 'random') {
    return drawWeightedBatchTeams(playerPool, teamSize, random)
  }

  return drawBalancedBatchTeams(
    accumulator,
    playerPool,
    teamSize,
    random,
    balancedCandidateCount,
  )
}

function drawWeightedBatchTeams(
  playerPool: Player[],
  teamSize: number,
  random: RandomGenerator,
): { homeTeam: Player[]; awayTeam: Player[] } {
  const homeTeam = drawWeightedPlayers(
    playerPool,
    teamSize,
    [],
    undefined,
    random,
  )
  const awayTeam = drawWeightedPlayers(
    playerPool,
    teamSize,
    homeTeam.map((player) => player.id),
    undefined,
    random,
  )

  return { homeTeam, awayTeam }
}

function drawFocusedBatchTeams(
  playerPool: Player[],
  teamSize: number,
  random: RandomGenerator,
  focusedPlayer: Player,
): { homeTeam: Player[]; awayTeam: Player[] } {
  const focusedSide: BatchSide = random() < 0.5 ? 'home' : 'away'
  const excludedIds = [focusedPlayer.id]
  const homeTeam =
    focusedSide === 'home'
      ? [
          focusedPlayer,
          ...drawWeightedPlayers(
            playerPool,
            teamSize - 1,
            excludedIds,
            undefined,
            random,
          ),
        ]
      : drawWeightedPlayers(
          playerPool,
          teamSize,
          excludedIds,
          undefined,
          random,
        )
  const awayExcludedIds = [
    focusedPlayer.id,
    ...homeTeam.map((player) => player.id),
  ]
  const awayTeam =
    focusedSide === 'away'
      ? [
          focusedPlayer,
          ...drawWeightedPlayers(
            playerPool,
            teamSize - 1,
            [
              focusedPlayer.id,
              ...homeTeam.map((player) => player.id),
            ],
            undefined,
            random,
          ),
        ]
      : drawWeightedPlayers(
          playerPool,
          teamSize,
          awayExcludedIds,
          undefined,
          random,
        )

  return { homeTeam, awayTeam }
}

function shufflePlayers(players: Player[], random: RandomGenerator): Player[] {
  const shuffledPlayers = [...players]

  for (let index = shuffledPlayers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const player = shuffledPlayers[index]

    shuffledPlayers[index] = shuffledPlayers[swapIndex]
    shuffledPlayers[swapIndex] = player
  }

  return shuffledPlayers
}

function getCompositionMatchCount(
  composition: BatchCompositionDistribution,
  playerId: number,
): number {
  const exposure = getHomeAwayExposure(composition, playerId)

  return exposure.home + exposure.away
}

function selectExposureBalancedPlayers(
  accumulator: BatchReportAccumulator,
  playerPool: Player[],
  amount: number,
  random: RandomGenerator,
): Player[] {
  const availablePlayers = [...playerPool]
  const selectedPlayers: Player[] = []
  const selectionCount = Math.min(amount, availablePlayers.length)

  while (selectedPlayers.length < selectionCount) {
    const weights = availablePlayers.map((player) => {
      const matchCount = getCompositionMatchCount(
        accumulator.composition,
        player.id,
      )

      return 1 / (matchCount + 1) ** 3
    })
    const totalWeight = weights.reduce(
      (total, weight) => total + weight,
      0,
    )
    let threshold = random() * totalWeight
    let selectedIndex = availablePlayers.length - 1

    for (let index = 0; index < availablePlayers.length; index += 1) {
      threshold -= weights[index]

      if (threshold < 0) {
        selectedIndex = index
        break
      }
    }

    selectedPlayers.push(availablePlayers[selectedIndex])
    availablePlayers.splice(selectedIndex, 1)
  }

  return selectedPlayers
}

function createBalancedCandidateTeams(
  selectedPlayers: Player[],
  teamSize: number,
  random: RandomGenerator,
): { homeTeam: Player[]; awayTeam: Player[] } {
  const shuffledPlayers = shufflePlayers(selectedPlayers, random)

  return {
    homeTeam: shuffledPlayers.slice(0, teamSize),
    awayTeam: shuffledPlayers.slice(teamSize, teamSize * 2),
  }
}

function getPairCount(
  distribution: Map<number, Map<number, number>>,
  playerId: number,
  relatedPlayerId: number,
): number {
  return distribution.get(playerId)?.get(relatedPlayerId) ?? 0
}

function getRarityExposureCount(
  composition: BatchCompositionDistribution,
  playerId: number,
  rarity: Rarity,
  type: keyof PlayerRarityDistribution,
): number {
  return getPlayerRarityDistribution(composition, playerId)[type][rarity]
}

function getTeamSideCandidatePenalty(
  composition: BatchCompositionDistribution,
  team: Player[],
  side: BatchSide,
): number {
  return team.reduce((penalty, player) => {
    const exposure = getHomeAwayExposure(composition, player.id)
    const projectedHome = exposure.home + (side === 'home' ? 1 : 0)
    const projectedAway = exposure.away + (side === 'away' ? 1 : 0)
    const projectedMatches = projectedHome + projectedAway
    const sideImbalance =
      projectedMatches > 0
        ? Math.abs(projectedHome - projectedAway) / projectedMatches
        : 0

    return (
      penalty +
      (getCompositionMatchCount(composition, player.id) + 1) ** 2 * 120 +
      sideImbalance * 60
    )
  }, 0)
}

function getTeammateCandidatePenalty(
  composition: BatchCompositionDistribution,
  team: Player[],
): number {
  let penalty = 0

  for (const player of team) {
    for (const teammate of team) {
      if (player.id === teammate.id) {
        continue
      }

      penalty +=
        (getPairCount(composition.teammates, player.id, teammate.id) + 1) **
        2
    }
  }

  return penalty * 5
}

function getOpponentCandidatePenalty(
  composition: BatchCompositionDistribution,
  homeTeam: Player[],
  awayTeam: Player[],
): number {
  let penalty = 0

  for (const homePlayer of homeTeam) {
    for (const awayPlayer of awayTeam) {
      penalty +=
        (getPairCount(
          composition.opponents,
          homePlayer.id,
          awayPlayer.id,
        ) +
          1) **
          2 *
        2
    }
  }

  return penalty
}

function getRarityCandidatePenalty(
  composition: BatchCompositionDistribution,
  team: Player[],
  opponentTeam: Player[],
): number {
  let penalty = 0

  for (const player of team) {
    for (const teammate of team) {
      if (player.id === teammate.id) {
        continue
      }

      penalty +=
        (getRarityExposureCount(
          composition,
          player.id,
          teammate.rarity,
          'teammates',
        ) +
          1) **
        2
    }

    for (const opponent of opponentTeam) {
      penalty +=
        (getRarityExposureCount(
          composition,
          player.id,
          opponent.rarity,
          'opponents',
        ) +
          1) **
        2
    }
  }

  return penalty * 0.75
}

function getAvailableSynergyCandidatePenalty(
  composition: BatchCompositionDistribution,
  homeTeam: Player[],
  awayTeam: Player[],
): number {
  return [
    ...getAvailableSynergyIds(homeTeam),
    ...getAvailableSynergyIds(awayTeam),
  ].reduce(
    (penalty, synergyId) =>
      penalty + (composition.availableSynergies.get(synergyId) ?? 0),
    0,
  )
}

function scoreBalancedTeamCandidate(
  accumulator: BatchReportAccumulator,
  homeTeam: Player[],
  awayTeam: Player[],
): number {
  const composition = accumulator.composition

  return (
    getTeamSideCandidatePenalty(composition, homeTeam, 'home') +
    getTeamSideCandidatePenalty(composition, awayTeam, 'away') +
    getTeammateCandidatePenalty(composition, homeTeam) +
    getTeammateCandidatePenalty(composition, awayTeam) +
    getOpponentCandidatePenalty(composition, homeTeam, awayTeam) +
    getRarityCandidatePenalty(composition, homeTeam, awayTeam) +
    getRarityCandidatePenalty(composition, awayTeam, homeTeam) +
    getAvailableSynergyCandidatePenalty(composition, homeTeam, awayTeam)
  )
}

function drawBalancedBatchTeams(
  accumulator: BatchReportAccumulator,
  playerPool: Player[],
  teamSize: number,
  random: RandomGenerator,
  balancedCandidateCount: number,
): { homeTeam: Player[]; awayTeam: Player[] } {
  const requiredPlayers = teamSize * 2
  let bestCandidate = createBalancedCandidateTeams(
    selectExposureBalancedPlayers(
      accumulator,
      playerPool,
      requiredPlayers,
      random,
    ),
    teamSize,
    random,
  )
  let bestScore = scoreBalancedTeamCandidate(
    accumulator,
    bestCandidate.homeTeam,
    bestCandidate.awayTeam,
  )

  for (
    let candidateIndex = 1;
    candidateIndex < balancedCandidateCount;
    candidateIndex += 1
  ) {
    const candidate = createBalancedCandidateTeams(
      selectExposureBalancedPlayers(
        accumulator,
        playerPool,
        requiredPlayers,
        random,
      ),
      teamSize,
      random,
    )
    const candidateScore = scoreBalancedTeamCandidate(
      accumulator,
      candidate.homeTeam,
      candidate.awayTeam,
    )

    if (candidateScore < bestScore) {
      bestCandidate = candidate
      bestScore = candidateScore
    }
  }

  return bestCandidate
}

function finalizePlayerStats(
  playerAggregate: BatchPlayerAggregate,
): BatchPlayerStats {
  return {
    id: playerAggregate.id,
    name: playerAggregate.name,
    position: playerAggregate.position,
    rarity: playerAggregate.rarity,
    matches: playerAggregate.matches,
    wins: playerAggregate.wins,
    losses: playerAggregate.losses,
    mvps: playerAggregate.mvps,
    goals: playerAggregate.goals,
    assists: playerAggregate.assists,
    defensiveActions: playerAggregate.defensiveActions,
    participations: playerAggregate.participations,
    shots: playerAggregate.shots,
    averageRating: getAverage(
      playerAggregate.totalRating,
      playerAggregate.matches,
    ),
    flowActivations: playerAggregate.flowActivations,
    traitActivations: playerAggregate.traitActivations,
    goalsPerGame: getRate(playerAggregate.goals, playerAggregate.matches),
    assistsPerGame: getRate(
      playerAggregate.assists,
      playerAggregate.matches,
    ),
    defensiveActionsPerGame: getRate(
      playerAggregate.defensiveActions,
      playerAggregate.matches,
    ),
    participationsPerGame: getRate(
      playerAggregate.participations,
      playerAggregate.matches,
    ),
    shotsPerGame: getRate(playerAggregate.shots, playerAggregate.matches),
    flowActivationsPerGame: getRate(
      playerAggregate.flowActivations,
      playerAggregate.matches,
    ),
    traitActivationsPerGame: getRate(
      playerAggregate.traitActivations,
      playerAggregate.matches,
    ),
    mvpRate: getRate(playerAggregate.mvps, playerAggregate.matches),
  }
}

function finalizeUsageStats(
  usageAggregate: BatchUsageAggregate,
  simulationCount: number,
): BatchUsageStats {
  return {
    id: usageAggregate.id,
    name: usageAggregate.name,
    activations: usageAggregate.activations,
    activationsPerMatch: getRate(
      usageAggregate.activations,
      simulationCount,
    ),
  }
}

function finalizeRarityStats(
  rarityAggregate: BatchRarityAggregate,
): BatchRarityStats {
  return {
    matches: rarityAggregate.matches,
    wins: rarityAggregate.wins,
    goals: rarityAggregate.goals,
    assists: rarityAggregate.assists,
    mvps: rarityAggregate.mvps,
    averageRating: getAverage(
      rarityAggregate.totalRating,
      rarityAggregate.matches,
    ),
  }
}

function finalizePositionStats(
  positions: Map<string, BatchPositionAggregate>,
): Record<string, BatchPositionStats> {
  return Object.fromEntries(
    [...positions.entries()]
      .sort(([firstPosition], [secondPosition]) =>
        firstPosition.localeCompare(secondPosition),
      )
      .map(([position, aggregate]) => [
        position,
        {
          matches: aggregate.matches,
          goals: aggregate.goals,
          assists: aggregate.assists,
          participations: aggregate.participations,
          participationsPerGame: getRate(
            aggregate.participations,
            aggregate.matches,
          ),
        },
      ]),
  )
}

function finalizeTeamStrength(
  strengthAggregate: TeamStrengthAggregate,
): Omit<TeamStrengthAggregate, 'matches'> {
  return {
    basePower: getAverage(
      strengthAggregate.basePower,
      strengthAggregate.matches,
    ),
    averageEgo: getAverage(
      strengthAggregate.averageEgo,
      strengthAggregate.matches,
    ),
    randomFactor: getAverage(
      strengthAggregate.randomFactor,
      strengthAggregate.matches,
    ),
    clutchBonus: getAverage(
      strengthAggregate.clutchBonus,
      strengthAggregate.matches,
    ),
    upsetBonus: getAverage(
      strengthAggregate.upsetBonus,
      strengthAggregate.matches,
    ),
    finalStrength: getAverage(
      strengthAggregate.finalStrength,
      strengthAggregate.matches,
    ),
  }
}

function getSortedPlayerPool(playerPool: Player[]): Player[] {
  return [...playerPool].sort((firstPlayer, secondPlayer) =>
    firstPlayer.name.localeCompare(secondPlayer.name),
  )
}

function createHomeAwayDistribution(
  composition: BatchCompositionDistribution,
  playerPool: Player[],
): HomeAwayDistribution {
  return Object.fromEntries(
    getSortedPlayerPool(playerPool).map((player) => {
      const exposure = getHomeAwayExposure(composition, player.id)

      return [
        player.name,
        {
          home: exposure.home,
          away: exposure.away,
        },
      ]
    }),
  )
}

function createNamedCountDistribution(
  distribution: Map<number, Map<number, number>>,
  playerPool: Player[],
): NamedCountDistribution {
  const sortedPlayers = getSortedPlayerPool(playerPool)

  return Object.fromEntries(
    sortedPlayers.map((player) => [
      player.name,
      Object.fromEntries(
        sortedPlayers
          .filter((relatedPlayer) => relatedPlayer.id !== player.id)
          .map((relatedPlayer) => [
            relatedPlayer.name,
            getPairCount(distribution, player.id, relatedPlayer.id),
          ]),
      ),
    ]),
  )
}

function cloneRarityCountDistribution(
  distribution: RarityCountDistribution,
): RarityCountDistribution {
  return {
    Common: distribution.Common,
    Rare: distribution.Rare,
    Epic: distribution.Epic,
    Legendary: distribution.Legendary,
    Egoist: distribution.Egoist,
  }
}

function createPlayerRarityDistributionReport(
  composition: BatchCompositionDistribution,
  playerPool: Player[],
): PlayerRarityDistributionReport {
  return Object.fromEntries(
    getSortedPlayerPool(playerPool).map((player) => {
      const distribution = getPlayerRarityDistribution(
        composition,
        player.id,
      )

      return [
        player.name,
        {
          teammates: cloneRarityCountDistribution(distribution.teammates),
          opponents: cloneRarityCountDistribution(distribution.opponents),
        },
      ]
    }),
  )
}

function createPlayerDistributionReport(
  players: BatchPlayerStats[],
): PlayerDistributionReport {
  const matches = players.map((player) => player.matches)
  const minMatches = matches.length > 0 ? Math.min(...matches) : 0
  const maxMatches = matches.length > 0 ? Math.max(...matches) : 0
  const matchesPerPlayer = Object.fromEntries(
    [...players]
      .sort(
        (firstPlayer, secondPlayer) =>
          secondPlayer.matches - firstPlayer.matches ||
          firstPlayer.name.localeCompare(secondPlayer.name),
      )
      .map((player) => [player.name, player.matches]),
  )

  return {
    averageMatchesPerPlayer: getAverage(
      matches.reduce((total, matchCount) => total + matchCount, 0),
      players.length,
    ),
    minMatches,
    maxMatches,
    difference: maxMatches - minMatches,
    matchesPerPlayer,
  }
}

function sortPlayers(
  firstPlayer: BatchPlayerStats,
  secondPlayer: BatchPlayerStats,
): number {
  return firstPlayer.name.localeCompare(secondPlayer.name)
}

function createRanking(
  players: BatchPlayerStats[],
  metric: keyof Pick<
    BatchPlayerStats,
    | 'goals'
    | 'assists'
    | 'defensiveActions'
    | 'mvps'
    | 'averageRating'
    | 'flowActivations'
    | 'traitActivations'
    | 'participations'
    | 'shots'
  >,
): BatchRankingEntry[] {
  return [...players]
    .sort(
      (firstPlayer, secondPlayer) =>
        secondPlayer[metric] - firstPlayer[metric] ||
        secondPlayer.averageRating - firstPlayer.averageRating ||
        firstPlayer.name.localeCompare(secondPlayer.name),
    )
    .map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      rarity: player.rarity,
      value: player[metric],
    }))
}

function getMean(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function getStandardDeviation(values: number[], mean: number): number {
  if (values.length <= 1) {
    return 0
  }

  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length

  return Math.sqrt(variance)
}

function getDistributionBounds(values: number[]) {
  const average = getMean(values)
  const standardDeviation = getStandardDeviation(values, average)

  return {
    average,
    standardDeviation,
    low: average - standardDeviation * OUTLIER_STANDARD_DEVIATIONS,
    high: average + standardDeviation * OUTLIER_STANDARD_DEVIATIONS,
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function getUniformityScore(values: number[]): number {
  const average = getMean(values)

  if (average === 0) {
    return 100
  }

  const standardDeviation = getStandardDeviation(values, average)
  const coefficientOfVariation = standardDeviation / average

  return round(clamp(100 - coefficientOfVariation * 100, 0, 100), 2)
}

function getMatchDistributionScore(
  composition: BatchCompositionDistribution,
  playerPool: Player[],
): number {
  return getUniformityScore(
    playerPool.map((player) =>
      getCompositionMatchCount(composition, player.id),
    ),
  )
}

function getHomeAwayBalanceScore(
  composition: BatchCompositionDistribution,
  playerPool: Player[],
): number {
  const imbalances = playerPool.map((player) => {
    const exposure = getHomeAwayExposure(composition, player.id)
    const matches = exposure.home + exposure.away

    return matches > 0 ? Math.abs(exposure.home - exposure.away) / matches : 0
  })
  const averageImbalance = getMean(imbalances)

  return round(clamp(100 - averageImbalance * 100, 0, 100), 2)
}

function getDirectionalPairDistributionScore(
  distribution: Map<number, Map<number, number>>,
  playerPool: Player[],
): number {
  const values: number[] = []

  for (const player of playerPool) {
    for (const relatedPlayer of playerPool) {
      if (player.id === relatedPlayer.id) {
        continue
      }

      values.push(getPairCount(distribution, player.id, relatedPlayer.id))
    }
  }

  return getUniformityScore(values)
}

function getRarityDistributionScore(
  composition: BatchCompositionDistribution,
  playerPool: Player[],
  type: keyof PlayerRarityDistribution,
): number {
  const rarityScores = RARITIES.map((rarity) =>
    getUniformityScore(
      playerPool.map(
        (player) =>
          getPlayerRarityDistribution(composition, player.id)[type][rarity],
      ),
    ),
  )

  return round(getMean(rarityScores), 2)
}

function getAvailableSynergyDistributionScore(
  composition: BatchCompositionDistribution,
): number {
  return getUniformityScore([...composition.availableSynergies.values()])
}

function calculateBalanceScore(
  composition: BatchCompositionDistribution,
  playerPool: Player[],
): number {
  const scores = [
    getMatchDistributionScore(composition, playerPool),
    getHomeAwayBalanceScore(composition, playerPool),
    getDirectionalPairDistributionScore(composition.teammates, playerPool),
    getDirectionalPairDistributionScore(composition.opponents, playerPool),
    getRarityDistributionScore(composition, playerPool, 'teammates'),
    getRarityDistributionScore(composition, playerPool, 'opponents'),
    getAvailableSynergyDistributionScore(composition),
  ]

  return round(getMean(scores), 2)
}

function addPlayerHighRateAlerts(
  alerts: BatchBalanceAlert[],
  players: BatchPlayerStats[],
  metric: keyof Pick<
    BatchPlayerStats,
    | 'goalsPerGame'
    | 'assistsPerGame'
    | 'defensiveActionsPerGame'
    | 'mvpRate'
    | 'flowActivationsPerGame'
  >,
  type: Extract<
    BatchBalanceAlertType,
    | 'HIGH_GOAL_RATE'
    | 'HIGH_ASSIST_RATE'
    | 'HIGH_DEFENSIVE_RATE'
    | 'HIGH_MVP_RATE'
    | 'HIGH_FLOW_RATE'
  >,
  message: string,
): void {
  const bounds = getDistributionBounds(players.map((player) => player[metric]))

  if (bounds.standardDeviation === 0) {
    return
  }

  for (const player of players) {
    const value = player[metric]

    if (value <= bounds.high) {
      continue
    }

    alerts.push({
      type,
      player: player.name,
      value,
      average: round(bounds.average),
      standardDeviation: round(bounds.standardDeviation),
      message,
    })
  }
}

function addPlayerLowRateAlerts(
  alerts: BatchBalanceAlert[],
  players: BatchPlayerStats[],
  metric: keyof Pick<
    BatchPlayerStats,
    'participationsPerGame' | 'flowActivationsPerGame'
  >,
  type: Extract<
    BatchBalanceAlertType,
    'LOW_PARTICIPATION' | 'LOW_FLOW_RATE'
  >,
  message: string,
): void {
  const bounds = getDistributionBounds(players.map((player) => player[metric]))
  const lowBound = Math.max(0, bounds.low)

  if (bounds.standardDeviation === 0) {
    return
  }

  for (const player of players) {
    const value = player[metric]

    if (value >= lowBound) {
      continue
    }

    alerts.push({
      type,
      player: player.name,
      value,
      average: round(bounds.average),
      standardDeviation: round(bounds.standardDeviation),
      message,
    })
  }
}

function addUsageAlerts(
  alerts: BatchBalanceAlert[],
  usageStats: BatchUsageStats[],
  lowType: Extract<
    BatchBalanceAlertType,
    'LOW_TRAIT_USAGE' | 'LOW_SYNERGY_USAGE'
  >,
  highType: Extract<
    BatchBalanceAlertType,
    'HIGH_TRAIT_USAGE' | 'HIGH_SYNERGY_USAGE'
  >,
  labelKey: 'trait' | 'synergy',
): void {
  const bounds = getDistributionBounds(
    usageStats.map((usage) => usage.activationsPerMatch),
  )
  const lowBound = Math.max(0, bounds.low)

  if (bounds.standardDeviation === 0) {
    return
  }

  for (const usage of usageStats) {
    const alertBase = {
      value: usage.activationsPerMatch,
      average: round(bounds.average),
      standardDeviation: round(bounds.standardDeviation),
    }

    if (usage.activationsPerMatch > bounds.high) {
      alerts.push({
        type: highType,
        [labelKey]: usage.name,
        ...alertBase,
        message: `${usage.name} teve uso acima da distribuicao do batch.`,
      })
    }

    if (usage.activationsPerMatch < lowBound) {
      alerts.push({
        type: lowType,
        [labelKey]: usage.name,
        ...alertBase,
        message: `${usage.name} teve uso abaixo da distribuicao do batch.`,
      })
    }
  }
}

function addUpsetRateAlert(
  alerts: BatchBalanceAlert[],
  upsetRate: number,
  simulationCount: number,
): void {
  const expectedRate = MATCH_CONFIG.upset.chance
  const standardError = Math.sqrt(
    (expectedRate * (1 - expectedRate)) / Math.max(1, simulationCount),
  )

  if (standardError === 0) {
    return
  }

  const low = expectedRate - standardError * OUTLIER_STANDARD_DEVIATIONS
  const high = expectedRate + standardError * OUTLIER_STANDARD_DEVIATIONS

  if (upsetRate > high) {
    alerts.push({
      type: 'HIGH_UPSET_RATE',
      value: upsetRate,
      average: round(expectedRate),
      standardDeviation: round(standardError),
      message: 'Taxa de upset acima da taxa configurada esperada.',
    })
  }

  if (upsetRate < Math.max(0, low)) {
    alerts.push({
      type: 'LOW_UPSET_RATE',
      value: upsetRate,
      average: round(expectedRate),
      standardDeviation: round(standardError),
      message: 'Taxa de upset abaixo da taxa configurada esperada.',
    })
  }
}

function createAlerts(
  players: BatchPlayerStats[],
  traitUsage: BatchUsageStats[],
  synergyUsage: BatchUsageStats[],
  upsetRate: number,
  simulationCount: number,
): BatchBalanceAlert[] {
  const alerts: BatchBalanceAlert[] = []

  addPlayerHighRateAlerts(
    alerts,
    players,
    'goalsPerGame',
    'HIGH_GOAL_RATE',
    'Media de gols acima da distribuicao do batch.',
  )
  addPlayerHighRateAlerts(
    alerts,
    players,
    'assistsPerGame',
    'HIGH_ASSIST_RATE',
    'Media de assistencias acima da distribuicao do batch.',
  )
  addPlayerHighRateAlerts(
    alerts,
    players,
    'defensiveActionsPerGame',
    'HIGH_DEFENSIVE_RATE',
    'Media de acoes defensivas acima da distribuicao do batch.',
  )
  addPlayerHighRateAlerts(
    alerts,
    players,
    'mvpRate',
    'HIGH_MVP_RATE',
    'Taxa de MVP acima da distribuicao do batch.',
  )
  addPlayerHighRateAlerts(
    alerts,
    players,
    'flowActivationsPerGame',
    'HIGH_FLOW_RATE',
    'Taxa de Flow acima da distribuicao do batch.',
  )
  addPlayerLowRateAlerts(
    alerts,
    players,
    'participationsPerGame',
    'LOW_PARTICIPATION',
    'Participacao ofensiva abaixo da distribuicao do batch.',
  )
  addPlayerLowRateAlerts(
    alerts,
    players,
    'flowActivationsPerGame',
    'LOW_FLOW_RATE',
    'Taxa de Flow abaixo da distribuicao do batch.',
  )
  addUsageAlerts(
    alerts,
    traitUsage,
    'LOW_TRAIT_USAGE',
    'HIGH_TRAIT_USAGE',
    'trait',
  )
  addUsageAlerts(
    alerts,
    synergyUsage,
    'LOW_SYNERGY_USAGE',
    'HIGH_SYNERGY_USAGE',
    'synergy',
  )
  addUpsetRateAlert(alerts, upsetRate, simulationCount)

  return alerts.sort((firstAlert, secondAlert) =>
    firstAlert.type.localeCompare(secondAlert.type),
  )
}

function finalizeBatchReport(
  accumulator: BatchReportAccumulator,
  options: FinalizeBatchReportOptions,
): BatchMatchReport {
  const finishedAt = new Date().toISOString()
  const executionDurationMs = Math.max(
    0,
    Math.round(getNowMs() - accumulator.startedAtMs),
  )
  const simulationCount = accumulator.simulationCount
  const players = [...accumulator.players.values()]
    .map(finalizePlayerStats)
    .sort(sortPlayers)
  const traitUsage = [...accumulator.traits.values()]
    .map((trait) => finalizeUsageStats(trait, simulationCount))
    .sort(
      (firstTrait, secondTrait) =>
        secondTrait.activations - firstTrait.activations ||
        firstTrait.name.localeCompare(secondTrait.name),
    )
  const synergyUsage = [...accumulator.synergies.values()]
    .map((synergy) => finalizeUsageStats(synergy, simulationCount))
    .sort(
      (firstSynergy, secondSynergy) =>
        secondSynergy.activations - firstSynergy.activations ||
        firstSynergy.name.localeCompare(secondSynergy.name),
    )
  const upsetTriggeredRate = getRate(
    accumulator.upsetTriggered,
    simulationCount,
  )
  const simulationMode = options.simulationMode ?? DEFAULT_SIMULATION_MODE
  const focusedPlayer = options.focusedPlayer
    ? {
        id: options.focusedPlayer.id,
        name: options.focusedPlayer.name,
      }
    : null
  const homeAwayDistribution = createHomeAwayDistribution(
    accumulator.composition,
    accumulator.playerPool,
  )
  const teammateDistribution = createNamedCountDistribution(
    accumulator.composition.teammates,
    accumulator.playerPool,
  )
  const opponentDistribution = createNamedCountDistribution(
    accumulator.composition.opponents,
    accumulator.playerPool,
  )
  const rarityDistribution = createPlayerRarityDistributionReport(
    accumulator.composition,
    accumulator.playerPool,
  )
  const playerDistribution = createPlayerDistributionReport(players)

  return {
    version: BATCH_REPORT_VERSION,
    generatedAt: accumulator.startedAt,
    simulationCount,
    simulationMode,
    focusedPlayer,
    summary: {
      version: BATCH_REPORT_VERSION,
      generatedAt: accumulator.startedAt,
      simulationCount,
      totalMatches: accumulator.matchCount,
      totalGoals: accumulator.totalGoals,
      averageGoalsPerMatch: getRate(
        accumulator.totalGoals,
        accumulator.matchCount,
      ),
      totalEvents: accumulator.totalEvents,
      averageEventsPerMatch: getRate(
        accumulator.totalEvents,
        accumulator.matchCount,
      ),
      averageMatchDuration: formatMatchDuration(
        getAverage(accumulator.totalDurationMs, accumulator.matchCount),
      ),
      averageMatchDurationMs: getAverage(
        accumulator.totalDurationMs,
        accumulator.matchCount,
      ),
      results: {
        homeWins: accumulator.homeWins,
        awayWins: accumulator.awayWins,
        draws: accumulator.draws,
        homeWinRate: getRate(accumulator.homeWins, simulationCount),
        awayWinRate: getRate(accumulator.awayWins, simulationCount),
        drawRate: getRate(accumulator.draws, simulationCount),
      },
      flow: {
        flowMatches: accumulator.flowMatches,
        flowRate: getRate(accumulator.flowMatches, simulationCount),
        totalFlowActivations: accumulator.totalFlowActivations,
      },
      upset: {
        upsetTriggered: accumulator.upsetTriggered,
        upsetTriggeredRate,
        upsetVictories: accumulator.upsetVictories,
        upsetVictoryRate: getRate(
          accumulator.upsetVictories,
          Math.max(1, accumulator.upsetTriggered),
        ),
      },
      teamStrength: {
        home: finalizeTeamStrength(accumulator.teamStrength.home),
        away: finalizeTeamStrength(accumulator.teamStrength.away),
      },
    },
    players,
    rankings: {
      topGoals: createRanking(players, 'goals'),
      topAssists: createRanking(players, 'assists'),
      topDefensiveActions: createRanking(players, 'defensiveActions'),
      topMVPs: createRanking(players, 'mvps'),
      topAverageRating: createRanking(players, 'averageRating'),
      topFlowActivations: createRanking(players, 'flowActivations'),
      topTraitActivations: createRanking(players, 'traitActivations'),
      topParticipations: createRanking(players, 'participations'),
      topShots: createRanking(players, 'shots'),
    },
    traits: {
      traitUsage,
    },
    synergies: {
      synergyUsage,
    },
    rarity: {
      Common: finalizeRarityStats(accumulator.rarity.Common),
      Rare: finalizeRarityStats(accumulator.rarity.Rare),
      Epic: finalizeRarityStats(accumulator.rarity.Epic),
      Legendary: finalizeRarityStats(accumulator.rarity.Legendary),
      Egoist: finalizeRarityStats(accumulator.rarity.Egoist),
    },
    positionStatistics: finalizePositionStats(accumulator.positions),
    homeAwayDistribution,
    teammateDistribution,
    opponentDistribution,
    rarityDistribution,
    playerDistribution,
    balanceScore: calculateBalanceScore(
      accumulator.composition,
      accumulator.playerPool,
    ),
    alerts: createAlerts(
      players,
      traitUsage,
      synergyUsage,
      upsetTriggeredRate,
      simulationCount,
    ),
    historicalComparison: {
      enabled: false,
      previousVersion: null,
      currentVersion: BALANCE_VERSION,
      changes: {},
    },
    metadata: {
      simulatorVersion: BATCH_SIMULATOR_VERSION,
      gameVersion: GAME_VERSION,
      balanceVersion: BALANCE_VERSION,
      simulationMode,
      executionTime: {
        startedAt: accumulator.startedAt,
        finishedAt,
        durationMs: executionDurationMs,
        duration: formatMatchDuration(executionDurationMs),
      },
      randomSeed: options.randomSeed ?? null,
      notes: [
        simulationMode === 'balanced'
          ? 'Batch uses simulateMatch with balanced team selection to reduce composition bias.'
          : simulationMode === 'focused'
            ? 'Batch uses simulateMatch with one focused player included in every match.'
            : 'Batch uses simulateMatch with teams drawn by the existing weighted draft helper.',
        'No match logic, balance values, Flow, Traits, Synergies, or Upset rules are changed by this report.',
      ],
    },
  }
}

function createProgress(
  simulationCount: number,
  completed: number,
  startedAtMs: number,
): BatchMatchSimulationProgress {
  return {
    simulationCount,
    completed,
    percentage: getRate(completed * 100, simulationCount),
    elapsedMs: Math.max(0, Math.round(getNowMs() - startedAtMs)),
  }
}

function shouldEmitProgress(
  completed: number,
  simulationCount: number,
  progressEvery: number,
): boolean {
  return completed === simulationCount || completed % progressEvery === 0
}

function getPositiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback
}

function normalizeBatchSimulationInput(
  request: number | BatchMatchSimulationRequest = DEFAULT_MATCH_COUNT,
  options: BatchMatchSimulationOptions = {},
): NormalizedBatchSimulationInput {
  if (typeof request === 'number') {
    return {
      matchCount: request,
      options,
    }
  }

  const { matchCount = DEFAULT_MATCH_COUNT, ...requestOptions } = request

  return {
    matchCount,
    options: {
      ...requestOptions,
      ...options,
    },
  }
}

function findFocusedPlayer(
  playerPool: Player[],
  options: BatchMatchSimulationOptions,
): Player | null {
  if (options.focusedPlayerId !== undefined) {
    return (
      playerPool.find((player) => player.id === options.focusedPlayerId) ??
      null
    )
  }

  if (options.focusedPlayerName) {
    const focusedPlayerName = options.focusedPlayerName.toLowerCase()

    return (
      playerPool.find(
        (player) => player.name.toLowerCase() === focusedPlayerName,
      ) ?? null
    )
  }

  return null
}

function createBatchReportAccumulator(
  matchCount = DEFAULT_MATCH_COUNT,
  options: BatchMatchSimulationOptions = {},
): {
  accumulator: BatchReportAccumulator
  playerPool: Player[]
  teamSize: number
  random: RandomGenerator
  simulationMode: BatchSimulationMode
  balancedCandidateCount: number
  focusedPlayer: Player | null
} {
  const simulationCount = getPositiveInteger(matchCount, DEFAULT_MATCH_COUNT)
  const playerPool = options.playerPool ?? defaultPlayerPool
  const simulationMode = options.simulationMode ?? DEFAULT_SIMULATION_MODE
  const focusedPlayer =
    simulationMode === 'focused' ? findFocusedPlayer(playerPool, options) : null
  const teamSize = Math.min(
    getPositiveInteger(options.teamSize ?? DEFAULT_TEAM_SIZE, DEFAULT_TEAM_SIZE),
    Math.floor(playerPool.length / 2),
  )
  const startedAt = new Date().toISOString()
  const startedAtMs = getNowMs()

  if (teamSize <= 0) {
    throw new Error('Batch simulation requires enough players for two teams.')
  }

  if (simulationMode === 'focused' && !focusedPlayer) {
    throw new Error(
      'Focused simulation requires focusedPlayerId or focusedPlayerName.',
    )
  }

  return {
    accumulator: createBatchAccumulator(
      simulationCount,
      startedAt,
      startedAtMs,
      playerPool,
    ),
    playerPool,
    teamSize,
    random: options.random ?? Math.random,
    simulationMode,
    balancedCandidateCount: getPositiveInteger(
      options.balancedCandidateCount ?? DEFAULT_BALANCED_CANDIDATE_COUNT,
      DEFAULT_BALANCED_CANDIDATE_COUNT,
    ),
    focusedPlayer,
  }
}

function runSingleBatchMatch(
  accumulator: BatchReportAccumulator,
  playerPool: Player[],
  teamSize: number,
  random: RandomGenerator,
  simulationMode: BatchSimulationMode,
  balancedCandidateCount: number,
  focusedPlayer: Player | null,
): void {
  const { homeTeam, awayTeam } = drawBatchTeams(
    accumulator,
    playerPool,
    teamSize,
    random,
    simulationMode,
    balancedCandidateCount,
    focusedPlayer,
  )
  const result = simulateMatch(homeTeam, awayTeam, random)

  recordMatch(accumulator, result)
}

function serializeBatchReport(report: BatchMatchReport): string {
  return JSON.stringify(report, null, 2)
}

function publishBatchReport(report: BatchMatchReport, json: string): void {
  const batchGlobal = globalThis as BatchGlobal

  batchGlobal.__PROJECT_EGO_LAST_BATCH_REPORT = report
  batchGlobal.__PROJECT_EGO_LAST_BATCH_REPORT_JSON = json
}

function logBatchReport(json: string): void {
  if (Date.now() >= 0) {
    console.log('📊 BATCH MATCH REPORT')
    console.log(json)
    return
  }

  console.log('📊 BATCH MATCH REPORT')
  console.log(json)
}

async function emitBatchReport(
  report: BatchMatchReport,
  options: BatchMatchSimulationOptions,
): Promise<BatchMatchSimulationRun> {
  const json = serializeBatchReport(report)

  publishBatchReport(report, json)

  if (options.log !== false) {
    logBatchReport(json)
  }

  return {
    report,
    json,
    saveStatus:
      options.save === false
        ? 'unavailable'
        : await saveBatchReportJson(json),
  }
}

function emitBatchReportSync(
  report: BatchMatchReport,
  options: BatchMatchSimulationOptions,
): BatchMatchReport {
  const json = serializeBatchReport(report)

  publishBatchReport(report, json)

  if (options.log !== false) {
    logBatchReport(json)
  }

  if (options.save !== false) {
    void saveBatchReportJson(json)
  }

  return report
}

export function runBatchMatchSimulation(
  request: number | BatchMatchSimulationRequest = DEFAULT_MATCH_COUNT,
  options: BatchMatchSimulationOptions = {},
): BatchMatchReport {
  const normalizedInput = normalizeBatchSimulationInput(request, options)
  const {
    accumulator,
    playerPool,
    teamSize,
    random,
    simulationMode,
    balancedCandidateCount,
    focusedPlayer,
  } = createBatchReportAccumulator(
    normalizedInput.matchCount,
    normalizedInput.options,
  )

  for (
    let simulationIndex = 0;
    simulationIndex < accumulator.simulationCount;
    simulationIndex += 1
  ) {
    runSingleBatchMatch(
      accumulator,
      playerPool,
      teamSize,
      random,
      simulationMode,
      balancedCandidateCount,
      focusedPlayer,
    )
  }

  return emitBatchReportSync(
    finalizeBatchReport(accumulator, {
      randomSeed: normalizedInput.options.randomSeed,
      simulationMode,
      focusedPlayer,
    }),
    normalizedInput.options,
  )
}

export async function runBatchMatchSimulationAsync(
  request: number | BatchMatchSimulationRequest = DEFAULT_MATCH_COUNT,
  options: BatchMatchSimulationAsyncOptions = {},
): Promise<BatchMatchSimulationRun> {
  const normalizedInput = normalizeBatchSimulationInput(request, options)
  const {
    accumulator,
    playerPool,
    teamSize,
    random,
    simulationMode,
    balancedCandidateCount,
    focusedPlayer,
  } = createBatchReportAccumulator(
    normalizedInput.matchCount,
    normalizedInput.options,
  )
  const yieldEvery = getPositiveInteger(
    options.yieldEvery ??
      Math.max(1, Math.floor(accumulator.simulationCount / 50)),
    1,
  )
  const progressEvery = getPositiveInteger(
    options.progressEvery ??
      Math.max(1, Math.floor(accumulator.simulationCount / 100)),
    1,
  )

  options.onProgress?.(
    createProgress(accumulator.simulationCount, 0, accumulator.startedAtMs),
  )

  for (
    let simulationIndex = 0;
    simulationIndex < accumulator.simulationCount;
    simulationIndex += 1
  ) {
    runSingleBatchMatch(
      accumulator,
      playerPool,
      teamSize,
      random,
      simulationMode,
      balancedCandidateCount,
      focusedPlayer,
    )

    const completed = simulationIndex + 1

    if (
      options.onProgress &&
      shouldEmitProgress(
        completed,
        accumulator.simulationCount,
        progressEvery,
      )
    ) {
      options.onProgress(
        createProgress(
          accumulator.simulationCount,
          completed,
          accumulator.startedAtMs,
        ),
      )
    }

    if (
      completed < accumulator.simulationCount &&
      completed % yieldEvery === 0
    ) {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 0))
    }
  }

  return emitBatchReport(
    finalizeBatchReport(accumulator, {
      randomSeed: normalizedInput.options.randomSeed,
      simulationMode,
      focusedPlayer,
    }),
    normalizedInput.options,
  )
}

export function downloadBatchReportJson(json: string): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = BATCH_REPORT_FILENAME
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  window.setTimeout(() => URL.revokeObjectURL(url), 0)

  return true
}

export async function saveBatchReportJson(
  json: string,
): Promise<BatchReportSaveStatus> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return 'unavailable'
  }

  try {
    const response = await fetch(BATCH_REPORT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: json,
    })

    if (response.ok) {
      return 'dev-server'
    }
  } catch {
    // Fall back to a normal browser download when the dev endpoint is absent.
  }

  return downloadBatchReportJson(json) ? 'download' : 'failed'
}

if (typeof window !== 'undefined') {
  ;(globalThis as BatchGlobal).__PROJECT_EGO_RUN_BATCH_MATCH_SIMULATION =
    runBatchMatchSimulation
}
