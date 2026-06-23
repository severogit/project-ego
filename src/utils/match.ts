import type { MatchResult, TeamMatchStrength } from '../types/match'
import type { Player } from '../types/player'
import { calculateTeamPower } from './draft.ts'

export const MATCH_CONFIG = {
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
} as const

type RandomGenerator = () => number

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

function createScore(
  playerStrength: number,
  rivalStrength: number,
  random: RandomGenerator,
): {
  score: MatchResult['score']
  winner: MatchResult['winner']
} {
  let winner: MatchResult['winner']

  if (playerStrength === rivalStrength) {
    winner = random() < 0.5 ? 'player' : 'rival'
  } else {
    winner = playerStrength > rivalStrength ? 'player' : 'rival'
  }

  const strengthGap =
    Math.abs(playerStrength - rivalStrength) /
    Math.max(playerStrength, rivalStrength)
  const loserGoals = Math.floor(random() * 3)
  const goalAdvantage = Math.min(3, 1 + Math.floor(strengthGap * 8))
  const winnerGoals = loserGoals + goalAdvantage

  return {
    score:
      winner === 'player'
        ? { player: winnerGoals, rival: loserGoals }
        : { player: loserGoals, rival: winnerGoals },
    winner,
  }
}

export function simulateMatch(
  playerTeam: Player[],
  rivalTeam: Player[],
  random: RandomGenerator = Math.random,
): MatchResult {
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

  const { score, winner } = createScore(
    playerStrength.finalStrength,
    rivalStrength.finalStrength,
    random,
  )

  return {
    playerTeam,
    rivalTeam,
    playerStrength,
    rivalStrength,
    score,
    winner,
    upsetOccurred,
  }
}
