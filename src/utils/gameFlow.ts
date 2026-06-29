import type { MatchPhase, RecruitPhase } from '../types/game'
import type { MatchResult } from '../types/match'

export function getPhaseAfterMatch(
  phase: MatchPhase,
  winner: MatchResult['winner'],
):
  | RecruitPhase
  | 'knockout-round-of-16'
  | 'knockout-quarter'
  | 'knockout-semi'
  | 'knockout-final'
  | 'world-five-transition'
  | 'world-five-champion'
  | 'game-over' {
  if (winner === 'rival') {
    return 'game-over'
  }

  switch (phase) {
    case 'match-3v3':
      return 'recruit-after-3v3'
    case 'match-4v4':
      return 'recruit-after-4v4'
    case 'match-5v5':
      return 'knockout-round-of-16'
    case 'knockout-round-of-16':
      return 'knockout-quarter'
    case 'knockout-quarter':
      return 'knockout-semi'
    case 'knockout-semi':
      return 'knockout-final'
    case 'knockout-final':
      return 'world-five-transition'
    case 'world-five':
      return 'world-five-champion'
  }
}

export function getPhaseAfterRecruit(
  phase: RecruitPhase,
): 'match-4v4' | 'match-5v5' {
  if (phase === 'recruit-after-3v3') {
    return 'match-4v4'
  }

  return 'match-5v5'
}

export const MATCH_PHASE_LABELS: Record<MatchPhase, string> = {
  'match-3v3': '3x3',
  'match-4v4': '4x4',
  'match-5v5': '5x5',
  'knockout-round-of-16': 'Oitavas de Final',
  'knockout-quarter': 'Quartas de Final',
  'knockout-semi': 'Semifinal',
  'knockout-final': 'Final',
  'world-five': 'World Five',
}
