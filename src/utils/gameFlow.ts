import type { MatchPhase, RecruitPhase } from '../types/game'
import type { MatchResult } from '../types/match'

export function getPhaseAfterMatch(
  phase: MatchPhase,
  winner: MatchResult['winner'],
):
  | RecruitPhase
  | 'knockout-semi'
  | 'knockout-final'
  | 'champion'
  | 'game-over' {
  if (winner === 'rival') {
    return 'game-over'
  }

  switch (phase) {
    case 'match-3v3':
      return 'recruit-after-3v3'
    case 'match-4v4':
      return 'recruit-after-4v4'
    case 'knockout-quarter':
      return 'knockout-semi'
    case 'knockout-semi':
      return 'knockout-final'
    case 'knockout-final':
      return 'champion'
  }
}

export function getPhaseAfterRecruit(
  phase: RecruitPhase,
): 'match-4v4' | 'team-complete' {
  return phase === 'recruit-after-3v3' ? 'match-4v4' : 'team-complete'
}

export const MATCH_PHASE_LABELS: Record<MatchPhase, string> = {
  'match-3v3': '3x3',
  'match-4v4': '4x4',
  'knockout-quarter': 'Quartas de Final',
  'knockout-semi': 'Semifinal',
  'knockout-final': 'Final',
}
