import type {
  ActiveFlow,
  LiveMatchState,
  MatchEvent,
  MatchResult,
  MatchSide,
  PlayerMatchStats,
  TeamMatchStrength,
} from '../types/match'
import type { Player } from '../types/player'
import { calculateTeamPower } from './draft.ts'
import {
  getPlayerSynergyMultiplier,
  getSynergyImpactMessage,
  getTeamSynergyBonus,
  getTeamSynergyMultiplier,
} from './synergies.ts'
import {
  getAssistTraitWeight,
  getDefensiveActionTraitWeight,
  getFlowChanceTraitMultiplier,
  getGoalConversionTraitMultiplier,
  getShotTraitWeight,
  getTraitImpactMessage,
  type TraitContext,
} from './traits.ts'

export const MATCH_CONFIG = {
  targetGoals: 5,
  eventDelay: {
    base: 1000,
  },
  eventChance: {
    goal: 0.36,
    shot: 0.38,
    defense: 0.26,
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
    },
  },
} as const

export const SIMULATION_SPEED_OPTIONS = [1, 2, 4] as const

export type SimulationSpeed = (typeof SIMULATION_SPEED_OPTIONS)[number]
export type RandomGenerator = () => number

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

function createInitialStats(
  playerTeam: Player[],
  rivalTeam: Player[],
): PlayerMatchStats[] {
  return [
    ...playerTeam.map((player) => ({
      player,
      side: 'player' as const,
      goals: 0,
      assists: 0,
      shots: 0,
      defensiveActions: 0,
      flowActivations: 0,
      rating: 6,
    })),
    ...rivalTeam.map((player) => ({
      player,
      side: 'rival' as const,
      goals: 0,
      assists: 0,
      shots: 0,
      defensiveActions: 0,
      flowActivations: 0,
      rating: 6,
    })),
  ]
}

export function initializeLiveMatch(
  playerTeam: Player[],
  rivalTeam: Player[],
  random: RandomGenerator = Math.random,
): LiveMatchState {
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
    upsetOccurred,
    isFinished: false,
    winner: null,
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function selectWeightedPlayer(
  team: Player[],
  getWeight: (player: Player) => number,
  random: RandomGenerator,
  excludedPlayerId?: number,
): Player {
  const availablePlayers = team.filter(
    (player) => player.id !== excludedPlayerId,
  )
  const totalWeight = availablePlayers.reduce(
    (total, player) => total + Math.max(1, getWeight(player)),
    0,
  )
  let threshold = random() * totalWeight

  for (const player of availablePlayers) {
    threshold -= Math.max(1, getWeight(player))

    if (threshold < 0) {
      return player
    }
  }

  return availablePlayers[availablePlayers.length - 1]
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

function getOppositeSide(side: MatchSide): MatchSide {
  return side === 'player' ? 'rival' : 'player'
}

function getTeam(state: LiveMatchState, side: MatchSide): Player[] {
  return side === 'player' ? state.playerTeam : state.rivalTeam
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

  if (random() >= totalActivationChance) {
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
  if (!getActiveFlow(state, attackingSide)) {
    return MATCH_CONFIG.eventChance
  }

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

function getFinisherWeight(
  state: LiveMatchState,
  attackingSide: MatchSide,
  player: Player,
): number {
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

  return applyFlowParticipationWeight(
    state,
    attackingSide,
    player,
    synergyWeight,
  )
}

function getAssistantWeight(
  state: LiveMatchState,
  attackingSide: MatchSide,
  player: Player,
): number {
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

  return applyFlowParticipationWeight(
    state,
    attackingSide,
    player,
    synergyWeight,
  )
}

function selectFinisher(
  state: LiveMatchState,
  attackingSide: MatchSide,
  random: RandomGenerator,
): Player {
  return selectWeightedPlayer(
    getTeam(state, attackingSide),
    (player) => getFinisherWeight(state, attackingSide, player),
    random,
  )
}

function selectAssistant(
  state: LiveMatchState,
  attackingSide: MatchSide,
  finisher: Player,
  random: RandomGenerator,
): Player | undefined {
  const attackingTeam = getTeam(state, attackingSide)
  const hasAssist =
    attackingTeam.length > 1 &&
    random() < getAssistChance(state, attackingSide)

  return hasAssist
    ? selectWeightedPlayer(
        attackingTeam,
        (player) => getAssistantWeight(state, attackingSide, player),
        random,
        finisher.id,
      )
    : undefined
}

function getGoalTraitImpactDescription(
  state: LiveMatchState,
  attackingSide: MatchSide,
  eventId: number,
  scorer: Player,
  assistant?: Player,
): string | undefined {
  const traitContext = getTraitContext(state, attackingSide)

  return (
    (assistant
      ? getTraitImpactMessage(
          assistant,
          'assistant',
          eventId,
          traitContext,
        )
      : undefined) ??
    getTraitImpactMessage(scorer, 'finisher', eventId, traitContext)
  )
}

function getGoalSynergyImpactDescription(
  state: LiveMatchState,
  attackingSide: MatchSide,
  eventId: number,
  assistant?: Player,
): string | undefined {
  const attackingTeam = getTeam(state, attackingSide)

  return (
    (assistant
      ? getSynergyImpactMessage(attackingTeam, 'assist', eventId)
      : undefined) ??
    getSynergyImpactMessage(attackingTeam, 'goal', eventId) ??
    getSynergyImpactMessage(attackingTeam, 'finisher', eventId)
  )
}

function createGoalEvent(
  state: LiveMatchState,
  attackingSide: MatchSide,
  scorer: Player,
  assistant?: Player,
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
  let stats = updateStats(state.stats, attackingSide, scorer.id, {
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
      traitImpactDescription: getGoalTraitImpactDescription(
        state,
        attackingSide,
        eventId,
        scorer,
        assistant,
      ),
      synergyImpactDescription: getGoalSynergyImpactDescription(
        state,
        attackingSide,
        eventId,
        assistant,
      ),
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
    stats: updateStats(state.stats, attackingSide, shooter.id, {
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
  const finisher = selectFinisher(state, attackingSide, random)
  const assistant = selectAssistant(
    state,
    attackingSide,
    finisher,
    random,
  )
  const conversionChance = clamp(
    getBaseGoalConversionChance(eventChances) *
      getGoalConversionTraitMultiplier(
        finisher,
        assistant,
        getTraitContext(state, attackingSide),
      ) *
      getTeamSynergyMultiplier(
        getTeam(state, attackingSide),
        'goalConversionBonus',
      ),
    0.04,
    0.92,
  )

  if (random() < conversionChance) {
    return createGoalEvent(state, attackingSide, finisher, assistant)
  }

  const shotEvent = createShotEvent(state, attackingSide, finisher)

  return {
    ...shotEvent,
    score: state.score,
  }
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
  const defender = selectWeightedPlayer(
    getTeam(state, defendingSide),
    (player) => {
      const vision = getFlowAdjustedAttribute(
        state,
        defendingSide,
        player,
        'vision',
      )
      const baseWeight = player.defense * 0.7 + vision * 0.3
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

      return applyFlowParticipationWeight(
        state,
        defendingSide,
        player,
        synergyWeight,
      )
    },
    random,
  )
  const eventId = state.events.length + 1

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
      description: `${defender.name} fez uma ação defensiva decisiva.`,
      scoreAfter: { ...state.score },
    },
    stats: updateStats(state.stats, defendingSide, defender.id, {
      defensiveActions: 1,
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

  const attackingSide = selectAttackingSide(state, random)
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
    isFinished: winner !== null,
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

  return {
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
    mvp: selectMatchMvp(state.stats, state.winner),
  }
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
