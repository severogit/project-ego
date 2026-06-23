import type { Player } from '../types/player'

export interface Synergy {
  id: string
  name: string
  requiredArchetypes: string[]
  description: string
  effects: {
    goalConversionBonus?: number
    offensiveParticipationBonus?: number
    finisherSelectionBonus?: number
    assistChanceBonus?: number
    defensiveActionBonus?: number
    flowChanceBonus?: number
  }
}

export type SynergyEffectKey = keyof Synergy['effects']
export type SynergyImpactRole =
  | 'goal'
  | 'finisher'
  | 'assist'
  | 'defense'
  | 'flow'

type SynergyEffectTotals = Record<SynergyEffectKey, number>

export const SYNERGY_DEFINITIONS: Synergy[] = [
  {
    id: 'killer-pass',
    name: 'Killer Pass',
    requiredArchetypes: ['Playmaker', 'Finisher'],
    description: 'Criadores melhoram a eficiencia dos finalizadores.',
    effects: {
      goalConversionBonus: 0.1,
    },
  },
  {
    id: 'direct-path',
    name: 'Direct Path',
    requiredArchetypes: ['Visionary', 'Finisher'],
    description: 'Jogadores visionarios encontram o caminho ate o gol.',
    effects: {
      finisherSelectionBonus: 0.1,
    },
  },
  {
    id: 'speed-break',
    name: 'Speed Break',
    requiredArchetypes: ['Dribbler', 'Sprinter'],
    description: 'Velocidade e drible quebram linhas defensivas.',
    effects: {
      offensiveParticipationBonus: 0.12,
    },
  },
  {
    id: 'defensive-command',
    name: 'Defensive Command',
    requiredArchetypes: ['Defender', 'Leader'],
    description: 'Lideres defensivos organizam melhor a marcacao.',
    effects: {
      defensiveActionBonus: 0.15,
    },
  },
  {
    id: 'ego-trigger',
    name: 'Ego Trigger',
    requiredArchetypes: ['Playmaker', 'Egoist'],
    description: 'Criadores alimentam o ego dos finalizadores.',
    effects: {
      flowChanceBonus: 0.08,
    },
  },
  {
    id: 'unstoppable-talent',
    name: 'Unstoppable Talent',
    requiredArchetypes: ['Genius', 'Finisher'],
    description: 'Talento bruto aumenta o perigo ofensivo.',
    effects: {
      goalConversionBonus: 0.08,
    },
  },
]

const EMPTY_EFFECT_TOTALS: SynergyEffectTotals = {
  goalConversionBonus: 0,
  offensiveParticipationBonus: 0,
  finisherSelectionBonus: 0,
  assistChanceBonus: 0,
  defensiveActionBonus: 0,
  flowChanceBonus: 0,
}

const effectLabels: Record<SynergyEffectKey, string> = {
  goalConversionBonus: '+ conversao',
  offensiveParticipationBonus: '+ participacao ofensiva',
  finisherSelectionBonus: '+ finalizador',
  assistChanceBonus: '+ assistencias',
  defensiveActionBonus: '+ defesa',
  flowChanceBonus: '+ Flow',
}

const roleEffectKeys: Record<SynergyImpactRole, SynergyEffectKey[]> = {
  goal: ['goalConversionBonus'],
  finisher: ['finisherSelectionBonus', 'offensiveParticipationBonus'],
  assist: ['assistChanceBonus', 'offensiveParticipationBonus'],
  defense: ['defensiveActionBonus'],
  flow: ['flowChanceBonus'],
}

const impactPhrases: Record<string, Partial<Record<SynergyImpactRole, string>>> = {
  'killer-pass': {
    goal: 'Killer Pass ativou uma jogada decisiva.',
  },
  'direct-path': {
    finisher: 'Direct Path abriu espaco para a finalizacao.',
  },
  'speed-break': {
    finisher: 'Speed Break quebrou a linha defensiva.',
    assist: 'Speed Break acelerou a criacao da jogada.',
  },
  'defensive-command': {
    defense: 'Defensive Command fortaleceu a marcacao.',
  },
  'ego-trigger': {
    flow: 'Ego Trigger elevou a chance de FLOW.',
  },
  'unstoppable-talent': {
    goal: 'Unstoppable Talent aumentou o perigo da jogada.',
  },
}

export function getActiveSynergies(players: Player[]): Synergy[] {
  const archetypes = new Set(
    players.flatMap((player) => player.archetypes ?? []),
  )
  const activeSynergyIds = new Set<string>()

  return SYNERGY_DEFINITIONS.filter((synergy) => {
    if (activeSynergyIds.has(synergy.id)) {
      return false
    }

    const isActive = synergy.requiredArchetypes.every((archetype) =>
      archetypes.has(archetype),
    )

    if (isActive) {
      activeSynergyIds.add(synergy.id)
    }

    return isActive
  })
}

export function getSynergyEffectTotals(
  synergies: readonly Synergy[],
): SynergyEffectTotals {
  return synergies.reduce<SynergyEffectTotals>(
    (totals, synergy) => ({
      goalConversionBonus:
        totals.goalConversionBonus +
        (synergy.effects.goalConversionBonus ?? 0),
      offensiveParticipationBonus:
        totals.offensiveParticipationBonus +
        (synergy.effects.offensiveParticipationBonus ?? 0),
      finisherSelectionBonus:
        totals.finisherSelectionBonus +
        (synergy.effects.finisherSelectionBonus ?? 0),
      assistChanceBonus:
        totals.assistChanceBonus + (synergy.effects.assistChanceBonus ?? 0),
      defensiveActionBonus:
        totals.defensiveActionBonus +
        (synergy.effects.defensiveActionBonus ?? 0),
      flowChanceBonus:
        totals.flowChanceBonus + (synergy.effects.flowChanceBonus ?? 0),
    }),
    { ...EMPTY_EFFECT_TOTALS },
  )
}

export function getTeamSynergyMultiplier(
  players: Player[],
  effectKey: SynergyEffectKey,
): number {
  return 1 + getSynergyEffectTotals(getActiveSynergies(players))[effectKey]
}

export function getTeamSynergyBonus(
  players: Player[],
  effectKey: SynergyEffectKey,
): number {
  return getSynergyEffectTotals(getActiveSynergies(players))[effectKey]
}

export function getSynergyEffectSummary(synergy: Synergy): string {
  return Object.entries(synergy.effects)
    .filter(([, bonus]) => (bonus ?? 0) > 0)
    .map(([effectKey, bonus]) => {
      const percentage = Math.round((bonus ?? 0) * 100)

      return `${effectLabels[effectKey as SynergyEffectKey]} ${percentage}%`
    })
    .join(' / ')
}

function hasRelevantEffect(
  synergy: Synergy,
  role: SynergyImpactRole,
): boolean {
  return roleEffectKeys[role].some(
    (effectKey) => (synergy.effects[effectKey] ?? 0) > 0,
  )
}

function shouldShowSynergyImpact(
  synergy: Synergy,
  role: SynergyImpactRole,
  eventId: number,
): boolean {
  const seed = `${synergy.id}-${role}-${eventId}`
  const hash = [...seed].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )

  return hash % 100 < 45
}

export function getSynergyImpactMessage(
  players: Player[],
  role: SynergyImpactRole,
  eventId: number,
): string | undefined {
  const synergy = getActiveSynergies(players)
    .filter((synergy) => hasRelevantEffect(synergy, role))
    .find((synergy) => shouldShowSynergyImpact(synergy, role, eventId))

  return synergy ? impactPhrases[synergy.id]?.[role] : undefined
}
