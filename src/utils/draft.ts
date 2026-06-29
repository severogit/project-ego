import type { Player, Rarity } from '../types/player'

export const playerAttributes = [
  'attack',
  'speed',
  'vision',
  'dribble',
  'defense',
  'ego',
] as const

export type PlayerAttribute = (typeof playerAttributes)[number]
export type AttributeAverages = Record<PlayerAttribute, number>
export interface ChoiceImpact {
  attribute: PlayerAttribute
  value: number
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  Common: 40,
  Rare: 35,
  Epic: 13,
  Legendary: 8,
  Egoist: 4,
}

type RandomGenerator = () => number

function drawWeightedPlayer(
  playerPool: Player[],
  weights: Record<Rarity, number>,
  random: RandomGenerator,
): Player {
  const availableRarities = Object.keys(weights).filter((rarity) =>
    playerPool.some((player) => player.rarity === rarity),
  ) as Rarity[]
  const totalWeight = availableRarities.reduce(
    (total, rarity) => total + Math.max(0, weights[rarity]),
    0,
  )

  if (totalWeight <= 0) {
    throw new Error('At least one available rarity must have a positive weight.')
  }

  let threshold = random() * totalWeight
  let selectedRarity = availableRarities[availableRarities.length - 1]

  for (const rarity of availableRarities) {
    threshold -= Math.max(0, weights[rarity])

    if (threshold < 0) {
      selectedRarity = rarity
      break
    }
  }

  const rarityPlayers = playerPool.filter(
    (player) => player.rarity === selectedRarity,
  )
  const playerIndex = Math.floor(random() * rarityPlayers.length)

  return rarityPlayers[playerIndex]
}

export function drawWeightedPlayers(
  playerPool: Player[],
  amount: number,
  excludedIds: number[] = [],
  weights: Record<Rarity, number> = RARITY_WEIGHTS,
  random: RandomGenerator = Math.random,
): Player[] {
  const excludedPlayers = new Set(excludedIds)
  const availablePlayers = playerPool.filter(
    (player) => !excludedPlayers.has(player.id),
  )
  const selectedPlayers: Player[] = []
  const drawCount = Math.min(amount, availablePlayers.length)

  while (selectedPlayers.length < drawCount) {
    const selectedPlayer = drawWeightedPlayer(
      availablePlayers,
      weights,
      random,
    )
    const selectedPlayerIndex = availablePlayers.findIndex(
      (player) => player.id === selectedPlayer.id,
    )

    selectedPlayers.push(selectedPlayer)
    availablePlayers.splice(selectedPlayerIndex, 1)
  }

  return selectedPlayers
}

export function calculatePlayerPower(player: Player): number {
  return playerAttributes.reduce(
    (total, attribute) => total + player[attribute],
    0,
  )
}

export function calculateTeamPower(team: Player[]): number {
  return team.reduce(
    (total, player) => total + calculatePlayerPower(player),
    0,
  )
}

export function calculateChoiceImpact(
  team: Player[],
  player: Player,
  attributes: readonly PlayerAttribute[] = playerAttributes,
): ChoiceImpact[] {
  const teamSizeAfterSelection = Math.max(1, team.length + 1)

  return attributes.map((attribute) => ({
    attribute,
    value: Math.max(
      1,
      Math.round(player[attribute] / teamSizeAfterSelection),
    ),
  }))
}

export function calculateAttributeAverages(
  team: Player[],
): AttributeAverages {
  return playerAttributes.reduce<AttributeAverages>(
    (averages, attribute) => {
      const total = team.reduce(
        (attributeTotal, player) => attributeTotal + player[attribute],
        0,
      )

      averages[attribute] = team.length === 0 ? 0 : total / team.length
      return averages
    },
    {
      attack: 0,
      speed: 0,
      vision: 0,
      dribble: 0,
      defense: 0,
      ego: 0,
    },
  )
}
