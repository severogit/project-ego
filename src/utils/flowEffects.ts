import type { Player, Rarity } from '../types/player'

export interface FlowEffects {
  opponentShotConversionMultiplier?: number
}

export const DEFENSIVE_FLOW_EFFECTS = {
  goalkeeperOpponentShotConversionMultiplier: 0.62,
  defensiveMidfielderOpponentShotConversionMultiplier: 0.9,
  defenderOpponentShotConversionMultiplierByRarity: {
    Common: 0.86,
    Rare: 0.82,
    Epic: 0.8,
    Legendary: 0.78,
    Egoist: 0.78,
  } satisfies Record<Rarity, number>,
  defenderPositions: [
    'CenterBack',
    'Center Back',
    'Defender',
    'LeftBack',
    'Left Back',
    'RightBack',
    'Right Back',
  ],
  defensiveMidfielderPositions: [
    'DefensiveMidfielder',
    'Defensive Midfielder',
  ],
} as const

const defenderPositions = new Set<string>(
  DEFENSIVE_FLOW_EFFECTS.defenderPositions,
)
const defensiveMidfielderPositions = new Set<string>(
  DEFENSIVE_FLOW_EFFECTS.defensiveMidfielderPositions,
)

// Defensive Flow Effects are temporary match-state effects: they exist only
// while Flow is active. Keep them separate from positionOffensiveBias, which is
// a permanent selection-bias config used only to shape offensive participation.
// Future tuning should happen by changing DEFENSIVE_FLOW_EFFECTS above.
export function getFlowEffects(player: Player): FlowEffects {
  if (player.position === 'Goalkeeper') {
    return {
      opponentShotConversionMultiplier:
        DEFENSIVE_FLOW_EFFECTS.goalkeeperOpponentShotConversionMultiplier,
    }
  }

  if (defensiveMidfielderPositions.has(player.position)) {
    return {
      opponentShotConversionMultiplier:
        DEFENSIVE_FLOW_EFFECTS
          .defensiveMidfielderOpponentShotConversionMultiplier,
    }
  }

  if (defenderPositions.has(player.position)) {
    return {
      opponentShotConversionMultiplier:
        DEFENSIVE_FLOW_EFFECTS
          .defenderOpponentShotConversionMultiplierByRarity[player.rarity],
    }
  }

  return {}
}
