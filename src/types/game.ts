export type GamePhase =
  | 'draft'
  | 'match-3v3'
  | 'recruit-after-3v3'
  | 'match-4v4'
  | 'recruit-after-4v4'
  | 'team-complete'
  | 'knockout-quarter'
  | 'knockout-semi'
  | 'knockout-final'
  | 'champion'
  | 'game-over'

export type MatchPhase = Extract<
  GamePhase,
  | 'match-3v3'
  | 'match-4v4'
  | 'knockout-quarter'
  | 'knockout-semi'
  | 'knockout-final'
>
export type KnockoutPhase = Extract<
  GamePhase,
  'knockout-quarter' | 'knockout-semi' | 'knockout-final'
>
export type RecruitPhase = Extract<
  GamePhase,
  'recruit-after-3v3' | 'recruit-after-4v4'
>

export type CampaignVictory =
  | 'match-3v3'
  | 'match-4v4'
  | 'knockout-quarter'
  | 'knockout-semi'
  | 'knockout-final'
