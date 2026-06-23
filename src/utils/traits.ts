import type { Player } from '../types/player'

export type TraitImpactRole = 'finisher' | 'assistant' | 'defender' | 'flow'

export interface TraitContext {
  isClutch?: boolean
}

export interface TraitModifiers {
  shotWeightMultiplier: number
  goalConversionMultiplier: number
  assistWeightMultiplier: number
  offensiveParticipationMultiplier: number
  defensiveActionWeightMultiplier: number
  flowChanceMultiplier: number
  assistedShotConversionMultiplier: number
}

interface TraitDefinition {
  summary: string
  modifiers?: Partial<TraitModifiers>
  clutchModifiers?: Partial<TraitModifiers>
  phrases?: Partial<Record<TraitImpactRole, (player: Player) => string>>
}

const DEFAULT_TRAIT_MODIFIERS: TraitModifiers = {
  shotWeightMultiplier: 1,
  goalConversionMultiplier: 1,
  assistWeightMultiplier: 1,
  offensiveParticipationMultiplier: 1,
  defensiveActionWeightMultiplier: 1,
  flowChanceMultiplier: 1,
  assistedShotConversionMultiplier: 1,
}

export const TRAIT_DEFINITIONS: Record<string, TraitDefinition> = {
  'Demon Striker': {
    summary: 'Demon Striker: + finalizacoes',
    modifiers: {
      shotWeightMultiplier: 1.4,
      goalConversionMultiplier: 1.25,
      assistWeightMultiplier: 0.1,
    },
    phrases: {
      finisher: (player) =>
        `${player.name} finaliza gracas ao Demon Striker.`,
    },
  },
  'Meta Vision': {
    summary: 'Meta Vision: + participacao',
    modifiers: {
      offensiveParticipationMultiplier: 1.25,
      assistWeightMultiplier: 1.25,
    },
    clutchModifiers: {
      flowChanceMultiplier: 1.1,
    },
    phrases: {
      assistant: (player) => `${player.name} le o campo com Meta Vision.`,
      flow: (player) => `${player.name} enxerga o jogo com Meta Vision.`,
    },
  },
  'Perfect Pass': {
    summary: 'Perfect Pass: + assistencias',
    modifiers: {
      assistWeightMultiplier: 1.4,
      assistedShotConversionMultiplier: 1.1,
    },
    phrases: {
      assistant: (player) => `${player.name} encontra um passe perfeito.`,
    },
  },
  'World Class Passer': {
    summary: 'World Class Passer: + assistencias',
    modifiers: {
      assistWeightMultiplier: 1.6,
      assistedShotConversionMultiplier: 1.15,
    },
    phrases: {
      assistant: (player) =>
        `${player.name} acha um passe de classe mundial.`,
    },
  },
  'The King': {
    summary: 'The King: + finalizacoes',
    modifiers: {
      shotWeightMultiplier: 1.35,
      goalConversionMultiplier: 1.15,
      assistWeightMultiplier: 0.6,
    },
    phrases: {
      finisher: (player) => `${player.name} toma a jogada com The King.`,
    },
  },
  'First Touch Genius': {
    summary: 'First Touch Genius: + conversao',
    modifiers: {
      goalConversionMultiplier: 1.25,
    },
    phrases: {
      finisher: (player) =>
        `${player.name} domina e finaliza com First Touch Genius.`,
    },
  },
  'Monster Dribble': {
    summary: 'Monster Dribble: + participacao',
    modifiers: {
      offensiveParticipationMultiplier: 1.3,
      assistWeightMultiplier: 1.15,
    },
    phrases: {
      finisher: (player) => `${player.name} cria espaco com Monster Dribble.`,
      assistant: (player) => `${player.name} quebra linhas com Monster Dribble.`,
    },
  },
  Destroyer: {
    summary: 'Destroyer: + ataque e defesa',
    modifiers: {
      shotWeightMultiplier: 1.15,
      defensiveActionWeightMultiplier: 1.15,
      flowChanceMultiplier: 1.1,
    },
    phrases: {
      finisher: (player) => `${player.name} ataca com Destroyer.`,
      defender: (player) => `${player.name} corta a jogada com Destroyer.`,
      flow: (player) => `${player.name} entra em FLOW com Destroyer.`,
    },
  },
  'Kaiser Impact': {
    summary: 'Kaiser Impact: + conversao',
    modifiers: {
      goalConversionMultiplier: 1.35,
      shotWeightMultiplier: 1.25,
    },
    phrases: {
      finisher: () => 'Kaiser Impact decide a jogada.',
    },
  },
  'Obsessive Support': {
    summary: 'Obsessive Support: + assistencias',
    modifiers: {
      assistWeightMultiplier: 1.35,
      assistedShotConversionMultiplier: 1.1,
    },
    phrases: {
      assistant: (player) => `${player.name} serve o finalizador com obsessao.`,
    },
  },
  'Wild Reflexes': {
    summary: 'Wild Reflexes: + defesa',
    modifiers: {
      defensiveActionWeightMultiplier: 1.35,
    },
    phrases: {
      defender: (player) => `${player.name} reage com Wild Reflexes.`,
    },
  },
  'Last Wall': {
    summary: 'Last Wall: + defesa',
    modifiers: {
      defensiveActionWeightMultiplier: 1.4,
    },
    phrases: {
      defender: (player) => `${player.name} bloqueia com Last Wall.`,
    },
  },
}

function getTraitName(player: Player): string | undefined {
  return player.trait?.name
}

export function getTraitDefinition(
  player: Player,
): TraitDefinition | undefined {
  const traitName = getTraitName(player)

  return traitName ? TRAIT_DEFINITIONS[traitName] : undefined
}

export function getTraitModifiers(
  player: Player,
  context: TraitContext = {},
): TraitModifiers {
  const definition = getTraitDefinition(player)

  if (!definition) {
    return DEFAULT_TRAIT_MODIFIERS
  }

  return {
    ...DEFAULT_TRAIT_MODIFIERS,
    ...definition.modifiers,
    ...(context.isClutch ? definition.clutchModifiers : undefined),
  }
}

export function getShotTraitWeight(
  player: Player,
  baseWeight: number,
  context: TraitContext = {},
): number {
  const modifiers = getTraitModifiers(player, context)

  return (
    baseWeight *
    modifiers.offensiveParticipationMultiplier *
    modifiers.shotWeightMultiplier
  )
}

export function getAssistTraitWeight(
  player: Player,
  baseWeight: number,
  context: TraitContext = {},
): number {
  const modifiers = getTraitModifiers(player, context)

  return (
    baseWeight *
    modifiers.offensiveParticipationMultiplier *
    modifiers.assistWeightMultiplier
  )
}

export function getDefensiveActionTraitWeight(
  player: Player,
  baseWeight: number,
  context: TraitContext = {},
): number {
  return (
    baseWeight *
    getTraitModifiers(player, context).defensiveActionWeightMultiplier
  )
}

export function getGoalConversionTraitMultiplier(
  finisher: Player,
  assistant?: Player,
  context: TraitContext = {},
): number {
  const finisherModifiers = getTraitModifiers(finisher, context)
  const assistantModifiers = assistant
    ? getTraitModifiers(assistant, context)
    : DEFAULT_TRAIT_MODIFIERS

  return (
    finisherModifiers.goalConversionMultiplier *
    assistantModifiers.assistedShotConversionMultiplier
  )
}

export function getFlowChanceTraitMultiplier(
  player: Player,
  context: TraitContext = {},
): number {
  return getTraitModifiers(player, context).flowChanceMultiplier
}

export function getTraitImpactSummary(player: Player): string {
  return getTraitDefinition(player)?.summary ?? '-'
}

function getRoleImpactMultiplier(
  player: Player,
  role: TraitImpactRole,
  context: TraitContext,
): number {
  const modifiers = getTraitModifiers(player, context)

  if (role === 'finisher') {
    return (
      modifiers.offensiveParticipationMultiplier *
      modifiers.shotWeightMultiplier *
      modifiers.goalConversionMultiplier
    )
  }

  if (role === 'assistant') {
    return (
      modifiers.offensiveParticipationMultiplier *
      modifiers.assistWeightMultiplier *
      modifiers.assistedShotConversionMultiplier
    )
  }

  if (role === 'defender') {
    return modifiers.defensiveActionWeightMultiplier
  }

  return modifiers.flowChanceMultiplier
}

function shouldShowTraitImpact(
  player: Player,
  role: TraitImpactRole,
  eventId: number,
  traitName: string,
): boolean {
  const seed = `${player.id}-${eventId}-${role}-${traitName}`
  const hash = [...seed].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )

  return hash % 100 < 55
}

export function getTraitImpactMessage(
  player: Player,
  role: TraitImpactRole,
  eventId: number,
  context: TraitContext = {},
): string | undefined {
  const traitName = getTraitName(player)
  const definition = getTraitDefinition(player)
  const phrase = definition?.phrases?.[role]

  if (
    !traitName ||
    !phrase ||
    getRoleImpactMultiplier(player, role, context) === 1 ||
    !shouldShowTraitImpact(player, role, eventId, traitName)
  ) {
    return undefined
  }

  return phrase(player)
}
