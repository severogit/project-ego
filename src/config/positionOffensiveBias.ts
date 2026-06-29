export const POSITION_OFFENSIVE_BIAS: Record<string, number> = {
  Goalkeeper: 0.2,
  CenterBack: 0.8,
  'Center Back': 0.8,
  Defender: 0.8,
  LeftBack: 0.92,
  'Left Back': 0.92,
  RightBack: 0.92,
  'Right Back': 0.92,
  DefensiveMidfielder: 0.96,
  'Defensive Midfielder': 0.96,
  Midfielder: 1,
  AttackingMidfielder: 1.06,
  'Attacking Midfielder': 1.06,
  LeftWing: 1.1,
  'Left Wing': 1.1,
  RightWing: 1.1,
  'Right Wing': 1.1,
  Winger: 1.1,
  Forward: 1.15,
  Striker: 1.18,
} as const

export function getPositionOffensiveBias(position: string): number {
  return POSITION_OFFENSIVE_BIAS[position] ?? 1
}
