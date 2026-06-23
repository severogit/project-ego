export type GamePhase =
  | 'draft'
  | 'match-3v3'
  | 'recruit-after-3v3'
  | 'match-4v4'
  | 'recruit-after-4v4'
  | 'team-complete'
  | 'game-over'

export type MatchPhase = Extract<GamePhase, 'match-3v3' | 'match-4v4'>
export type RecruitPhase = Extract<
  GamePhase,
  'recruit-after-3v3' | 'recruit-after-4v4'
>
