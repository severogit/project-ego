export type GamePhase =
  | 'draft'
  | 'match-3v3'
  | 'recruit-after-3v3'
  | 'match-4v4'
  | 'recruit-after-4v4'
  | 'match-5v5'
  | 'team-complete'
  | 'knockout-round-of-16'
  | 'knockout-quarter'
  | 'knockout-semi'
  | 'knockout-final'
  | 'world-five-transition'
  | 'world-five'
  | 'world-five-champion'
  | 'game-over'

export type MatchPhase = Extract<
  GamePhase,
  | 'match-3v3'
  | 'match-4v4'
  | 'match-5v5'
  | 'knockout-round-of-16'
  | 'knockout-quarter'
  | 'knockout-semi'
  | 'knockout-final'
  | 'world-five'
>
export type KnockoutPhase = Extract<
  GamePhase,
  | 'knockout-round-of-16'
  | 'knockout-quarter'
  | 'knockout-semi'
  | 'knockout-final'
>
export type RecruitPhase = Extract<
  GamePhase,
  'recruit-after-3v3' | 'recruit-after-4v4'
>

export type CampaignVictory =
  | 'match-3v3'
  | 'match-4v4'
  | 'match-5v5'
  | 'knockout-round-of-16'
  | 'knockout-quarter'
  | 'knockout-semi'
  | 'knockout-final'
  | 'world-five'
