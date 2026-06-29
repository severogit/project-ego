import { players } from '../data/players.ts'
import type { Player } from '../types/player'

export const WORLD_FIVE_PLAYER_IDS = [43, 44, 31, 45, 46] as const
export const WORLD_FIVE_PLAYER_NAMES = [
  'Adam Blake',
  'Dada Silva',
  'Julian Loki',
  'Leonardo Luna',
  'Pablo Cavasoz',
] as const

const worldFivePlayerIds = new Set<number>(WORLD_FIVE_PLAYER_IDS)

export function isWorldFivePlayer(player: Player): boolean {
  return worldFivePlayerIds.has(player.id)
}

export function getWorldFiveTeam(playerPool: Player[] = players): Player[] {
  return WORLD_FIVE_PLAYER_IDS.map((playerId) => {
    const player = playerPool.find((candidate) => candidate.id === playerId)

    if (!player) {
      throw new Error(`World Five player ${playerId} was not found.`)
    }

    return player
  })
}

export function getWorldFiveChallengePlayerPool(
  playerPool: Player[] = players,
): Player[] {
  return playerPool.filter((player) => !isWorldFivePlayer(player))
}
