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

export interface UniqueSynergy {
  id: string
  name: string
  requiredPlayerIds: number[]
  requiredPlayerNames: string[]
  description: string
  effects: Synergy['effects']
}

export type SynergyEffectKey = keyof Synergy['effects']
export type SynergyImpactRole =
  | 'goal'
  | 'finisher'
  | 'assist'
  | 'defense'
  | 'flow'

type SynergyEffectTotals = Record<SynergyEffectKey, number>
export type TeamSynergy = Synergy | UniqueSynergy

export interface NewSynergyPreview {
  archetypeSynergies: Synergy[]
  uniqueSynergies: UniqueSynergy[]
}

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

export const UNIQUE_SYNERGY_DEFINITIONS: UniqueSynergy[] = [
  {
    id: 'perfect-duo',
    name: 'Perfect Duo',
    requiredPlayerIds: [5, 6],
    requiredPlayerNames: ['Nagi Seishiro', 'Mikage Reo'],
    description: 'Reo entende perfeitamente o talento de Nagi.',
    effects: {
      goalConversionBonus: 0.15,
    },
  },
  {
    id: 'chemical-reaction',
    name: 'Chemical Reaction',
    requiredPlayerIds: [9, 18],
    requiredPlayerNames: ['Shidou Ryusei', 'Itoshi Sae'],
    description: 'Sae encontra Shidou nas jogadas mais impossiveis.',
    effects: {
      goalConversionBonus: 0.2,
      assistChanceBonus: 0.15,
    },
  },
  {
    id: 'kaiser-system',
    name: 'Kaiser System',
    requiredPlayerIds: [19, 20],
    requiredPlayerNames: ['Michael Kaiser', 'Alexis Ness'],
    description: 'Ness vive para criar o cenario perfeito para Kaiser.',
    effects: {
      finisherSelectionBonus: 0.18,
      assistChanceBonus: 0.15,
    },
  },
  {
    id: 'itoshi-bloodline',
    name: 'Itoshi Bloodline',
    requiredPlayerIds: [8, 18],
    requiredPlayerNames: ['Rin Itoshi', 'Itoshi Sae'],
    description: 'Talento absurdo correndo no mesmo sangue.',
    effects: {
      offensiveParticipationBonus: 0.12,
      flowChanceBonus: 0.12,
    },
  },
  {
    id: 'meta-link',
    name: 'Meta Link',
    requiredPlayerIds: [1, 15],
    requiredPlayerNames: ['Isagi Yoichi', 'Hiori Yo'],
    description: 'Visao e passe se conectam em alta velocidade.',
    effects: {
      assistChanceBonus: 0.15,
      offensiveParticipationBonus: 0.1,
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
  'perfect-duo': {
    goal: 'Perfect Duo encontrou o momento perfeito.',
  },
  'chemical-reaction': {
    goal: 'Chemical Reaction explodiu na area.',
    assist: 'Chemical Reaction achou um passe impossivel.',
  },
  'kaiser-system': {
    finisher: 'Kaiser System criou a finalizacao ideal.',
    assist: 'Kaiser System organizou a jogada.',
  },
  'itoshi-bloodline': {
    finisher: 'Itoshi Bloodline acelerou a jogada.',
    flow: 'Itoshi Bloodline elevou o ego em campo.',
  },
  'meta-link': {
    assist: 'Meta Link abriu o caminho do gol.',
    finisher: 'Meta Link acelerou a leitura da jogada.',
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

export function getActiveUniqueSynergies(
  players: Player[],
): UniqueSynergy[] {
  const playerIds = new Set(players.map((player) => player.id))
  const activeSynergyIds = new Set<string>()

  return UNIQUE_SYNERGY_DEFINITIONS.filter((synergy) => {
    if (activeSynergyIds.has(synergy.id)) {
      return false
    }

    const isActive = synergy.requiredPlayerIds.every((playerId) =>
      playerIds.has(playerId),
    )

    if (isActive) {
      activeSynergyIds.add(synergy.id)
    }

    return isActive
  })
}

function getAllActiveSynergies(players: Player[]): TeamSynergy[] {
  return [...getActiveSynergies(players), ...getActiveUniqueSynergies(players)]
}

function isUniqueSynergy(synergy: TeamSynergy): synergy is UniqueSynergy {
  return 'requiredPlayerIds' in synergy
}

function getNewItemsById<T extends { id: string }>(
  currentItems: T[],
  nextItems: T[],
): T[] {
  const currentIds = new Set(currentItems.map((item) => item.id))

  return nextItems.filter((item) => !currentIds.has(item.id))
}

export function getNewSynergiesIfPlayerAdded(
  currentTeam: Player[],
  candidate: Player,
): NewSynergyPreview {
  const teamHasCandidate = currentTeam.some(
    (player) => player.id === candidate.id,
  )
  const nextTeam = teamHasCandidate
    ? currentTeam
    : [...currentTeam, candidate]

  return {
    archetypeSynergies: getNewItemsById(
      getActiveSynergies(currentTeam),
      getActiveSynergies(nextTeam),
    ),
    uniqueSynergies: getNewItemsById(
      getActiveUniqueSynergies(currentTeam),
      getActiveUniqueSynergies(nextTeam),
    ),
  }
}

export function getSynergyEffectTotals(
  synergies: readonly TeamSynergy[],
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
  return 1 + getSynergyEffectTotals(getAllActiveSynergies(players))[effectKey]
}

export function getTeamSynergyBonus(
  players: Player[],
  effectKey: SynergyEffectKey,
): number {
  return getSynergyEffectTotals(getAllActiveSynergies(players))[effectKey]
}

function appliesToPlayer(
  synergy: TeamSynergy,
  player: Player,
  effectKey: SynergyEffectKey,
): boolean {
  if ((synergy.effects[effectKey] ?? 0) <= 0) {
    return false
  }

  if (effectKey === 'finisherSelectionBonus') {
    if (!player.archetypes?.includes('Finisher')) {
      return false
    }

    return isUniqueSynergy(synergy)
      ? synergy.requiredPlayerIds.includes(player.id)
      : true
  }

  if (effectKey === 'defensiveActionBonus') {
    if (!player.archetypes?.includes('Defender')) {
      return false
    }

    return isUniqueSynergy(synergy)
      ? synergy.requiredPlayerIds.includes(player.id)
      : true
  }

  return true
}

export function getPlayerSynergyMultiplier(
  players: Player[],
  player: Player,
  effectKey: SynergyEffectKey,
): number {
  const bonus = getAllActiveSynergies(players).reduce(
    (total, synergy) =>
      appliesToPlayer(synergy, player, effectKey)
        ? total + (synergy.effects[effectKey] ?? 0)
        : total,
    0,
  )

  return 1 + bonus
}

export function getSynergyEffectSummary(
  synergy: TeamSynergy,
): string {
  return Object.entries(synergy.effects)
    .filter(([, bonus]) => (bonus ?? 0) > 0)
    .map(([effectKey, bonus]) => {
      const percentage = Math.round((bonus ?? 0) * 100)

      return `${effectLabels[effectKey as SynergyEffectKey]} ${percentage}%`
    })
    .join(' / ')
}

function hasRelevantEffect(
  synergy: TeamSynergy,
  role: SynergyImpactRole,
): boolean {
  return roleEffectKeys[role].some(
    (effectKey) => (synergy.effects[effectKey] ?? 0) > 0,
  )
}

function shouldShowSynergyImpact(
  synergy: TeamSynergy,
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
  const synergy = getAllActiveSynergies(players)
    .filter((synergy) => hasRelevantEffect(synergy, role))
    .find((synergy) => shouldShowSynergyImpact(synergy, role, eventId))

  return synergy ? impactPhrases[synergy.id]?.[role] : undefined
}
