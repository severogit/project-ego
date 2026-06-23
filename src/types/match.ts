import type { Player } from './player'

export interface TeamMatchStrength {
  basePower: number
  averageEgo: number
  randomFactor: number
  clutchBonus: number
  upsetBonus: number
  finalStrength: number
}

export interface MatchScore {
  player: number
  rival: number
}

export interface MatchResult {
  playerTeam: Player[]
  rivalTeam: Player[]
  playerStrength: TeamMatchStrength
  rivalStrength: TeamMatchStrength
  score: MatchScore
  winner: 'player' | 'rival'
  upsetOccurred: boolean
}
