import type { Player } from './player'

export type MatchSide = 'player' | 'rival'
export type MatchEventType =
  | 'goal'
  | 'shot'
  | 'defense'
  | 'flow-activated'
  | 'flow-ended'

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

export interface PlayerMatchDevStats {
  offensiveCandidateCount: number
  finisherSelectedCount: number
  assistantCandidateCount: number
  assistantSelectedCount: number
  defensiveCandidateCount: number
  defensiveSelectedCount: number
  totalFinisherWeight: number
  totalAssistantWeight: number
  totalDefensiveWeight: number
}

export interface PlayerMatchStats {
  player: Player
  side: MatchSide
  goals: number
  assists: number
  shots: number
  defensiveActions: number
  flowActivations: number
  rating: number
  dev?: PlayerMatchDevStats
}

export interface ActiveFlow {
  side: MatchSide
  playerId: number
  playerName: string
  offensivePossessionsRemaining: number
  eventsRemaining: number
}

export interface MatchEvent {
  id: number
  type: MatchEventType
  side: MatchSide
  playerId: number
  playerName: string
  assistPlayerId?: number
  assistPlayerName?: string
  description: string
  traitImpactDescription?: string
  synergyImpactDescription?: string
  scoreAfter: MatchScore
}

export interface LiveMatchState {
  playerTeam: Player[]
  rivalTeam: Player[]
  playerStrength: TeamMatchStrength
  rivalStrength: TeamMatchStrength
  score: MatchScore
  events: MatchEvent[]
  stats: PlayerMatchStats[]
  activeFlows: ActiveFlow[]
  counterAttackSide?: MatchSide
  flowActivated: boolean
  flowActivations: number
  startedAtMs: number
  finishedAtMs?: number
  upsetOccurred: boolean
  isFinished: boolean
  winner: MatchSide | null
}

export interface MatchResult {
  playerTeam: Player[]
  rivalTeam: Player[]
  playerStrength: TeamMatchStrength
  rivalStrength: TeamMatchStrength
  score: MatchScore
  winner: MatchSide
  upsetOccurred: boolean
  events: MatchEvent[]
  stats: PlayerMatchStats[]
  flowActivated: boolean
  flowActivations: number
  durationMs: number
  mvp: PlayerMatchStats
}
