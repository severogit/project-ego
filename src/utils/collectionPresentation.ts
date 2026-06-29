import type { Player, Rarity } from '../types/player'
import {
  SYNERGY_DEFINITIONS,
  UNIQUE_SYNERGY_DEFINITIONS,
  type Synergy,
  type UniqueSynergy,
} from './synergies.ts'

export type FlowTier =
  | 'Muito Baixa'
  | 'Baixa'
  | 'Media'
  | 'Alta'
  | 'Muito Alta'

export interface FlowPresentation {
  tier: FlowTier
  activationLevel: number
  description: string
}

export interface PlayerRelatedSynergies {
  archetypeSynergies: Synergy[]
  uniqueSynergies: UniqueSynergy[]
}

export const COLLECTION_RARITY_ORDER: Rarity[] = [
  'Egoist',
  'Legendary',
  'Epic',
  'Rare',
  'Common',
]

const rarityRank = Object.fromEntries(
  COLLECTION_RARITY_ORDER.map((rarity, index) => [rarity, index]),
) as Record<Rarity, number>

const archetypeDisplayLabels: Record<string, string> = {
  Creator: 'Criativo',
  Defender: 'Defensor',
  Dribbler: 'Driblador',
  Duelist: 'Duelista',
  Egoist: 'Egoista',
  Finisher: 'Finalizador',
  Genius: 'Genio',
  Goalkeeper: 'Goleiro',
  Leader: 'Lider',
  Playmaker: 'Criador',
  Power: 'Fisico',
  Pressure: 'Pressao',
  Reactive: 'Reativo',
  Speedster: 'Velocista',
  Sprinter: 'Acelerador',
  Star: 'Estrela',
  Striker: 'Centroavante',
  Support: 'Suporte',
  Technician: 'Tecnico',
  Visionary: 'Visionario',
}

function hasArchetype(player: Player, archetype: string): boolean {
  return player.archetypes?.includes(archetype) ?? false
}

export function getDisplayArchetypeLabel(archetype: string): string {
  return archetypeDisplayLabels[archetype] ?? archetype
}

export function sortPlayersForCollection(
  playerList: readonly Player[],
): Player[] {
  return [...playerList].sort(
    (firstPlayer, secondPlayer) =>
      rarityRank[firstPlayer.rarity] - rarityRank[secondPlayer.rarity] ||
      firstPlayer.name.localeCompare(secondPlayer.name),
  )
}

export function getFlowPresentation(flowRate: number): FlowPresentation {
  if (flowRate >= 18) {
    return {
      tier: 'Muito Alta',
      activationLevel: 5,
      description: 'Entra em Flow com muita frequencia quando o ritmo sobe.',
    }
  }

  if (flowRate >= 16) {
    return {
      tier: 'Alta',
      activationLevel: 4,
      description: 'Tem boa tendencia a ativar Flow em momentos importantes.',
    }
  }

  if (flowRate >= 14) {
    return {
      tier: 'Media',
      activationLevel: 3,
      description: 'Ativa Flow de forma equilibrada ao longo da partida.',
    }
  }

  if (flowRate >= 12) {
    return {
      tier: 'Baixa',
      activationLevel: 2,
      description: 'Precisa de mais contexto de jogo para entrar em Flow.',
    }
  }

  return {
    tier: 'Muito Baixa',
    activationLevel: 1,
    description: 'Ativa Flow raramente, mesmo em partidas intensas.',
  }
}

export function getPlayerRelatedSynergies(
  player: Player,
): PlayerRelatedSynergies {
  const archetypes = new Set(player.archetypes ?? [])

  return {
    archetypeSynergies: SYNERGY_DEFINITIONS.filter((synergy) =>
      synergy.requiredArchetypes.some((archetype) =>
        archetypes.has(archetype),
      ),
    ),
    uniqueSynergies: UNIQUE_SYNERGY_DEFINITIONS.filter((synergy) =>
      synergy.requiredPlayerIds.includes(player.id),
    ),
  }
}

export function getPlayerIdentityDescription(player: Player): string {
  const traitText = player.trait
    ? ` com ${player.trait.name} como diferencial.`
    : '.'

  if (hasArchetype(player, 'Goalkeeper')) {
    return `Ultima linha de ${player.position.toLowerCase()} focada em leitura e protecao da area${traitText}`
  }

  if (hasArchetype(player, 'Leader') && hasArchetype(player, 'Defender')) {
    return `Lider defensivo especializado em organizacao e antecipacao${traitText}`
  }

  if (hasArchetype(player, 'Defender') || hasArchetype(player, 'Reactive')) {
    return `Especialista defensivo que antecipa jogadas e sustenta a equipe sem bola${traitText}`
  }

  if (
    hasArchetype(player, 'Visionary') ||
    hasArchetype(player, 'Playmaker') ||
    hasArchetype(player, 'Creator')
  ) {
    return `Especialista em leitura de jogo e criacao de oportunidades${traitText}`
  }

  if (
    hasArchetype(player, 'Dribbler') ||
    hasArchetype(player, 'Sprinter') ||
    hasArchetype(player, 'Speedster')
  ) {
    return `Velocidade e drible para quebrar linhas em transicao${traitText}`
  }

  if (
    hasArchetype(player, 'Finisher') ||
    hasArchetype(player, 'Striker') ||
    hasArchetype(player, 'Egoist')
  ) {
    return `Finalizador agressivo com alto potencial para decidir jogadas${traitText}`
  }

  if (
    hasArchetype(player, 'Power') ||
    hasArchetype(player, 'Duelist') ||
    hasArchetype(player, 'Pressure')
  ) {
    return `Presenca fisica para vencer duelos e impor ritmo${traitText}`
  }

  if (hasArchetype(player, 'Support') || hasArchetype(player, 'Technician')) {
    return `Conector tecnico que melhora a fluidez coletiva${traitText}`
  }

  return `Jogador de ${player.position.toLowerCase()} com identidade definida pela trait${traitText}`
}
