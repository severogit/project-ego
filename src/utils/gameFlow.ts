import type { MatchPhase, RecruitPhase } from '../types/game'
import type { MatchResult } from '../types/match'

export function getPhaseAfterMatch(
  phase: MatchPhase,
  winner: MatchResult['winner'],
): RecruitPhase | 'game-over' {
  if (winner === 'rival') {
    return 'game-over'
  }

  return phase === 'match-3v3'
    ? 'recruit-after-3v3'
    : 'recruit-after-4v4'
}

export function getPhaseAfterRecruit(
  phase: RecruitPhase,
): 'match-4v4' | 'team-complete' {
  return phase === 'recruit-after-3v3' ? 'match-4v4' : 'team-complete'
}
