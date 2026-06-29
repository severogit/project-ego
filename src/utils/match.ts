import type {
  ActiveFlow,
  LiveMatchState,
  MatchEvent,
  MatchResult,
  MatchSide,
  PlayerMatchDevStats,
  PlayerMatchStats,
  TeamMatchStrength,
} from '../types/match'
import type { Player } from '../types/player'
import { getPositionOffensiveBias } from '../config/positionOffensiveBias.ts'
import { calculateTeamPower } from './draft.ts'
import { getFlowEffects } from './flowEffects.ts'
import {
  getActiveSynergies,
  getActiveUniqueSynergies,
  getPlayerSynergyMultiplier,
  getSynergyImpactMessage,
  getSynergyEffectSummary,
  getTeamSynergyBonus,
  getTeamSynergyMultiplier,
  type TeamSynergy,
} from './synergies.ts'
import {
  getAssistTraitWeight,
  getDefensiveActionTraitWeight,
  getFlowChanceTraitMultiplier,
  getGoalConversionTraitMultiplier,
  getShotTraitWeight,
  getTraitImpactSummary,
  getTraitImpactMessage,
  getTraitModifiers,
  type TraitContext,
} from './traits.ts'

export const DEBUG_MODE = false

export const MATCH_CONFIG = {
  targetGoals: 5,
  eventDelay: {
    base: 1000,
  },
  eventChance: {
    goal: 0.36,
    shot: 0.34,
    defense: 0.3,
  },
  defense: {
    maxEventChanceBonus: 0.28,
    eliteTeamRating: 92,
    baselineTeamRating: 72,
    synergyEventBonusMultiplier: 0.35,
    maxSynergyEventBonus: 0.1,
    goalkeeperPresenceBonus: 0.04,
    defenderPresenceBonusPerPlayer: 0.018,
    maxDefenderPresenceBonus: 0.08,
    roleWeightMultiplier: {
      goalkeeper: 1.28,
      centerBack: 1.16,
      fullback: 1.1,
      defensiveMidfielder: 1.08,
      defenderArchetype: 1.06,
    },
  },
  possessionPowerExponent: 2.4,
  randomFactor: {
    min: 0.85,
    max: 1.15,
  },
  clutch: {
    maxPowerRate: 0.08,
  },
  upset: {
    chance: 0.08,
    boostMin: 1.12,
    boostMax: 1.25,
  },
  flow: {
    maxActivations: 2,
    maxActivationsPerSide: 1,
    minEventsBeforeActivation: 4,
    activationChanceMultiplier: 0.2,
    maxActivationChance: 0.18,
    losingByGoals: 2,
    criticalTieGoals: 4,
    relevantParticipation: 3,
    durationOffensivePossessions: 3,
    durationRelevantEvents: 4,
    mvpTieBreakBonus: 5,
    teamStrengthMultiplier: 1.08,
    participationWeightMultiplier: 1.65,
    assistChanceBonus: 0.08,
    eventChanceMultiplier: {
      goal: 1.22,
      shot: 1.1,
    },
    buffs: {
      attack: 1.3,
      speed: 1.2,
      vision: 1.2,
      dribble: 1.25,
      defense: 1.22,
    },
  },
} as const

export const SIMULATION_SPEED_OPTIONS = [1, 2, 4] as const

export type SimulationSpeed = (typeof SIMULATION_SPEED_OPTIONS)[number]
export type RandomGenerator = () => number

interface WeightBreakdown {
  baseWeight: number
  finalWeight: number
}

interface WeightedPlayerCandidate {
  player: Player
  weightBreakdown: WeightBreakdown
}

interface PlayerSelectionResult {
  player: Player
  weightBreakdown: WeightBreakdown
  stats: PlayerMatchStats[]
}

interface OptionalPlayerSelectionResult {
  player?: Player
  weightBreakdown?: WeightBreakdown
  stats: PlayerMatchStats[]
}

interface GoalImpactDescriptions {
  traitImpactDescription?: string
  synergyImpactDescription?: string
}

type DevSelectionRole = 'finisher' | 'assistant' | 'defensive'

const loggedMatchResults = new WeakSet<LiveMatchState>()

function debugLog(label: string, data: unknown): void {
  if (!DEBUG_MODE) {
    return
  }

  console.log(`[Project Ego DEBUG] ${label}`, data)
}

function formatPlayerForDebug(player: Player) {
  return {
    id: player.id,
    name: player.name,
    position: player.position,
    rarity: player.rarity,
    trait: player.trait?.name ?? '-',
    archetypes: player.archetypes ?? [],
    attack: player.attack,
    speed: player.speed,
    vision: player.vision,
    dribble: player.dribble,
    defense: player.defense,
    ego: player.ego,
    flowRate: player.flowRate,
  }
}

function formatTeamForDebug(team: Player[]) {
  return team.map(formatPlayerForDebug)
}

function formatActiveTraitsForDebug(team: Player[]) {
  return team
    .filter((player) => player.trait)
    .map((player) => ({
      player: player.name,
      trait: player.trait?.name,
      impact: getTraitImpactSummary(player),
    }))
}

function formatSynergyForDebug(synergy: TeamSynergy) {
  return {
    id: synergy.id,
    name: synergy.name,
    effect: getSynergyEffectSummary(synergy),
  }
}

function formatActiveSynergiesForDebug(team: Player[]) {
  return {
    archetype: getActiveSynergies(team).map(formatSynergyForDebug),
    unique: getActiveUniqueSynergies(team).map(formatSynergyForDebug),
  }
}

function formatStrengthForDebug(strength: TeamMatchStrength) {
  return {
    basePower: strength.basePower,
    averageEgo: Number(strength.averageEgo.toFixed(2)),
    randomFactor: Number(strength.randomFactor.toFixed(3)),
    clutchBonus: Number(strength.clutchBonus.toFixed(2)),
    upsetBonus: Number(strength.upsetBonus.toFixed(2)),
    finalStrength: Number(strength.finalStrength.toFixed(2)),
  }
}

function formatWeightForDebug(weight: WeightBreakdown | undefined) {
  return weight
    ? {
        baseWeight: Number(weight.baseWeight.toFixed(2)),
        finalWeight: Number(weight.finalWeight.toFixed(2)),
      }
    : undefined
}

function randomBetween(
  minimum: number,
  maximum: number,
  random: RandomGenerator,
): number {
  return minimum + (maximum - minimum) * random()
}

function calculateAverageEgo(team: Player[]): number {
  if (team.length === 0) {
    return 0
  }

  return team.reduce((total, player) => total + player.ego, 0) / team.length
}

export function calculateTeamMatchStrength(
  team: Player[],
  random: RandomGenerator = Math.random,
): TeamMatchStrength {
  const basePower = calculateTeamPower(team)
  const averageEgo = calculateAverageEgo(team)
  const randomFactor = randomBetween(
    MATCH_CONFIG.randomFactor.min,
    MATCH_CONFIG.randomFactor.max,
    random,
  )
  const clutchBonus =
    basePower *
    (averageEgo / 100) *
    MATCH_CONFIG.clutch.maxPowerRate

  return {
    basePower,
    averageEgo,
    randomFactor,
    clutchBonus,
    upsetBonus: 0,
    finalStrength: basePower * randomFactor + clutchBonus,
  }
}

function applyUpsetBonus(
  strength: TeamMatchStrength,
  random: RandomGenerator,
): TeamMatchStrength {
  const upsetMultiplier = randomBetween(
    MATCH_CONFIG.upset.boostMin,
    MATCH_CONFIG.upset.boostMax,
    random,
  )
  const upsetBonus = strength.finalStrength * (upsetMultiplier - 1)

  return {
    ...strength,
    upsetBonus,
    finalStrength: strength.finalStrength + upsetBonus,
  }
}

function createEmptyDevStats(): PlayerMatchDevStats {
  return {
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
}

function createInitialPlayerStats(
  player: Player,
  side: MatchSide,
): PlayerMatchStats {
  return {
    player,
    side,
    goals: 0,
    assists: 0,
    shots: 0,
    defensiveActions: 0,
    flowActivations: 0,
    rating: 6,
    dev: createEmptyDevStats(),
  }
}

function createInitialStats(
  playerTeam: Player[],
  rivalTeam: Player[],
): PlayerMatchStats[] {
  return [
    ...playerTeam.map((player) => createInitialPlayerStats(player, 'player')),
    ...rivalTeam.map((player) => createInitialPlayerStats(player, 'rival')),
  ]
}

export function initializeLiveMatch(
  playerTeam: Player[],
  rivalTeam: Player[],
  random: RandomGenerator = Math.random,
): LiveMatchState {
  const startedAtMs = Date.now()
  let playerStrength = calculateTeamMatchStrength(playerTeam, random)
  let rivalStrength = calculateTeamMatchStrength(rivalTeam, random)
  let upsetOccurred = false

  if (
    playerStrength.basePower !== rivalStrength.basePower &&
    random() < MATCH_CONFIG.upset.chance
  ) {
    upsetOccurred = true

    if (playerStrength.basePower < rivalStrength.basePower) {
      playerStrength = applyUpsetBonus(playerStrength, random)
    } else {
      rivalStrength = applyUpsetBonus(rivalStrength, random)
    }
  }

  debugLog('match:before-start', {
    playerTeam: formatTeamForDebug(playerTeam),
    rivalTeam: formatTeamForDebug(rivalTeam),
    activeTraits: {
      player: formatActiveTraitsForDebug(playerTeam),
      rival: formatActiveTraitsForDebug(rivalTeam),
    },
    activeSynergies: {
      player: formatActiveSynergiesForDebug(playerTeam),
      rival: formatActiveSynergiesForDebug(rivalTeam),
    },
    strengths: {
      player: formatStrengthForDebug(playerStrength),
      rival: formatStrengthForDebug(rivalStrength),
    },
    upsetOccurred,
  })

  return {
    playerTeam,
    rivalTeam,
    playerStrength,
    rivalStrength,
    score: { player: 0, rival: 0 },
    events: [],
    stats: createInitialStats(playerTeam, rivalTeam),
    activeFlows: [],
    flowActivated: false,
    flowActivations: 0,
    startedAtMs,
    upsetOccurred,
    isFinished: false,
    winner: null,
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function getCandidateSelectionWeight(
  candidate: WeightedPlayerCandidate,
): number {
  return Math.max(1, candidate.weightBreakdown.finalWeight)
}

function selectWeightedPlayerCandidate(
  candidates: WeightedPlayerCandidate[],
  random: RandomGenerator,
): WeightedPlayerCandidate {
  const totalWeight = candidates.reduce(
    (total, candidate) => total + getCandidateSelectionWeight(candidate),
    0,
  )
  let threshold = random() * totalWeight

  for (const candidate of candidates) {
    threshold -= getCandidateSelectionWeight(candidate)

    if (threshold < 0) {
      return candidate
    }
  }

  return candidates[candidates.length - 1]
}

function calculateRating(stats: PlayerMatchStats): number {
  return clamp(
    6 +
      stats.goals * 1.35 +
      stats.assists * 0.8 +
      stats.shots * 0.12 +
      stats.defensiveActions * 0.35,
    0,
    10,
  )
}

function updateStats(
  stats: PlayerMatchStats[],
  side: MatchSide,
  playerId: number,
  changes: Partial<
    Pick<
      PlayerMatchStats,
      | 'goals'
      | 'assists'
      | 'shots'
      | 'defensiveActions'
      | 'flowActivations'
    >
  >,
): PlayerMatchStats[] {
  return stats.map((playerStats) => {
    if (
      playerStats.side !== side ||
      playerStats.player.id !== playerId
    ) {
      return playerStats
    }

    const updatedStats = {
      ...playerStats,
      goals: playerStats.goals + (changes.goals ?? 0),
      assists: playerStats.assists + (changes.assists ?? 0),
      shots: playerStats.shots + (changes.shots ?? 0),
      defensiveActions:
        playerStats.defensiveActions + (changes.defensiveActions ?? 0),
      flowActivations:
        playerStats.flowActivations + (changes.flowActivations ?? 0),
    }

    return {
      ...updatedStats,
      rating: calculateRating(updatedStats),
    }
  })
}

function getDevStats(stats: PlayerMatchStats): PlayerMatchDevStats {
  return stats.dev ?? createEmptyDevStats()
}

function updateDevMetrics(
  stats: PlayerMatchStats[],
  side: MatchSide,
  playerId: number,
  updateDevStats: (devStats: PlayerMatchDevStats) => PlayerMatchDevStats,
): PlayerMatchStats[] {
  return stats.map((playerStats) => {
    if (
      playerStats.side !== side ||
      playerStats.player.id !== playerId
    ) {
      return playerStats
    }

    return {
      ...playerStats,
      dev: updateDevStats(getDevStats(playerStats)),
    }
  })
}

function recordDevCandidateMetrics(
  stats: PlayerMatchStats[],
  side: MatchSide,
  candidates: WeightedPlayerCandidate[],
  role: DevSelectionRole,
): PlayerMatchStats[] {
  return candidates.reduce((nextStats, candidate) => {
    const finalWeight = candidate.weightBreakdown.finalWeight

    return updateDevMetrics(
      nextStats,
      side,
      candidate.player.id,
      (devStats) => {
        if (role === 'finisher') {
          return {
            ...devStats,
            offensiveCandidateCount:
              devStats.offensiveCandidateCount + 1,
            totalFinisherWeight:
              devStats.totalFinisherWeight + finalWeight,
          }
        }

        if (role === 'assistant') {
          return {
            ...devStats,
            assistantCandidateCount:
              devStats.assistantCandidateCount + 1,
            totalAssistantWeight:
              devStats.totalAssistantWeight + finalWeight,
          }
        }

        return {
          ...devStats,
          defensiveCandidateCount:
            devStats.defensiveCandidateCount + 1,
          totalDefensiveWeight:
            devStats.totalDefensiveWeight + finalWeight,
        }
      },
    )
  }, stats)
}

function recordDevSelectedMetric(
  stats: PlayerMatchStats[],
  side: MatchSide,
  playerId: number,
  role: DevSelectionRole,
): PlayerMatchStats[] {
  return updateDevMetrics(stats, side, playerId, (devStats) => {
    if (role === 'finisher') {
      return {
        ...devStats,
        finisherSelectedCount: devStats.finisherSelectedCount + 1,
      }
    }

    if (role === 'assistant') {
      return {
        ...devStats,
        assistantSelectedCount: devStats.assistantSelectedCount + 1,
      }
    }

    return {
      ...devStats,
      defensiveSelectedCount: devStats.defensiveSelectedCount + 1,
    }
  })
}

function getOppositeSide(side: MatchSide): MatchSide {
  return side === 'player' ? 'rival' : 'player'
}

function getTeam(state: LiveMatchState, side: MatchSide): Player[] {
  return side === 'player' ? state.playerTeam : state.rivalTeam
}

function hasArchetype(player: Player, archetype: string): boolean {
  return player.archetypes?.includes(archetype) ?? false
}

function isGoalkeeper(player: Player): boolean {
  return player.position === 'Goalkeeper' || hasArchetype(player, 'Goalkeeper')
}

function isCenterBack(player: Player): boolean {
  return (
    player.position === 'Center Back' ||
    player.position === 'CenterBack' ||
    player.position === 'Defender'
  )
}

function isFullback(player: Player): boolean {
  return (
    player.position === 'Left Back' ||
    player.position === 'LeftBack' ||
    player.position === 'Right Back' ||
    player.position === 'RightBack'
  )
}

function isDefensiveMidfielder(player: Player): boolean {
  return (
    player.position === 'Defensive Midfielder' ||
    player.position === 'DefensiveMidfielder'
  )
}

function isDefensivePlayer(player: Player): boolean {
  return (
    isGoalkeeper(player) ||
    isCenterBack(player) ||
    isFullback(player) ||
    isDefensiveMidfielder(player) ||
    hasArchetype(player, 'Defender')
  )
}

function getDefensiveRoleWeightMultiplier(player: Player): number {
  const roleMultipliers = MATCH_CONFIG.defense.roleWeightMultiplier

  if (isGoalkeeper(player)) {
    return roleMultipliers.goalkeeper
  }

  if (isCenterBack(player)) {
    return roleMultipliers.centerBack
  }

  if (isFullback(player)) {
    return roleMultipliers.fullback
  }

  if (isDefensiveMidfielder(player)) {
    return roleMultipliers.defensiveMidfielder
  }

  if (hasArchetype(player, 'Defender')) {
    return roleMultipliers.defenderArchetype
  }

  return 1
}

function getDefensiveActionValue(player: Player): number {
  if (isGoalkeeper(player) || hasArchetype(player, 'Defender')) {
    return 2
  }

  return player.defense >= 90 ? 2 : 1
}

function calculateTeamDefensiveRating(team: Player[]): number {
  if (team.length === 0) {
    return 0
  }

  return (
    team.reduce(
      (total, player) => total + player.defense * 0.75 + player.vision * 0.25,
      0,
    ) / team.length
  )
}

function getDefensiveEventChanceBonus(team: Player[]): number {
  const defensiveRating = calculateTeamDefensiveRating(team)
  const ratingBonus =
    clamp(
      (defensiveRating - MATCH_CONFIG.defense.baselineTeamRating) /
        (MATCH_CONFIG.defense.eliteTeamRating -
          MATCH_CONFIG.defense.baselineTeamRating),
      0,
      1,
    ) * MATCH_CONFIG.defense.maxEventChanceBonus
  const defensivePlayerCount = team.filter(isDefensivePlayer).length
  const defenderPresenceBonus = Math.min(
    MATCH_CONFIG.defense.maxDefenderPresenceBonus,
    defensivePlayerCount *
      MATCH_CONFIG.defense.defenderPresenceBonusPerPlayer,
  )
  const goalkeeperPresenceBonus = team.some(isGoalkeeper)
    ? MATCH_CONFIG.defense.goalkeeperPresenceBonus
    : 0
  const synergyBonus = Math.min(
    MATCH_CONFIG.defense.maxSynergyEventBonus,
    getTeamSynergyBonus(team, 'defensiveActionBonus') *
      MATCH_CONFIG.defense.synergyEventBonusMultiplier,
  )

  return Math.min(
    MATCH_CONFIG.defense.maxEventChanceBonus,
    ratingBonus + defenderPresenceBonus + goalkeeperPresenceBonus + synergyBonus,
  )
}

function getActiveFlow(
  state: LiveMatchState,
  side: MatchSide,
): ActiveFlow | undefined {
  return state.activeFlows.find((flow) => flow.side === side)
}

function isPlayerInFlow(
  state: LiveMatchState,
  side: MatchSide,
  playerId: number,
): boolean {
  return state.activeFlows.some(
    (flow) => flow.side === side && flow.playerId === playerId,
  )
}

function getBestDefensiveFlowShotConversionMultiplier(
  state: LiveMatchState,
  defendingSide: MatchSide,
): number {
  // Defensive Flow reduces the opponent's shot conversion only while the
  // defending player has an active Flow. Multiple active defenders do not stack;
  // the strongest single reduction is the lowest multiplier returned here.
  const defendingTeam = getTeam(state, defendingSide)
  const activeMultipliers = state.activeFlows
    .filter((flow) => flow.side === defendingSide)
    .map((flow) =>
      defendingTeam.find((player) => player.id === flow.playerId),
    )
    .map((player) =>
      player
        ? getFlowEffects(player).opponentShotConversionMultiplier
        : undefined,
    )
    .filter((multiplier): multiplier is number => multiplier !== undefined)

  return activeMultipliers.length > 0 ? Math.min(...activeMultipliers) : 1
}

function getFlowAdjustedAttribute(
  state: LiveMatchState,
  side: MatchSide,
  player: Player,
  attribute: 'attack' | 'speed' | 'vision' | 'dribble' | 'defense' | 'ego',
): number {
  if (!isPlayerInFlow(state, side, player.id)) {
    return player[attribute]
  }

  if (attribute in MATCH_CONFIG.flow.buffs) {
    return (
      player[attribute] *
      MATCH_CONFIG.flow.buffs[
        attribute as keyof typeof MATCH_CONFIG.flow.buffs
      ]
    )
  }

  return player[attribute]
}

function applyFlowParticipationWeight(
  state: LiveMatchState,
  side: MatchSide,
  player: Player,
  weight: number,
): number {
  if (!isPlayerInFlow(state, side, player.id)) {
    return weight
  }

  return weight * MATCH_CONFIG.flow.participationWeightMultiplier
}

function hasSideUsedFlow(
  state: LiveMatchState,
  side: MatchSide,
): boolean {
  return state.stats.some(
    (playerStats) =>
      playerStats.side === side && playerStats.flowActivations > 0,
  )
}

function getScoreGapForSide(
  score: LiveMatchState['score'],
  side: MatchSide,
): number {
  return side === 'player'
    ? score.player - score.rival
    : score.rival - score.player
}

function isClutchMatchState(
  state: LiveMatchState,
  side: MatchSide,
): boolean {
  const sideScoreGap = getScoreGapForSide(state.score, side)
  const isLosingBadly =
    sideScoreGap <= -MATCH_CONFIG.flow.losingByGoals
  const isCriticalTie =
    state.score.player === MATCH_CONFIG.flow.criticalTieGoals &&
    state.score.rival === MATCH_CONFIG.flow.criticalTieGoals
  const isLateGame =
    state.score.player >= MATCH_CONFIG.targetGoals - 1 ||
    state.score.rival >= MATCH_CONFIG.targetGoals - 1

  return isLosingBadly || isCriticalTie || isLateGame
}

function getTraitContext(
  state: LiveMatchState,
  side: MatchSide,
): TraitContext {
  return {
    isClutch: isClutchMatchState(state, side),
  }
}

function hasPlayerFlowTrigger(
  stats: PlayerMatchStats,
  state: LiveMatchState,
): boolean {
  const sideScoreGap = getScoreGapForSide(state.score, stats.side)
  const isLosingBadly =
    sideScoreGap <= -MATCH_CONFIG.flow.losingByGoals
  const isCriticalTie =
    state.score.player === MATCH_CONFIG.flow.criticalTieGoals &&
    state.score.rival === MATCH_CONFIG.flow.criticalTieGoals
  const relevantParticipation =
    stats.goals +
    stats.assists +
    stats.shots +
    stats.defensiveActions

  return (
    isLosingBadly ||
    isCriticalTie ||
    stats.goals >= 2 ||
    (stats.goals >= 1 && stats.assists >= 1) ||
    relevantParticipation >= MATCH_CONFIG.flow.relevantParticipation
  )
}

function getFlowEligibleStats(
  state: LiveMatchState,
): PlayerMatchStats[] {
  if (
    state.flowActivations >= MATCH_CONFIG.flow.maxActivations ||
    state.events.length < MATCH_CONFIG.flow.minEventsBeforeActivation
  ) {
    return []
  }

  return state.stats.filter((playerStats) => {
    if (playerStats.player.flowRate <= 0) {
      return false
    }

    if (
      getActiveFlow(state, playerStats.side) ||
      isPlayerInFlow(state, playerStats.side, playerStats.player.id)
    ) {
      return false
    }

    if (
      MATCH_CONFIG.flow.maxActivationsPerSide === 1 &&
      hasSideUsedFlow(state, playerStats.side)
    ) {
      return false
    }

    return hasPlayerFlowTrigger(playerStats, state)
  })
}

function getFlowActivationChance(
  stats: PlayerMatchStats,
  state: LiveMatchState,
): number {
  const traitMultiplier = getFlowChanceTraitMultiplier(
    stats.player,
    getTraitContext(state, stats.side),
  )
  const synergyMultiplier = getTeamSynergyMultiplier(
    getTeam(state, stats.side),
    'flowChanceBonus',
  )

  return clamp(
    (stats.player.flowRate / 100) *
      MATCH_CONFIG.flow.activationChanceMultiplier *
      traitMultiplier *
      synergyMultiplier,
    0,
    MATCH_CONFIG.flow.maxActivationChance,
  )
}

function createFlowEvent(
  state: LiveMatchState,
  type: 'flow-activated' | 'flow-ended',
  playerStats: Pick<PlayerMatchStats, 'player' | 'side'>,
): MatchEvent {
  const playerName = playerStats.player.name
  const isActivation = type === 'flow-activated'
  const eventId = state.events.length + 1

  return {
    id: eventId,
    type,
    side: playerStats.side,
    playerId: playerStats.player.id,
    playerName,
    description: isActivation
      ? `FLOW ACTIVATED\n\n${playerName.toUpperCase()}`
      : `FLOW ENDED\n\n${playerName.toUpperCase()}`,
    traitImpactDescription: isActivation
      ? getTraitImpactMessage(
          playerStats.player,
          'flow',
          eventId,
          getTraitContext(state, playerStats.side),
        )
      : undefined,
    synergyImpactDescription: isActivation
      ? getSynergyImpactMessage(
          getTeam(state, playerStats.side),
          'flow',
          eventId,
        )
      : undefined,
    scoreAfter: { ...state.score },
  }
}

function tryActivateFlow(
  state: LiveMatchState,
  random: RandomGenerator,
): LiveMatchState | null {
  const eligibleStats = getFlowEligibleStats(state)

  if (eligibleStats.length === 0) {
    return null
  }

  const totalActivationChance = clamp(
    eligibleStats.reduce(
      (total, stats) => total + getFlowActivationChance(stats, state),
      0,
    ),
    0,
    MATCH_CONFIG.flow.maxActivationChance,
  )

  debugLog('flow:activation-check', {
    eligiblePlayers: eligibleStats.map((stats) => ({
      side: stats.side,
      player: stats.player.name,
      flowRate: stats.player.flowRate,
      chance: Number(getFlowActivationChance(stats, state).toFixed(4)),
      goals: stats.goals,
      assists: stats.assists,
      shots: stats.shots,
      defensiveActions: stats.defensiveActions,
    })),
    totalActivationChance: Number(totalActivationChance.toFixed(4)),
  })

  const activationRoll = random()

  if (activationRoll >= totalActivationChance) {
    debugLog('flow:not-activated', {
      activationRoll: Number(activationRoll.toFixed(4)),
      totalActivationChance: Number(totalActivationChance.toFixed(4)),
    })
    return null
  }

  const totalWeight = eligibleStats.reduce(
    (total, stats) =>
      total +
      Math.max(
        1,
        stats.player.flowRate *
          getFlowChanceTraitMultiplier(
            stats.player,
            getTraitContext(state, stats.side),
          ) *
          getTeamSynergyMultiplier(
            getTeam(state, stats.side),
            'flowChanceBonus',
          ),
      ),
    0,
  )
  let threshold = random() * totalWeight
  let selectedStats = eligibleStats[eligibleStats.length - 1]

  for (const stats of eligibleStats) {
    threshold -= Math.max(
      1,
      stats.player.flowRate *
        getFlowChanceTraitMultiplier(
          stats.player,
          getTraitContext(state, stats.side),
        ) *
        getTeamSynergyMultiplier(
          getTeam(state, stats.side),
          'flowChanceBonus',
        ),
    )

    if (threshold < 0) {
      selectedStats = stats
      break
    }
  }

  const flowEvent = createFlowEvent(state, 'flow-activated', selectedStats)
  const activeFlow: ActiveFlow = {
    side: selectedStats.side,
    playerId: selectedStats.player.id,
    playerName: selectedStats.player.name,
    offensivePossessionsRemaining:
      MATCH_CONFIG.flow.durationOffensivePossessions,
    eventsRemaining: MATCH_CONFIG.flow.durationRelevantEvents,
  }

  debugLog('flow:activated', {
    activationRoll: Number(activationRoll.toFixed(4)),
    totalActivationChance: Number(totalActivationChance.toFixed(4)),
    selectedPlayer: selectedStats.player.name,
    side: selectedStats.side,
    durationRemaining: {
      offensivePossessions: activeFlow.offensivePossessionsRemaining,
      relevantEvents: activeFlow.eventsRemaining,
    },
  })

  return {
    ...state,
    activeFlows: [...state.activeFlows, activeFlow],
    events: [...state.events, flowEvent],
    stats: updateStats(state.stats, selectedStats.side, selectedStats.player.id, {
      flowActivations: 1,
    }),
    flowActivated: true,
    flowActivations: state.flowActivations + 1,
  }
}

function getStatsForFlow(
  state: LiveMatchState,
  flow: ActiveFlow,
): PlayerMatchStats | undefined {
  return state.stats.find(
    (playerStats) =>
      playerStats.side === flow.side &&
      playerStats.player.id === flow.playerId,
  )
}

function advanceFlowDurations(
  state: LiveMatchState,
  attackingSide: MatchSide,
): {
  activeFlows: ActiveFlow[]
  events: MatchEvent[]
} {
  const activeFlows: ActiveFlow[] = []
  const endedEvents: MatchEvent[] = []

  for (const flow of state.activeFlows) {
    const updatedFlow = {
      ...flow,
      offensivePossessionsRemaining:
        flow.offensivePossessionsRemaining -
        (flow.side === attackingSide ? 1 : 0),
      eventsRemaining: flow.eventsRemaining - 1,
    }
    const hasEnded =
      updatedFlow.offensivePossessionsRemaining <= 0 ||
      updatedFlow.eventsRemaining <= 0

    if (hasEnded) {
      const playerStats = getStatsForFlow(state, flow)

      if (playerStats) {
        endedEvents.push(
          createFlowEvent(
            {
              ...state,
              events: [...state.events, ...endedEvents],
            },
            'flow-ended',
            playerStats,
          ),
        )
      }
    } else {
      activeFlows.push(updatedFlow)
    }
  }

  if (state.activeFlows.length > 0) {
    debugLog('flow:duration-update', {
      attackingSide,
      activeFlows: activeFlows.map((flow) => ({
        player: flow.playerName,
        side: flow.side,
        offensivePossessions: flow.offensivePossessionsRemaining,
        relevantEvents: flow.eventsRemaining,
      })),
      endedFlows: endedEvents.map((event) => ({
        player: event.playerName,
        side: event.side,
      })),
    })
  }

  return {
    activeFlows,
    events: [...state.events, ...endedEvents],
  }
}

function selectAttackingSide(
  state: LiveMatchState,
  random: RandomGenerator,
): MatchSide {
  const playerStrength = state.playerStrength.finalStrength *
    (getActiveFlow(state, 'player')
      ? MATCH_CONFIG.flow.teamStrengthMultiplier
      : 1)
  const rivalStrength = state.rivalStrength.finalStrength *
    (getActiveFlow(state, 'rival')
      ? MATCH_CONFIG.flow.teamStrengthMultiplier
      : 1)
  const playerWeightedStrength =
    playerStrength ** MATCH_CONFIG.possessionPowerExponent
  const rivalWeightedStrength =
    rivalStrength ** MATCH_CONFIG.possessionPowerExponent
  const playerChance = clamp(
    playerWeightedStrength /
      (playerWeightedStrength + rivalWeightedStrength),
    0.25,
    0.75,
  )

  return random() < playerChance ? 'player' : 'rival'
}

function getEventChances(
  state: LiveMatchState,
  attackingSide: MatchSide,
): {
  goal: number
  shot: number
  defense: number
} {
  const baseChances = !getActiveFlow(state, attackingSide)
    ? MATCH_CONFIG.eventChance
    : (() => {
        const goalChance = MATCH_CONFIG.eventChance.goal *
          MATCH_CONFIG.flow.eventChanceMultiplier.goal
        const shotChance = MATCH_CONFIG.eventChance.shot *
          MATCH_CONFIG.flow.eventChanceMultiplier.shot
        const defenseChance = Math.max(0.05, 1 - goalChance - shotChance)
        const totalChance = goalChance + shotChance + defenseChance

        return {
          goal: goalChance / totalChance,
          shot: shotChance / totalChance,
          defense: defenseChance / totalChance,
        }
      })()
  const defendingTeam = getTeam(state, getOppositeSide(attackingSide))
  const defenseBonus = getDefensiveEventChanceBonus(defendingTeam)
  const baseShotAttemptChance = getShotAttemptChance(baseChances)
  const nextShotAttemptChance = clamp(
    baseShotAttemptChance - defenseBonus,
    0.38,
    0.9,
  )
  const goalRatio =
    baseShotAttemptChance <= 0 ? 0 : baseChances.goal / baseShotAttemptChance
  const goalChance = nextShotAttemptChance * goalRatio
  const shotChance = nextShotAttemptChance - goalChance

  return {
    goal: goalChance,
    shot: shotChance,
    defense: 1 - nextShotAttemptChance,
  }
}

function getAssistChance(
  state: LiveMatchState,
  attackingSide: MatchSide,
): number {
  const baseChance = 0.72
  const synergyBonus = getTeamSynergyBonus(
    getTeam(state, attackingSide),
    'assistChanceBonus',
  )

  if (!getActiveFlow(state, attackingSide)) {
    return clamp(baseChance + synergyBonus, 0, 0.92)
  }

  return clamp(
    baseChance + MATCH_CONFIG.flow.assistChanceBonus + synergyBonus,
    0,
    0.92,
  )
}

function getShotAttemptChance(eventChances: {
  goal: number
  shot: number
}): number {
  return eventChances.goal + eventChances.shot
}

function getBaseGoalConversionChance(eventChances: {
  goal: number
  shot: number
}): number {
  const shotAttemptChance = getShotAttemptChance(eventChances)

  return shotAttemptChance <= 0
    ? 0
    : eventChances.goal / shotAttemptChance
}

function getFinisherWeightBreakdown(
  state: LiveMatchState,
  attackingSide: MatchSide,
  player: Player,
): WeightBreakdown {
  const attack = getFlowAdjustedAttribute(
    state,
    attackingSide,
    player,
    'attack',
  )
  const speed = getFlowAdjustedAttribute(
    state,
    attackingSide,
    player,
    'speed',
  )
  const dribble = getFlowAdjustedAttribute(
    state,
    attackingSide,
    player,
    'dribble',
  )
  const baseWeight =
    attack * 0.45 +
    player.ego * 0.25 +
    speed * 0.15 +
    dribble * 0.15
  const traitWeight = getShotTraitWeight(
    player,
    baseWeight,
    getTraitContext(state, attackingSide),
  )
  const attackingTeam = getTeam(state, attackingSide)
  const synergyWeight =
    traitWeight *
    getTeamSynergyMultiplier(
      attackingTeam,
      'offensiveParticipationBonus',
    ) *
    getPlayerSynergyMultiplier(
      attackingTeam,
      player,
      'finisherSelectionBonus',
    )
  const positionWeight = synergyWeight * getPositionOffensiveBias(player.position)

  return {
    baseWeight,
    finalWeight: applyFlowParticipationWeight(
      state,
      attackingSide,
      player,
      positionWeight,
    ),
  }
}

function getAssistantWeightBreakdown(
  state: LiveMatchState,
  attackingSide: MatchSide,
  player: Player,
): WeightBreakdown {
  const vision = getFlowAdjustedAttribute(
    state,
    attackingSide,
    player,
    'vision',
  )
  const dribble = getFlowAdjustedAttribute(
    state,
    attackingSide,
    player,
    'dribble',
  )
  const baseWeight = vision * 0.65 + dribble * 0.35
  const traitWeight = getAssistTraitWeight(
    player,
    baseWeight,
    getTraitContext(state, attackingSide),
  )
  const synergyWeight =
    traitWeight *
    getTeamSynergyMultiplier(
      getTeam(state, attackingSide),
      'offensiveParticipationBonus',
    )
  const positionWeight = synergyWeight * getPositionOffensiveBias(player.position)

  return {
    baseWeight,
    finalWeight: applyFlowParticipationWeight(
      state,
      attackingSide,
      player,
      positionWeight,
    ),
  }
}

function getDefensiveWeightBreakdown(
  state: LiveMatchState,
  defendingSide: MatchSide,
  player: Player,
): WeightBreakdown {
  const defense = getFlowAdjustedAttribute(
    state,
    defendingSide,
    player,
    'defense',
  )
  const vision = getFlowAdjustedAttribute(
    state,
    defendingSide,
    player,
    'vision',
  )
  const baseWeight = defense * 0.72 + vision * 0.28
  const traitWeight = getDefensiveActionTraitWeight(
    player,
    baseWeight,
    getTraitContext(state, defendingSide),
  )
  const synergyWeight =
    traitWeight *
    getPlayerSynergyMultiplier(
      getTeam(state, defendingSide),
      player,
      'defensiveActionBonus',
    )
  const roleWeight = synergyWeight * getDefensiveRoleWeightMultiplier(player)

  return {
    baseWeight,
    finalWeight: applyFlowParticipationWeight(
      state,
      defendingSide,
      player,
      roleWeight,
    ),
  }
}

function selectFinisher(
  state: LiveMatchState,
  attackingSide: MatchSide,
  random: RandomGenerator,
): PlayerSelectionResult {
  const candidates = getTeam(state, attackingSide).map((player) => ({
    player,
    weightBreakdown: getFinisherWeightBreakdown(
      state,
      attackingSide,
      player,
    ),
  }))
  const selectedCandidate = selectWeightedPlayerCandidate(
    candidates,
    random,
  )
  const statsWithCandidates = recordDevCandidateMetrics(
    state.stats,
    attackingSide,
    candidates,
    'finisher',
  )

  return {
    player: selectedCandidate.player,
    weightBreakdown: selectedCandidate.weightBreakdown,
    stats: recordDevSelectedMetric(
      statsWithCandidates,
      attackingSide,
      selectedCandidate.player.id,
      'finisher',
    ),
  }
}

function selectAssistant(
  state: LiveMatchState,
  attackingSide: MatchSide,
  finisher: Player,
  random: RandomGenerator,
  stats: PlayerMatchStats[],
): OptionalPlayerSelectionResult {
  const attackingTeam = getTeam(state, attackingSide)
  const hasAssist =
    attackingTeam.length > 1 &&
    random() < getAssistChance(state, attackingSide)

  if (!hasAssist) {
    return { stats }
  }

  const candidates = attackingTeam
    .filter((player) => player.id !== finisher.id)
    .map((player) => ({
      player,
      weightBreakdown: getAssistantWeightBreakdown(
        state,
        attackingSide,
        player,
      ),
    }))
  const selectedCandidate = selectWeightedPlayerCandidate(
    candidates,
    random,
  )
  const statsWithCandidates = recordDevCandidateMetrics(
    stats,
    attackingSide,
    candidates,
    'assistant',
  )

  return {
    player: selectedCandidate.player,
    weightBreakdown: selectedCandidate.weightBreakdown,
    stats: recordDevSelectedMetric(
      statsWithCandidates,
      attackingSide,
      selectedCandidate.player.id,
      'assistant',
    ),
  }
}

function wasChanceIncreaseDecisive(
  roll: number,
  chanceWithoutIncrease: number,
  finalChance: number,
): boolean {
  return (
    finalChance > chanceWithoutIncrease &&
    roll >= chanceWithoutIncrease &&
    roll < finalChance
  )
}

function getDecisiveGoalTraitImpactDescription(
  state: LiveMatchState,
  attackingSide: MatchSide,
  eventId: number,
  scorer: Player,
  conversionRoll: number,
  finalConversionChance: number,
  flowAdjustedGoalChance: number,
  synergyMultiplier: number,
  defensiveFlowConversionMultiplier: number,
  assistant?: Player,
): string | undefined {
  const traitContext = getTraitContext(state, attackingSide)
  const scorerConversionMultiplier =
    getTraitModifiers(scorer, traitContext).goalConversionMultiplier
  const assistantConversionMultiplier = assistant
    ? getTraitModifiers(
        assistant,
        traitContext,
      ).assistedShotConversionMultiplier
    : 1
  const scorerTraitWasDecisive =
    scorerConversionMultiplier > 1 &&
    wasChanceIncreaseDecisive(
      conversionRoll,
      clamp(
        clamp(
          flowAdjustedGoalChance *
            assistantConversionMultiplier *
            synergyMultiplier,
          0.04,
          0.92,
        ) *
          defensiveFlowConversionMultiplier,
        0.04,
        0.92,
      ),
      finalConversionChance,
    )
  const assistantTraitWasDecisive =
    Boolean(assistant) &&
    assistantConversionMultiplier > 1 &&
    wasChanceIncreaseDecisive(
      conversionRoll,
      clamp(
        clamp(
          flowAdjustedGoalChance *
            scorerConversionMultiplier *
            synergyMultiplier,
          0.04,
          0.92,
        ) *
          defensiveFlowConversionMultiplier,
        0.04,
        0.92,
      ),
      finalConversionChance,
    )

  return (
    (assistant && assistantTraitWasDecisive
      ? getTraitImpactMessage(
          assistant,
          'assistant',
          eventId,
          traitContext,
          {
            force: true,
          },
        )
      : undefined) ??
    (scorerTraitWasDecisive
      ? getTraitImpactMessage(scorer, 'finisher', eventId, traitContext, {
          force: true,
        })
      : undefined)
  )
}

function getDecisiveGoalSynergyImpactDescription(
  state: LiveMatchState,
  attackingSide: MatchSide,
  eventId: number,
  conversionRoll: number,
  finalConversionChance: number,
  chanceWithoutSynergy: number,
): string | undefined {
  if (
    !wasChanceIncreaseDecisive(
      conversionRoll,
      chanceWithoutSynergy,
      finalConversionChance,
    )
  ) {
    return undefined
  }

  return getSynergyImpactMessage(
    getTeam(state, attackingSide),
    'goal',
    eventId,
    {
      force: true,
    },
  )
}

function createGoalEvent(
  state: LiveMatchState,
  attackingSide: MatchSide,
  scorer: Player,
  assistant?: Player,
  impactDescriptions: GoalImpactDescriptions = {},
  currentStats: PlayerMatchStats[] = state.stats,
): {
  event: MatchEvent
  score: LiveMatchState['score']
  stats: PlayerMatchStats[]
} {
  const eventId = state.events.length + 1
  const score = {
    ...state.score,
    [attackingSide]: state.score[attackingSide] + 1,
  }
  let stats = updateStats(currentStats, attackingSide, scorer.id, {
    goals: 1,
    shots: 1,
  })

  if (assistant) {
    stats = updateStats(stats, attackingSide, assistant.id, {
      assists: 1,
    })
  }

  return {
    event: {
      id: eventId,
      type: 'goal',
      side: attackingSide,
      playerId: scorer.id,
      playerName: scorer.name,
      assistPlayerId: assistant?.id,
      assistPlayerName: assistant?.name,
      description: assistant
        ? `GOL! ${scorer.name} marcou após assistência de ${assistant.name}.`
        : `GOL! ${scorer.name} resolveu sozinho.`,
      traitImpactDescription: impactDescriptions.traitImpactDescription,
      synergyImpactDescription: impactDescriptions.synergyImpactDescription,
      scoreAfter: score,
    },
    score,
    stats,
  }
}

function createShotEvent(
  state: LiveMatchState,
  attackingSide: MatchSide,
  shooter: Player,
  currentStats: PlayerMatchStats[] = state.stats,
): {
  event: MatchEvent
  stats: PlayerMatchStats[]
} {
  const eventId = state.events.length + 1

  return {
    event: {
      id: eventId,
      type: 'shot',
      side: attackingSide,
      playerId: shooter.id,
      playerName: shooter.name,
      description: `${shooter.name} finalizou, mas não conseguiu marcar.`,
      traitImpactDescription: getTraitImpactMessage(
        shooter,
        'finisher',
        eventId,
        getTraitContext(state, attackingSide),
      ),
      synergyImpactDescription: getSynergyImpactMessage(
        getTeam(state, attackingSide),
        'finisher',
        eventId,
      ),
      scoreAfter: { ...state.score },
    },
    stats: updateStats(currentStats, attackingSide, shooter.id, {
      shots: 1,
    }),
  }
}

function createFinishingEvent(
  state: LiveMatchState,
  attackingSide: MatchSide,
  eventChances: { goal: number; shot: number },
  random: RandomGenerator,
): {
  event: MatchEvent
  score: LiveMatchState['score']
  stats: PlayerMatchStats[]
} {
  const finisherSelection = selectFinisher(state, attackingSide, random)
  const finisher = finisherSelection.player
  const assistantSelection = selectAssistant(
    state,
    attackingSide,
    finisher,
    random,
    finisherSelection.stats,
  )
  const assistant = assistantSelection.player
  const finisherWeight = finisherSelection.weightBreakdown
  const assistantWeight = assistantSelection.weightBreakdown
  const baseGoalChance = getBaseGoalConversionChance(MATCH_CONFIG.eventChance)
  const flowAdjustedGoalChance = getBaseGoalConversionChance(eventChances)
  const traitContext = getTraitContext(state, attackingSide)
  const attackingTeam = getTeam(state, attackingSide)
  const defendingSide = getOppositeSide(attackingSide)
  const defensiveFlowConversionMultiplier =
    getBestDefensiveFlowShotConversionMultiplier(state, defendingSide)
  const traitConversionMultiplier = getGoalConversionTraitMultiplier(
    finisher,
    assistant,
    traitContext,
  )
  const synergyConversionMultiplier = getTeamSynergyMultiplier(
    attackingTeam,
    'goalConversionBonus',
  )
  const goalChanceWithoutTraitBeforeDefensiveFlow = clamp(
    flowAdjustedGoalChance * synergyConversionMultiplier,
    0.04,
    0.92,
  )
  const goalChanceWithoutTrait = clamp(
    goalChanceWithoutTraitBeforeDefensiveFlow *
      defensiveFlowConversionMultiplier,
    0.04,
    0.92,
  )
  const goalChanceWithoutSynergyBeforeDefensiveFlow = clamp(
    flowAdjustedGoalChance * traitConversionMultiplier,
    0.04,
    0.92,
  )
  const goalChanceWithoutSynergy = clamp(
    goalChanceWithoutSynergyBeforeDefensiveFlow *
      defensiveFlowConversionMultiplier,
    0.04,
    0.92,
  )
  const conversionChanceBeforeDefensiveFlow = clamp(
    flowAdjustedGoalChance *
      traitConversionMultiplier *
      synergyConversionMultiplier,
    0.04,
    0.92,
  )
  // This is the only Defensive Flow application point: it reduces the
  // opponent's conversion after offensive Flow, traits and synergies are
  // already resolved, without changing the offensive Flow system.
  const conversionChance = clamp(
    conversionChanceBeforeDefensiveFlow * defensiveFlowConversionMultiplier,
    0.04,
    0.92,
  )
  const conversionRoll = random()
  const eventId = state.events.length + 1
  const traitImpactWasDecisive = wasChanceIncreaseDecisive(
    conversionRoll,
    goalChanceWithoutTrait,
    conversionChance,
  )
  const synergyImpactWasDecisive = wasChanceIncreaseDecisive(
    conversionRoll,
    goalChanceWithoutSynergy,
    conversionChance,
  )
  const traitImpactDescription = getDecisiveGoalTraitImpactDescription(
    state,
    attackingSide,
    eventId,
    finisher,
    conversionRoll,
    conversionChance,
    flowAdjustedGoalChance,
    synergyConversionMultiplier,
    defensiveFlowConversionMultiplier,
    assistant,
  )
  const synergyImpactDescription = getDecisiveGoalSynergyImpactDescription(
    state,
    attackingSide,
    eventId,
    conversionRoll,
    conversionChance,
    goalChanceWithoutSynergy,
  )
  let finishingEvent: {
    event: MatchEvent
    score: LiveMatchState['score']
    stats: PlayerMatchStats[]
  }

  if (conversionRoll < conversionChance) {
    finishingEvent = createGoalEvent(
      state,
      attackingSide,
      finisher,
      assistant,
      {
        traitImpactDescription,
        synergyImpactDescription,
      },
      assistantSelection.stats,
    )
  } else {
    const shotEvent = createShotEvent(
      state,
      attackingSide,
      finisher,
      assistantSelection.stats,
    )

    finishingEvent = {
      ...shotEvent,
      score: state.score,
    }
  }

  debugLog('event:generated', {
    attackingSide,
    finisher: finisher.name,
    finisherWeight: formatWeightForDebug(finisherWeight),
    assistant: assistant?.name ?? null,
    assistantWeight: formatWeightForDebug(assistantWeight),
    baseGoalChance: Number(baseGoalChance.toFixed(4)),
    flowAdjustedGoalChance: Number(flowAdjustedGoalChance.toFixed(4)),
    goalChanceWithoutTrait: Number(goalChanceWithoutTrait.toFixed(4)),
    goalChanceWithoutSynergy: Number(goalChanceWithoutSynergy.toFixed(4)),
    goalChanceBeforeDefensiveFlow: Number(
      conversionChanceBeforeDefensiveFlow.toFixed(4),
    ),
    defensiveFlowConversionMultiplier,
    finalGoalChance: Number(conversionChance.toFixed(4)),
    conversionRoll: Number(conversionRoll.toFixed(4)),
    traitImpactWasDecisive,
    synergyImpactWasDecisive,
    traitImpactShown: Boolean(finishingEvent.event.traitImpactDescription),
    synergyImpactShown: Boolean(finishingEvent.event.synergyImpactDescription),
    eventGenerated: {
      type: finishingEvent.event.type,
      player: finishingEvent.event.playerName,
      assist: finishingEvent.event.assistPlayerName ?? null,
      scoreAfter: finishingEvent.event.scoreAfter,
    },
  })

  return finishingEvent
}

function createDefenseEvent(
  state: LiveMatchState,
  attackingSide: MatchSide,
  random: RandomGenerator,
): {
  event: MatchEvent
  stats: PlayerMatchStats[]
} {
  const defendingSide = getOppositeSide(attackingSide)
  const candidates = getTeam(state, defendingSide).map((player) => ({
    player,
    weightBreakdown: getDefensiveWeightBreakdown(
      state,
      defendingSide,
      player,
    ),
  }))
  const selectedCandidate = selectWeightedPlayerCandidate(
    candidates,
    random,
  )
  const defender = selectedCandidate.player
  const statsWithCandidates = recordDevCandidateMetrics(
    state.stats,
    defendingSide,
    candidates,
    'defensive',
  )
  const statsWithSelection = recordDevSelectedMetric(
    statsWithCandidates,
    defendingSide,
    defender.id,
    'defensive',
  )
  const eventId = state.events.length + 1
  const defenderWeight = selectedCandidate.weightBreakdown
  const defensiveActionValue = getDefensiveActionValue(defender)

  debugLog('event:generated', {
    attackingSide,
    finisher: null,
    finisherWeight: null,
    assistant: null,
    baseGoalChance: null,
    finalGoalChance: null,
    defender: defender.name,
    defenderWeight: formatWeightForDebug(defenderWeight),
    eventGenerated: {
      type: 'defense',
      player: defender.name,
      scoreAfter: { ...state.score },
    },
  })

  return {
    event: {
      id: eventId,
      type: 'defense',
      side: defendingSide,
      playerId: defender.id,
      playerName: defender.name,
      traitImpactDescription: getTraitImpactMessage(
        defender,
        'defender',
        eventId,
        getTraitContext(state, defendingSide),
      ),
      synergyImpactDescription: getSynergyImpactMessage(
        getTeam(state, defendingSide),
        'defense',
        eventId,
      ),
      description: `${defender.name} fez uma ação defensiva decisiva e recuperou a posse.`,
      scoreAfter: { ...state.score },
    },
    stats: updateStats(statsWithSelection, defendingSide, defender.id, {
      defensiveActions: defensiveActionValue,
    }),
  }
}

export function advanceLiveMatch(
  state: LiveMatchState,
  random: RandomGenerator = Math.random,
): LiveMatchState {
  if (state.isFinished) {
    return state
  }

  const flowActivationState = tryActivateFlow(state, random)

  if (flowActivationState) {
    return flowActivationState
  }

  const attackingSide = state.counterAttackSide ?? selectAttackingSide(state, random)
  const eventChances = getEventChances(state, attackingSide)
  const eventRoll = random()
  let score = state.score
  let stats: PlayerMatchStats[]
  let event: MatchEvent

  if (eventRoll < getShotAttemptChance(eventChances)) {
    const finishingEvent = createFinishingEvent(
      state,
      attackingSide,
      eventChances,
      random,
    )
    event = finishingEvent.event
    score = finishingEvent.score
    stats = finishingEvent.stats
  } else {
    const defenseEvent = createDefenseEvent(state, attackingSide, random)
    event = defenseEvent.event
    stats = defenseEvent.stats
  }

  const winner: MatchSide | null =
    score.player >= MATCH_CONFIG.targetGoals
      ? 'player'
      : score.rival >= MATCH_CONFIG.targetGoals
        ? 'rival'
        : null

  const stateWithEvent = {
    ...state,
    score,
    stats,
    events: [...state.events, event],
    counterAttackSide: event.type === 'defense' ? event.side : undefined,
    isFinished: winner !== null,
    finishedAtMs:
      winner !== null ? (state.finishedAtMs ?? Date.now()) : undefined,
    winner,
  }
  const flowDurationUpdate = advanceFlowDurations(
    stateWithEvent,
    attackingSide,
  )

  return {
    ...stateWithEvent,
    activeFlows: flowDurationUpdate.activeFlows,
    events: flowDurationUpdate.events,
  }
}

export function forceMatchWinner(
  state: LiveMatchState,
  winner: MatchSide,
): LiveMatchState {
  if (state.isFinished) {
    return state
  }

  const loser = getOppositeSide(winner)

  return {
    ...state,
    score: {
      ...state.score,
      [winner]: Math.max(state.score[winner], MATCH_CONFIG.targetGoals),
      [loser]: Math.min(
        state.score[loser],
        MATCH_CONFIG.targetGoals - 1,
      ),
    },
    activeFlows: [],
    finishedAtMs: state.finishedAtMs ?? Date.now(),
    isFinished: true,
    winner,
  }
}

export function forceFlowActivation(
  state: LiveMatchState,
): LiveMatchState {
  if (state.isFinished) {
    return state
  }

  return tryActivateFlow(state, () => 0) ?? state
}

function isBetterMvpCandidate(
  candidate: PlayerMatchStats,
  currentBest: PlayerMatchStats,
  winnerTeam: MatchSide,
): boolean {
  if (candidate.rating !== currentBest.rating) {
    return candidate.rating > currentBest.rating
  }

  if (candidate.side !== currentBest.side) {
    return candidate.side === winnerTeam
  }

  if (candidate.goals !== currentBest.goals) {
    return candidate.goals > currentBest.goals
  }

  if (candidate.assists !== currentBest.assists) {
    return candidate.assists > currentBest.assists
  }

  if (candidate.defensiveActions !== currentBest.defensiveActions) {
    return candidate.defensiveActions > currentBest.defensiveActions
  }

  const candidateFlowBonus =
    candidate.flowActivations * MATCH_CONFIG.flow.mvpTieBreakBonus
  const currentBestFlowBonus =
    currentBest.flowActivations * MATCH_CONFIG.flow.mvpTieBreakBonus

  if (candidateFlowBonus !== currentBestFlowBonus) {
    return candidateFlowBonus > currentBestFlowBonus
  }

  return false
}

export function selectMatchMvp(
  stats: PlayerMatchStats[],
  winnerTeam: MatchSide,
): PlayerMatchStats {
  if (stats.length === 0) {
    throw new Error('Cannot select match MVP without player stats.')
  }

  return stats.reduce((currentBest, candidate) =>
    isBetterMvpCandidate(candidate, currentBest, winnerTeam)
      ? candidate
      : currentBest,
  )
}

export function getMatchMvp(
  stats: PlayerMatchStats[],
  winnerTeam: MatchSide,
): PlayerMatchStats {
  return selectMatchMvp(stats, winnerTeam)
}

export function createMatchResult(state: LiveMatchState): MatchResult {
  if (!state.isFinished || !state.winner) {
    throw new Error('The match must be finished before creating its result.')
  }

  const mvp = selectMatchMvp(state.stats, state.winner)
  const result = {
    playerTeam: state.playerTeam,
    rivalTeam: state.rivalTeam,
    playerStrength: state.playerStrength,
    rivalStrength: state.rivalStrength,
    score: state.score,
    winner: state.winner,
    upsetOccurred: state.upsetOccurred,
    events: state.events,
    stats: state.stats,
    flowActivated: state.flowActivated,
    flowActivations: state.flowActivations,
    durationMs:
      (state.finishedAtMs ?? Date.now()) - state.startedAtMs,
    mvp,
  }

  if (DEBUG_MODE && !loggedMatchResults.has(state)) {
    loggedMatchResults.add(state)
    debugLog('match:finished', {
      score: state.score,
      winner: state.winner,
      mvp: {
        player: mvp.player.name,
        side: mvp.side,
        rating: Number(mvp.rating.toFixed(2)),
        goals: mvp.goals,
        assists: mvp.assists,
        shots: mvp.shots,
        defensiveActions: mvp.defensiveActions,
        flowActivations: mvp.flowActivations,
      },
      finalStats: state.stats.map((playerStats) => ({
        player: playerStats.player.name,
        side: playerStats.side,
        goals: playerStats.goals,
        assists: playerStats.assists,
        shots: playerStats.shots,
        defensiveActions: playerStats.defensiveActions,
        flowActivations: playerStats.flowActivations,
        rating: Number(playerStats.rating.toFixed(2)),
      })),
      activeSynergies: {
        player: formatActiveSynergiesForDebug(state.playerTeam),
        rival: formatActiveSynergiesForDebug(state.rivalTeam),
      },
      impactedSynergies: [
        ...new Set(
          state.events
            .map((event) => event.synergyImpactDescription)
            .filter((description): description is string =>
              Boolean(description),
            ),
        ),
      ],
    })
  }

  return result
}

export function getNextEventDelay(
  simulationSpeed: SimulationSpeed = 1,
): number {
  return Math.round(MATCH_CONFIG.eventDelay.base / simulationSpeed)
}

export function simulateMatch(
  playerTeam: Player[],
  rivalTeam: Player[],
  random: RandomGenerator = Math.random,
): MatchResult {
  let state = initializeLiveMatch(playerTeam, rivalTeam, random)

  while (!state.isFinished) {
    state = advanceLiveMatch(state, random)
  }

  return createMatchResult(state)
}
