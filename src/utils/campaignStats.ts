import type { MatchResult, PlayerMatchStats } from '../types/match'
import type { Player } from '../types/player'

export interface CampaignPlayerSummary {
  player: Player
  matches: number
  goals: number
  assists: number
  shots: number
  defensiveActions: number
  flowActivations: number
  mvpAwards: number
  ratingTotal: number
  averageRating: number
  impactScore: number
}

export interface CampaignTotals {
  goals: number
  assists: number
  defensiveActions: number
  flowActivations: number
}

export interface CampaignHighlights {
  mvp?: CampaignPlayerSummary
  topScorer?: CampaignPlayerSummary
  topAssistant?: CampaignPlayerSummary
  defensiveWall?: CampaignPlayerSummary
}

export interface CampaignStats {
  totals: CampaignTotals
  players: CampaignPlayerSummary[]
  highlights: CampaignHighlights
}

type NumericSummaryKey =
  | 'goals'
  | 'assists'
  | 'defensiveActions'
  | 'flowActivations'

function createEmptyPlayerSummary(player: Player): CampaignPlayerSummary {
  return {
    player,
    matches: 0,
    goals: 0,
    assists: 0,
    shots: 0,
    defensiveActions: 0,
    flowActivations: 0,
    mvpAwards: 0,
    ratingTotal: 0,
    averageRating: 0,
    impactScore: 0,
  }
}

function calculateImpactScore(summary: CampaignPlayerSummary): number {
  return (
    summary.ratingTotal +
    summary.goals * 3 +
    summary.assists * 2 +
    summary.defensiveActions * 1.25 +
    summary.flowActivations * 2 +
    summary.mvpAwards * 4 +
    summary.shots * 0.25
  )
}

function compareByMvpImpact(
  firstPlayer: CampaignPlayerSummary,
  secondPlayer: CampaignPlayerSummary,
): number {
  return (
    secondPlayer.impactScore - firstPlayer.impactScore ||
    secondPlayer.goals - firstPlayer.goals ||
    secondPlayer.assists - firstPlayer.assists ||
    secondPlayer.defensiveActions - firstPlayer.defensiveActions ||
    secondPlayer.flowActivations - firstPlayer.flowActivations ||
    secondPlayer.mvpAwards - firstPlayer.mvpAwards ||
    secondPlayer.averageRating - firstPlayer.averageRating ||
    firstPlayer.player.name.localeCompare(secondPlayer.player.name) ||
    firstPlayer.player.id - secondPlayer.player.id
  )
}

function compareByStat(stat: NumericSummaryKey) {
  return (
    firstPlayer: CampaignPlayerSummary,
    secondPlayer: CampaignPlayerSummary,
  ): number =>
    secondPlayer[stat] - firstPlayer[stat] ||
    secondPlayer.impactScore - firstPlayer.impactScore ||
    secondPlayer.averageRating - firstPlayer.averageRating ||
    firstPlayer.player.name.localeCompare(secondPlayer.player.name) ||
    firstPlayer.player.id - secondPlayer.player.id
}

function addPlayerMatchStats(
  currentSummary: CampaignPlayerSummary,
  matchStats: PlayerMatchStats,
  isMatchMvp: boolean,
): CampaignPlayerSummary {
  const nextSummary = {
    ...currentSummary,
    matches: currentSummary.matches + 1,
    goals: currentSummary.goals + matchStats.goals,
    assists: currentSummary.assists + matchStats.assists,
    shots: currentSummary.shots + matchStats.shots,
    defensiveActions:
      currentSummary.defensiveActions + matchStats.defensiveActions,
    flowActivations:
      currentSummary.flowActivations + matchStats.flowActivations,
    mvpAwards: currentSummary.mvpAwards + (isMatchMvp ? 1 : 0),
    ratingTotal: currentSummary.ratingTotal + matchStats.rating,
  }

  nextSummary.averageRating =
    nextSummary.matches === 0
      ? 0
      : nextSummary.ratingTotal / nextSummary.matches
  nextSummary.impactScore = calculateImpactScore(nextSummary)

  return nextSummary
}

export function getCampaignStats(results: MatchResult[]): CampaignStats {
  const playerSummaries = new Map<number, CampaignPlayerSummary>()
  const totals: CampaignTotals = {
    goals: 0,
    assists: 0,
    defensiveActions: 0,
    flowActivations: 0,
  }

  for (const result of results) {
    for (const matchStats of result.stats) {
      if (matchStats.side !== 'player') {
        continue
      }

      const currentSummary =
        playerSummaries.get(matchStats.player.id) ??
        createEmptyPlayerSummary(matchStats.player)
      const isMatchMvp =
        result.mvp.side === matchStats.side &&
        result.mvp.player.id === matchStats.player.id
      const nextSummary = addPlayerMatchStats(
        currentSummary,
        matchStats,
        isMatchMvp,
      )

      playerSummaries.set(matchStats.player.id, nextSummary)
      totals.goals += matchStats.goals
      totals.assists += matchStats.assists
      totals.defensiveActions += matchStats.defensiveActions
      totals.flowActivations += matchStats.flowActivations
    }
  }

  const players = [...playerSummaries.values()]

  return {
    totals,
    players,
    highlights: {
      mvp: [...players].sort(compareByMvpImpact)[0],
      topScorer: [...players].sort(compareByStat('goals'))[0],
      topAssistant: [...players].sort(compareByStat('assists'))[0],
      defensiveWall: [...players].sort(compareByStat('defensiveActions'))[0],
    },
  }
}
