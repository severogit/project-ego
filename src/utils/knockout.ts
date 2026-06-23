import type { KnockoutPhase } from '../types/game'
import type { Player } from '../types/player'
import { calculateTeamPower } from './draft.ts'

interface RivalCandidate {
  team: Player[]
  power: number
  signature: string
}

export type KnockoutRival = RivalCandidate

export const KNOCKOUT_DIFFICULTY: Record<
  KnockoutPhase,
  { minimumPercentile: number; maximumPercentile: number }
> = {
  'knockout-quarter': {
    minimumPercentile: 0.2,
    maximumPercentile: 0.42,
  },
  'knockout-semi': {
    minimumPercentile: 0.55,
    maximumPercentile: 0.75,
  },
  'knockout-final': {
    minimumPercentile: 0.85,
    maximumPercentile: 1,
  },
}

type RandomGenerator = () => number

function createTeamSignature(team: Player[]): string {
  return team
    .map((player) => player.id)
    .sort((firstId, secondId) => firstId - secondId)
    .join('-')
}

function createTeamCombinations(
  playerPool: Player[],
  teamSize: number,
): Player[][] {
  const combinations: Player[][] = []

  function buildCombination(startIndex: number, currentTeam: Player[]) {
    if (currentTeam.length === teamSize) {
      combinations.push([...currentTeam])
      return
    }

    for (
      let index = startIndex;
      index <= playerPool.length - (teamSize - currentTeam.length);
      index += 1
    ) {
      currentTeam.push(playerPool[index])
      buildCombination(index + 1, currentTeam)
      currentTeam.pop()
    }
  }

  buildCombination(0, [])
  return combinations
}

export function generateKnockoutRival(
  playerPool: Player[],
  playerTeam: Player[],
  phase: KnockoutPhase,
  minimumPower = 0,
  excludedSignatures: string[] = [],
  random: RandomGenerator = Math.random,
): KnockoutRival {
  const playerTeamIds = new Set(playerTeam.map((player) => player.id))
  const excludedTeams = new Set(excludedSignatures)
  const availablePlayers = playerPool.filter(
    (player) => !playerTeamIds.has(player.id),
  )
  const candidates = createTeamCombinations(
    availablePlayers,
    playerTeam.length,
  )
    .map<RivalCandidate>((team) => ({
      team,
      power: calculateTeamPower(team),
      signature: createTeamSignature(team),
    }))
    .sort((firstCandidate, secondCandidate) => {
      if (firstCandidate.power !== secondCandidate.power) {
        return firstCandidate.power - secondCandidate.power
      }

      return firstCandidate.signature.localeCompare(secondCandidate.signature)
    })

  if (candidates.length === 0) {
    throw new Error('Not enough players to generate a knockout rival.')
  }

  const difficulty = KNOCKOUT_DIFFICULTY[phase]
  const lastCandidateIndex = candidates.length - 1
  const minimumIndex = Math.floor(
    lastCandidateIndex * difficulty.minimumPercentile,
  )
  const maximumIndex = Math.floor(
    lastCandidateIndex * difficulty.maximumPercentile,
  )
  const candidatesInRange = candidates
    .slice(minimumIndex, maximumIndex + 1)
    .filter(
      (candidate) =>
        candidate.power > minimumPower &&
        !excludedTeams.has(candidate.signature),
    )
  const fallbackCandidates = candidates.filter(
    (candidate) =>
      candidate.power > minimumPower &&
      !excludedTeams.has(candidate.signature),
  )
  const eligibleCandidates =
    candidatesInRange.length > 0 ? candidatesInRange : fallbackCandidates

  if (eligibleCandidates.length === 0) {
    throw new Error('No stronger knockout rival is available.')
  }

  const selectedIndex = Math.min(
    eligibleCandidates.length - 1,
    Math.floor(random() * eligibleCandidates.length),
  )

  return eligibleCandidates[selectedIndex]
}
